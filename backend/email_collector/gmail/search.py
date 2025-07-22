import logging
from typing import List, Dict, Any, Set
from datetime import datetime, timezone
from collections import defaultdict
from .client import GmailClient
from ..database.models import ThreadInfo, EmailMessage, EmailThread
from ..config import Config
from ..utils.keywords import KeywordMatcher
from ..utils.participants import ParticipantProcessor

logger = logging.getLogger(__name__)

class EmailSearcher:
    """Handles searching and organizing Gmail threads for sponsorship emails"""

    def __init__(self):
        self.gmail_client = GmailClient()
        self.keyword_matcher = KeywordMatcher()

    def build_search_query(self) -> str:
        """Build Gmail search query for sponsorship-related emails - focusing on subject lines"""
        # Create subject-specific searches for better precision
        subject_terms = []
        for keyword in Config.SPONSORSHIP_KEYWORDS:
            subject_terms.append(f'subject:"{keyword}"')

        # Combine with OR - search only in subject lines
        keyword_query = ' OR '.join(subject_terms)

        # Date filter (after July 14, 2024)
        date_filter = Config.COLLECTION_START_DATE.strftime("%Y/%m/%d")

        # Combine query parts - focus on subject line to reduce noise
        query = f'({keyword_query}) after:{date_filter}'

        logger.info(f"Built subject-focused search query: {query}")
        return query

    def search_sponsorship_emails(self, max_results: int = None) -> List[Dict[str, Any]]:
        """Search for sponsorship-related emails"""
        if max_results is None:
            max_results = Config.MAX_RESULTS_PER_QUERY

        query = self.build_search_query()
        messages = self.gmail_client.search_messages(query, max_results)

        logger.info(f"Found {len(messages)} potential sponsorship messages")
        return messages

    def group_messages_by_thread(self, messages: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group messages by thread ID"""
        threads = defaultdict(list)

        for message in messages:
            thread_id = message.get('threadId')
            if thread_id:
                threads[thread_id].append(message)

        logger.info(f"Grouped {len(messages)} messages into {len(threads)} threads")
        return dict(threads)

    def get_detailed_thread_info(self, thread_id: str) -> ThreadInfo:
        """Get detailed information about a thread"""
        try:
            thread_data = self.gmail_client.get_thread_details(thread_id)
            if not thread_data:
                return None

            messages = thread_data.get('messages', [])
            if not messages:
                return None

            # Extract participants and filter user email
            raw_participants = set()
            first_message_date = None
            last_message_date = None
            subject = ""

            for message in messages:
                headers = self.gmail_client.parse_message_headers(message)

                # Collect participants
                for header_name in ['from', 'to', 'cc']:
                    if header_name in headers:
                        raw_participants.add(headers[header_name])

            # Process participants: filter user email and normalize
            participants_list = ParticipantProcessor.filter_user_emails(list(raw_participants))
            normalized_participants = ParticipantProcessor.normalize_participants(participants_list)

            # Continue processing messages for dates and subject
            for message in messages:
                headers = self.gmail_client.parse_message_headers(message)

                # Get subject from first message
                if not subject and 'subject' in headers:
                    subject = headers['subject']

                # Track message dates with timezone handling
                date_str = headers.get('date', '')
                if date_str:
                    try:
                        from email.utils import parsedate_to_datetime
                        msg_date = parsedate_to_datetime(date_str)

                        # Ensure timezone info
                        if msg_date.tzinfo is None:
                            msg_date = msg_date.replace(tzinfo=timezone.utc)

                        if first_message_date is None or msg_date < first_message_date:
                            first_message_date = msg_date
                        if last_message_date is None or msg_date > last_message_date:
                            last_message_date = msg_date
                    except Exception as e:
                        logger.warning(f"Error parsing message date '{date_str}': {e}")
                        pass

            # Fallback dates with timezone
            if not first_message_date:
                first_message_date = datetime.now(timezone.utc)
            if not last_message_date:
                last_message_date = first_message_date

            return ThreadInfo(
                thread_id=thread_id,
                messages=messages,
                subject=subject or "No Subject",
                participants=normalized_participants,
                first_message_date=first_message_date,
                last_message_date=last_message_date
            )

        except Exception as e:
            logger.error(f"Error getting thread info for {thread_id}: {e}")
            return None

    def convert_to_email_thread(self, thread_info: ThreadInfo) -> EmailThread:
        """Convert ThreadInfo to EmailThread model"""
        try:
            gmail_thread_url = f"https://mail.google.com/mail/u/1/#all/{thread_info.thread_id}"

            # Create participant signature for deduplication
            participant_signature = ParticipantProcessor.create_participant_signature(thread_info.participants)

            return EmailThread(
                gmail_thread_id=thread_info.thread_id,
                subject=thread_info.subject,
                participants=thread_info.participants,
                participant_signature=participant_signature,
                first_message_date=thread_info.first_message_date,
                last_message_date=thread_info.last_message_date,
                message_count=len(thread_info.messages),
                gmail_thread_url=gmail_thread_url,
                status='new'
            )

        except Exception as e:
            logger.error(f"Error converting thread info to EmailThread: {e}")
            return None

    def parse_thread_messages(self, thread_info: ThreadInfo) -> List[EmailMessage]:
        """Parse all messages in a thread"""
        messages = []

        for message_data in thread_info.messages:
            email_message = self.gmail_client.parse_email_message(message_data)
            if email_message:
                messages.append(email_message)

        return messages

    def filter_existing_threads(self, thread_ids: List[str], existing_thread_ids: Set[str]) -> tuple[List[str], List[str]]:
        """Filter threads into new and existing (potentially updated) threads"""
        new_thread_ids = [tid for tid in thread_ids if tid not in existing_thread_ids]
        existing_thread_ids_found = [tid for tid in thread_ids if tid in existing_thread_ids]

        logger.info(f"Filtered {len(thread_ids)} threads: {len(new_thread_ids)} new, {len(existing_thread_ids_found)} existing (potential updates)")
        return new_thread_ids, existing_thread_ids_found

    def search_and_organize_threads(self, existing_thread_ids: Set[str] = None) -> tuple[List[ThreadInfo], List[ThreadInfo]]:
        """
        Main method to search for sponsorship emails and organize them into threads
        Returns: (new_threads, existing_threads_with_updates)
        """
        if existing_thread_ids is None:
            existing_thread_ids = set()

        # Search for messages
        messages = self.search_sponsorship_emails()
        if not messages:
            logger.warning("No sponsorship messages found")
            return [], []

        # Group by threads
        thread_groups = self.group_messages_by_thread(messages)

        # Filter into new and existing threads
        new_thread_ids, existing_thread_ids_found = self.filter_existing_threads(
            list(thread_groups.keys()),
            existing_thread_ids
        )

        # Get detailed thread information for new threads
        new_thread_infos = []
        for thread_id in new_thread_ids:
            thread_info = self.get_detailed_thread_info(thread_id)
            if thread_info:
                new_thread_infos.append(thread_info)
            else:
                logger.warning(f"Could not get details for new thread {thread_id}")

        # Get detailed thread information for existing threads (potential updates)
        existing_thread_infos = []
        for thread_id in existing_thread_ids_found:
            thread_info = self.get_detailed_thread_info(thread_id)
            if thread_info:
                existing_thread_infos.append(thread_info)
            else:
                logger.warning(f"Could not get details for existing thread {thread_id}")

        logger.info(f"Successfully processed {len(new_thread_infos)} new threads and {len(existing_thread_infos)} existing threads with potential updates")
        return new_thread_infos, existing_thread_infos
