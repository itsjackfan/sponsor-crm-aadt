import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from supabase import create_client, Client
from .models import EmailThread, EmailMessage, ProcessingResult
from email_collector.config import Config

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_SERVICE_KEY
        )
    
    def _serialize_datetimes(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert datetime objects to ISO strings for Supabase compatibility"""
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                # Convert to UTC and format as ISO string
                if value.tzinfo is None:
                    # Assume UTC if no timezone info
                    value = value.replace(tzinfo=timezone.utc)
                serialized_data[key] = value.isoformat()
            elif isinstance(value, list) and value and isinstance(value[0], datetime):
                # Handle list of datetimes
                serialized_data[key] = [
                    dt.isoformat() if dt.tzinfo else dt.replace(tzinfo=timezone.utc).isoformat()
                    for dt in value
                ]
            else:
                serialized_data[key] = value
        return serialized_data

    async def save_thread(self, thread: EmailThread) -> Optional[str]:
        """Save or update an email thread with deduplication"""
        try:
            # First check if thread already exists by Gmail Thread ID
            existing_by_id = self.client.table("email_threads").select("id").eq(
                "gmail_thread_id", thread.gmail_thread_id
            ).execute()

            # Then check if thread exists by participant signature (for deduplication)
            existing_by_participants = None
            if thread.participant_signature:
                existing_by_participants = self.client.table("email_threads").select("id").eq(
                    "participant_signature", thread.participant_signature
                ).execute()

            thread_data = thread.model_dump(exclude={"id", "created_at", "updated_at"})
            
            # Convert datetime objects to ISO strings for Supabase
            thread_data = self._serialize_datetimes(thread_data)

            # Update existing thread (prioritize Gmail Thread ID match)
            if existing_by_id.data:
                # Update by Gmail Thread ID
                result = self.client.table("email_threads").update(
                    thread_data
                ).eq("gmail_thread_id", thread.gmail_thread_id).execute()

                if result.data:
                    logger.info(f"Updated thread by Gmail ID {thread.gmail_thread_id}")
                    return result.data[0]["id"]
                    
            elif existing_by_participants and existing_by_participants.data:
                # Update by participant signature (same participants, different thread)
                existing_id = existing_by_participants.data[0]["id"]
                result = self.client.table("email_threads").update(
                    thread_data
                ).eq("id", existing_id).execute()

                if result.data:
                    logger.info(f"Updated thread by participants {thread.participant_signature}")
                    return existing_id
            else:
                # Insert new thread
                result = self.client.table("email_threads").insert(thread_data).execute()

                if result.data:
                    logger.info(f"Created new thread {thread.gmail_thread_id}")
                    return result.data[0]["id"]

        except Exception as e:
            logger.error(f"Error saving thread {thread.gmail_thread_id}: {e}")
            return None

    async def save_message(self, message: EmailMessage) -> Optional[str]:
        """Save an email message"""
        try:
            # Check if message already exists
            existing = self.client.table("email_messages").select("id").eq(
                "gmail_message_id", message.gmail_message_id
            ).execute()

            if existing.data:
                logger.debug(f"Message {message.gmail_message_id} already exists")
                return existing.data[0]["id"]

            message_data = message.model_dump(exclude={"id", "created_at"})
            
            # Convert datetime objects to ISO strings for Supabase
            message_data = self._serialize_datetimes(message_data)

            result = self.client.table("email_messages").insert(message_data).execute()

            if result.data:
                logger.info(f"Created new message {message.gmail_message_id}")
                return result.data[0]["id"]

        except Exception as e:
            logger.error(f"Error saving message {message.gmail_message_id}: {e}")
            return None

    async def get_existing_thread_ids(self) -> List[str]:
        """Get list of existing Gmail thread IDs"""
        try:
            result = self.client.table("email_threads").select("gmail_thread_id").execute()
            return [row["gmail_thread_id"] for row in result.data]
        except Exception as e:
            logger.error(f"Error fetching existing thread IDs: {e}")
            return []
    
    async def get_existing_participant_signatures(self) -> List[str]:
        """Get list of existing participant signatures for deduplication"""
        try:
            result = self.client.table("email_threads").select("participant_signature").execute()
            return [row["participant_signature"] for row in result.data if row["participant_signature"]]
        except Exception as e:
            logger.error(f"Error fetching existing participant signatures: {e}")
            return []
    
    async def find_thread_by_participant_signature(self, signature: str) -> Optional[str]:
        """Find existing thread by participant signature"""
        try:
            result = self.client.table("email_threads").select("id").eq(
                "participant_signature", signature
            ).execute()
            
            if result.data:
                return result.data[0]["id"]
            return None
        except Exception as e:
            logger.error(f"Error finding thread by participant signature: {e}")
            return None

    async def get_threads_for_processing(self, limit: int = 100) -> List[EmailThread]:
        """Get threads that need LLM processing"""
        try:
            result = self.client.table("email_threads").select("*").eq(
                "llm_processed", False
            ).limit(limit).execute()

            return [EmailThread(**row) for row in result.data]
        except Exception as e:
            logger.error(f"Error fetching threads for processing: {e}")
            return []

    async def get_thread_messages(self, thread_id: str) -> List[EmailMessage]:
        """Get all messages for a thread"""
        try:
            result = self.client.table("email_messages").select("*").eq(
                "thread_id", thread_id
            ).order("received_date", desc=False).execute()

            return [EmailMessage(**row) for row in result.data]
        except Exception as e:
            logger.error(f"Error fetching messages for thread {thread_id}: {e}")
            return []

    async def update_thread_llm_data(self, thread_id: str, llm_data: Dict[str, Any]) -> bool:
        """Update thread with LLM-extracted data"""
        try:
            update_data = {
                **llm_data,
                "llm_processed": True,
                "llm_processed_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Serialize any datetime objects in llm_data
            update_data = self._serialize_datetimes(update_data)

            result = self.client.table("email_threads").update(update_data).eq(
                "id", thread_id
            ).execute()

            if result.data:
                logger.info(f"Updated thread {thread_id} with LLM data")
                return True
            return False

        except Exception as e:
            logger.error(f"Error updating thread {thread_id} with LLM data: {e}")
            return False

    async def get_thread_statistics(self) -> Dict[str, Any]:
        """Get basic statistics about stored threads"""
        try:
            # Total threads
            total_result = self.client.table("email_threads").select("id", count="exact").execute()
            total_threads = total_result.count

            # Unprocessed threads
            unprocessed_result = self.client.table("email_threads").select(
                "id", count="exact"
            ).eq("llm_processed", False).execute()
            unprocessed_threads = unprocessed_result.count

            # High priority threads
            high_priority_result = self.client.table("email_threads").select(
                "id", count="exact"
            ).in_("priority_level", ["READ_NOW", "REPLY_NOW"]).execute()
            high_priority_threads = high_priority_result.count

            return {
                "total_threads": total_threads,
                "unprocessed_threads": unprocessed_threads,
                "high_priority_threads": high_priority_threads,
                "processed_threads": total_threads - unprocessed_threads
            }

        except Exception as e:
            logger.error(f"Error fetching thread statistics: {e}")
            return {
                "total_threads": 0,
                "unprocessed_threads": 0,
                "high_priority_threads": 0,
                "processed_threads": 0
            }
