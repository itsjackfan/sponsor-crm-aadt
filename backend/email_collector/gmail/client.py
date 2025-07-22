import logging
import base64
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from ..auth.supabase_auth import SupabaseAuthClient
from ..database.models import ThreadInfo, EmailMessage

logger = logging.getLogger(__name__)

class GmailClient:
    """Gmail API client for fetching emails and threads"""
    
    def __init__(self):
        self.auth_client = SupabaseAuthClient()
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Gmail API service"""
        try:
            credentials = self.auth_client.get_gmail_credentials()
            if credentials:
                self.service = build('gmail', 'v1', credentials=credentials)
                logger.info("Gmail service initialized successfully")
            else:
                logger.error("Failed to initialize Gmail service - no valid credentials")
        except Exception as e:
            logger.error(f"Error initializing Gmail service: {e}")
    
    def search_messages(self, query: str, max_results: int = 500) -> List[Dict[str, Any]]:
        """
        Search for messages using Gmail query syntax
        """
        if not self.service:
            logger.error("Gmail service not initialized")
            return []
        
        try:
            messages = []
            page_token = None
            
            while len(messages) < max_results:
                results = self.service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=min(500, max_results - len(messages)),
                    pageToken=page_token
                ).execute()
                
                if 'messages' in results:
                    messages.extend(results['messages'])
                
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
            
            logger.info(f"Found {len(messages)} messages for query: {query}")
            return messages[:max_results]
            
        except HttpError as e:
            logger.error(f"Gmail API error searching messages: {e}")
            return []
        except Exception as e:
            logger.error(f"Error searching messages: {e}")
            return []
    
    def get_message_details(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific message"""
        if not self.service:
            return None
        
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            return message
            
        except HttpError as e:
            logger.error(f"Gmail API error getting message {message_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting message details for {message_id}: {e}")
            return None
    
    def get_thread_details(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a thread including all messages"""
        if not self.service:
            return None
        
        try:
            thread = self.service.users().threads().get(
                userId='me',
                id=thread_id,
                format='full'
            ).execute()
            
            return thread
            
        except HttpError as e:
            logger.error(f"Gmail API error getting thread {thread_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting thread details for {thread_id}: {e}")
            return None
    
    def parse_message_headers(self, message: Dict[str, Any]) -> Dict[str, str]:
        """Extract important headers from a message"""
        headers = {}
        
        if 'payload' in message and 'headers' in message['payload']:
            for header in message['payload']['headers']:
                name = header['name'].lower()
                if name in ['from', 'to', 'subject', 'date', 'cc', 'bcc']:
                    headers[name] = header['value']
        
        return headers
    
    def extract_message_body(self, message: Dict[str, Any]) -> str:
        """Extract text content from message body"""
        def get_body_from_parts(parts):
            body = ""
            for part in parts:
                if part['mimeType'] == 'text/plain' and 'data' in part.get('body', {}):
                    body += base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                elif part['mimeType'] == 'text/html' and 'data' in part.get('body', {}):
                    # Prefer plain text, but use HTML if no plain text
                    if not body:
                        html_content = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        # Simple HTML tag removal (you might want to use a proper HTML parser)
                        import re
                        body = re.sub('<[^<]+?>', '', html_content)
                elif 'parts' in part:
                    body += get_body_from_parts(part['parts'])
            return body
        
        try:
            payload = message.get('payload', {})
            
            # Check if message has a direct body
            if 'body' in payload and 'data' in payload['body']:
                return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
            
            # Check if message has parts
            if 'parts' in payload:
                return get_body_from_parts(payload['parts'])
            
            # Fallback to snippet
            return message.get('snippet', '')
            
        except Exception as e:
            logger.error(f"Error extracting message body: {e}")
            return message.get('snippet', '')
    
    def parse_email_message(self, message: Dict[str, Any]) -> Optional[EmailMessage]:
        """Parse Gmail message into EmailMessage model"""
        try:
            headers = self.parse_message_headers(message)
            body_text = self.extract_message_body(message)
            
            # Parse date with timezone handling
            date_str = headers.get('date', '')
            try:
                # Gmail date format parsing
                from email.utils import parsedate_to_datetime
                received_date = parsedate_to_datetime(date_str)
                
                # Ensure timezone info is present
                if received_date.tzinfo is None:
                    received_date = received_date.replace(tzinfo=timezone.utc)
                    
            except Exception as e:
                logger.warning(f"Error parsing date '{date_str}': {e}")
                received_date = datetime.now(timezone.utc)
            
            # Extract sender info
            from_header = headers.get('from', '')
            sender_email = from_header
            sender_name = from_header
            
            # Try to separate name and email
            if '<' in from_header and '>' in from_header:
                name_part = from_header.split('<')[0].strip().strip('"')
                email_part = from_header.split('<')[1].split('>')[0].strip()
                sender_name = name_part if name_part else email_part
                sender_email = email_part
            
            # Parse recipients
            recipients = []
            for header_name in ['to', 'cc', 'bcc']:
                if header_name in headers:
                    recipients.extend([addr.strip() for addr in headers[header_name].split(',')])
            
            return EmailMessage(
                gmail_message_id=message['id'],
                sender_email=sender_email,
                sender_name=sender_name,
                recipients=recipients,
                subject=headers.get('subject', 'No Subject'),
                body_text=body_text,
                snippet=message.get('snippet', ''),
                received_date=received_date,
                is_from_user=False  # Will be determined by sender email comparison
            )
            
        except Exception as e:
            logger.error(f"Error parsing message {message.get('id', 'unknown')}: {e}")
            return None