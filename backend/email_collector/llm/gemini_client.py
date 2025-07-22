import logging
import json
from typing import List, Optional
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from ..database.models import EmailMessage, EmailThread, SponsorInfo
from ..config import Config
from .prompts import SponsorshipPrompts

logger = logging.getLogger(__name__)

class GeminiProcessor:
    """Handles Gemini AI processing for sponsor information extraction"""
    
    def __init__(self):
        self.prompts = SponsorshipPrompts()
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize Gemini AI client"""
        try:
            genai.configure(api_key=Config.GEMINI_API_KEY)
            
            # Configure model
            self.model = genai.GenerativeModel(
                model_name=Config.GEMINI_MODEL,
                generation_config={
                    "temperature": Config.GEMINI_TEMPERATURE,
                    "max_output_tokens": Config.GEMINI_MAX_OUTPUT_TOKENS,
                    "response_mime_type": "application/json"
                },
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
            
            logger.info("Gemini client initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Gemini client: {e}")
            raise
    
    def format_thread_for_analysis(self, thread: EmailThread, messages: List[EmailMessage]) -> str:
        """Format thread and messages into a text prompt for analysis"""
        try:
            # Sort messages by date
            sorted_messages = sorted(messages, key=lambda m: m.received_date)
            
            formatted_thread = f"""
THREAD SUBJECT: {thread.subject}
THREAD PARTICIPANTS: {', '.join(thread.participants)}
FIRST MESSAGE: {thread.first_message_date.strftime('%Y-%m-%d %H:%M')}
LAST MESSAGE: {thread.last_message_date.strftime('%Y-%m-%d %H:%M')}
TOTAL MESSAGES: {len(messages)}

MESSAGES:
"""
            
            for i, message in enumerate(sorted_messages, 1):
                formatted_thread += f"""
--- MESSAGE {i} ---
FROM: {message.sender_name} <{message.sender_email}>
TO: {', '.join(message.recipients)}
DATE: {message.received_date.strftime('%Y-%m-%d %H:%M')}
SUBJECT: {message.subject}

CONTENT:
{message.body_text[:2000]}  # Limit content length
{'...' if len(message.body_text) > 2000 else ''}

"""
            
            return formatted_thread
            
        except Exception as e:
            logger.error(f"Error formatting thread for analysis: {e}")
            return f"Error formatting thread: {str(e)}"
    
    def extract_sponsor_info(self, thread: EmailThread, messages: List[EmailMessage]) -> Optional[SponsorInfo]:
        """Extract sponsor information from thread using Gemini"""
        try:
            # Format thread for analysis
            thread_content = self.format_thread_for_analysis(thread, messages)
            
            # Get prompt
            prompt = self.prompts.get_sponsor_extraction_prompt(thread_content)
            
            # Call Gemini
            response = self.model.generate_content(prompt)
            
            if not response.text:
                logger.warning(f"Empty response from Gemini for thread {thread.gmail_thread_id}")
                return None
            
            # Parse JSON response
            try:
                result_data = json.loads(response.text)
                sponsor_info = SponsorInfo(**result_data)
                
                logger.info(f"Successfully extracted sponsor info for thread {thread.gmail_thread_id}")
                return sponsor_info
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini JSON response: {e}")
                logger.debug(f"Raw response: {response.text}")
                return None
            except Exception as e:
                logger.error(f"Failed to create SponsorInfo model: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting sponsor info for thread {thread.gmail_thread_id}: {e}")
            return None
    
    def analyze_priority(self, thread: EmailThread, messages: List[EmailMessage]) -> str:
        """Analyze thread priority and return reasoning"""
        try:
            # Get the most recent message
            latest_message = max(messages, key=lambda m: m.received_date)
            
            # Calculate time since last message
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            hours_since = (now - latest_message.received_date.replace(tzinfo=timezone.utc)).total_seconds() / 3600
            
            # Determine if latest message is from user or external
            is_waiting_for_response = not latest_message.is_from_user
            
            # Basic priority logic
            if is_waiting_for_response:
                if hours_since > 72:  # 3 days
                    return "REPLY_NOW - No response for over 3 days"
                elif hours_since > 24:  # 1 day
                    return "REPLY_NOW - No response for over 24 hours"
                else:
                    return "NORMAL - Recent incoming message"
            else:
                if hours_since > 168:  # 1 week
                    return "READ_NOW - Sent message over a week ago, check for response"
                else:
                    return "NORMAL - Recently sent message"
                    
        except Exception as e:
            logger.error(f"Error analyzing priority: {e}")
            return "NORMAL - Error in priority analysis"
    
    def generate_action_summary(self, thread: EmailThread, messages: List[EmailMessage]) -> str:
        """Generate a summary of the last action in the thread"""
        try:
            if not messages:
                return "No messages in thread"
            
            # Get the most recent message
            latest_message = max(messages, key=lambda m: m.received_date)
            
            # Calculate time since
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            time_diff = now - latest_message.received_date.replace(tzinfo=timezone.utc)
            
            # Format time difference
            if time_diff.days > 0:
                time_str = f"{time_diff.days} days ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours} hours ago"
            else:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes} minutes ago"
            
            # Create summary
            if latest_message.is_from_user:
                return f"Sent message {time_str}"
            else:
                return f"{latest_message.sender_name} replied {time_str}"
                
        except Exception as e:
            logger.error(f"Error generating action summary: {e}")
            return "Unable to determine last action"