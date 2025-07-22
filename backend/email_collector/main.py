#!/usr/bin/env python3
"""
Email Collector Main Script

This script collects sponsorship-related emails from Gmail, processes them with Gemini AI,
and stores the structured data in Supabase.

Usage:
    python main.py [--collect-only] [--process-only] [--dry-run]
"""

import asyncio
import logging
import argparse
from datetime import datetime
from typing import List, Set

from email_collector.config import Config
from email_collector.database.client import SupabaseClient
from email_collector.database.models import ProcessingResult, EmailThread, EmailMessage
from email_collector.gmail.search import EmailSearcher
from email_collector.llm.gemini_client import GeminiProcessor
from email_collector.utils.priority import PriorityCalculator

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailCollector:
    """Main orchestrator for email collection and processing"""

    def __init__(self):
        self.db_client = SupabaseClient()
        self.email_searcher = EmailSearcher()
        self.gemini_processor = GeminiProcessor()

    async def collect_new_emails(self, dry_run: bool = False) -> ProcessingResult:
        """
        Collect new sponsorship emails from Gmail

        Args:
            dry_run: If True, don't save to database

        Returns:
            ProcessingResult with collection statistics
        """
        logger.info("Starting email collection process...")

        result = ProcessingResult(
            success=False,
            threads_processed=0,
            messages_processed=0,
            new_threads=0,
            updated_threads=0
        )

        try:
            # Validate configuration
            Config.validate()

            # Get existing thread IDs to avoid duplicates
            existing_thread_ids: Set[str] = set(await self.db_client.get_existing_thread_ids())
            logger.info(f"Found {len(existing_thread_ids)} existing threads in database")

            # Search for new and existing sponsorship threads
            new_thread_infos, existing_thread_infos = self.email_searcher.search_and_organize_threads(existing_thread_ids)

            if not new_thread_infos and not existing_thread_infos:
                logger.info("No new or updated sponsorship threads found")
                result.success = True
                return result

            logger.info(f"Found {len(new_thread_infos)} new threads and {len(existing_thread_infos)} existing threads to process")

            # Process new threads
            for thread_info in new_thread_infos:
                try:
                    # Convert to EmailThread model
                    email_thread = self.email_searcher.convert_to_email_thread(thread_info)
                    if not email_thread:
                        logger.warning(f"Failed to convert thread {thread_info.thread_id}")
                        continue

                    # Parse messages
                    messages = self.email_searcher.parse_thread_messages(thread_info)
                    if not messages:
                        logger.warning(f"No valid messages in thread {thread_info.thread_id}")
                        continue

                    # Determine which messages are from user vs external
                    # This is a simple heuristic - you may need to adjust based on your email
                    user_email_domains = set()  # You can configure this
                    for message in messages:
                        # Simple check - if sender domain matches recipient domain pattern
                        # This needs to be customized for your specific setup
                        message.is_from_user = False  # Default to external

                    if not dry_run:
                        # Save thread to database
                        thread_id = await self.db_client.save_thread(email_thread)
                        if thread_id:
                            result.new_threads += 1

                            # Save messages
                            for message in messages:
                                message.thread_id = thread_id
                                message_id = await self.db_client.save_message(message)
                                if message_id:
                                    result.messages_processed += 1

                        logger.info(f"Saved thread {email_thread.gmail_thread_id} with {len(messages)} messages")
                    else:
                        logger.info(f"[DRY RUN] Would save thread {email_thread.gmail_thread_id} with {len(messages)} messages")
                        result.new_threads += 1
                        result.messages_processed += len(messages)

                    result.threads_processed += 1

                except Exception as e:
                    logger.error(f"Error processing new thread {thread_info.thread_id}: {e}")
                    result.errors.append(f"New thread {thread_info.thread_id}: {str(e)}")

            # Process existing threads (potential updates)
            for thread_info in existing_thread_infos:
                try:
                    # Convert to EmailThread model
                    email_thread = self.email_searcher.convert_to_email_thread(thread_info)
                    if not email_thread:
                        logger.warning(f"Failed to convert existing thread {thread_info.thread_id}")
                        continue

                    # Parse messages
                    messages = self.email_searcher.parse_thread_messages(thread_info)
                    if not messages:
                        logger.warning(f"No valid messages in existing thread {thread_info.thread_id}")
                        continue

                    # Determine which messages are from user vs external
                    user_email_domains = set()  # You can configure this
                    for message in messages:
                        message.is_from_user = False  # Default to external

                    if not dry_run:
                        # Update existing thread in database (this will update with new message count, dates, etc.)
                        thread_id = await self.db_client.save_thread(email_thread)
                        if thread_id:
                            result.updated_threads += 1

                            # Check for new messages and save them
                            for message in messages:
                                message.thread_id = thread_id
                                message_id = await self.db_client.save_message(message)
                                if message_id:
                                    result.messages_processed += 1

                        logger.info(f"Updated existing thread {email_thread.gmail_thread_id} with {len(messages)} messages")
                    else:
                        logger.info(f"[DRY RUN] Would update existing thread {email_thread.gmail_thread_id} with {len(messages)} messages")
                        result.updated_threads += 1
                        result.messages_processed += len(messages)

                    result.threads_processed += 1

                except Exception as e:
                    logger.error(f"Error processing existing thread {thread_info.thread_id}: {e}")
                    result.errors.append(f"Existing thread {thread_info.thread_id}: {str(e)}")

            result.success = True
            logger.info(f"Collection complete: {result.new_threads} new threads, {result.updated_threads} updated threads, {result.messages_processed} messages")

        except Exception as e:
            logger.error(f"Error in email collection: {e}")
            result.errors.append(f"Collection error: {str(e)}")

        return result

    async def process_with_llm(self, dry_run: bool = False, limit: int = 100) -> ProcessingResult:
        """
        Process unprocessed threads with Gemini AI

        Args:
            dry_run: If True, don't save results to database
            limit: Maximum number of threads to process

        Returns:
            ProcessingResult with processing statistics
        """
        logger.info("Starting LLM processing...")

        result = ProcessingResult(
            success=False,
            threads_processed=0,
            messages_processed=0,
            updated_threads=0
        )

        try:
            # Get unprocessed threads
            unprocessed_threads = await self.db_client.get_threads_for_processing(limit)

            if not unprocessed_threads:
                logger.info("No threads need LLM processing")
                result.success = True
                return result

            logger.info(f"Processing {len(unprocessed_threads)} threads with LLM")

            for thread in unprocessed_threads:
                try:
                    # Get thread messages
                    messages = await self.db_client.get_thread_messages(thread.id)
                    if not messages:
                        logger.warning(f"No messages found for thread {thread.id}")
                        continue

                    # Extract sponsor information with Gemini
                    sponsor_info = self.gemini_processor.extract_sponsor_info(thread, messages)

                    if sponsor_info:
                        # Calculate additional metrics
                        priority_level, priority_reasoning = PriorityCalculator.calculate_overall_priority(thread, messages)

                        # Generate action summary
                        action_summary = self.gemini_processor.generate_action_summary(thread, messages)

                        # Prepare update data
                        llm_data = {
                            "sponsor_poc_name": sponsor_info.poc_name,
                            "sponsor_org_name": sponsor_info.org_name,
                            "estimated_value_amount": sponsor_info.estimated_value_amount,
                            "value_type": sponsor_info.value_type,
                            "value_description": sponsor_info.value_description,
                            "sponsor_confidence_score": sponsor_info.confidence_score,
                            "priority_level": priority_level,
                            "auto_priority_reasoning": priority_reasoning,
                            "last_action_summary": action_summary,
                            "next_action_status": sponsor_info.next_action_status,
                            "next_action_description": sponsor_info.next_action_description,
                        }

                        if not dry_run:
                            # Update thread in database
                            success = await self.db_client.update_thread_llm_data(thread.id, llm_data)
                            if success:
                                result.updated_threads += 1
                                logger.info(f"Updated thread {thread.gmail_thread_id} with LLM data")
                            else:
                                logger.error(f"Failed to update thread {thread.gmail_thread_id}")
                        else:
                            logger.info(f"[DRY RUN] Would update thread {thread.gmail_thread_id} with LLM data")
                            result.updated_threads += 1
                    else:
                        logger.warning(f"Failed to extract sponsor info for thread {thread.gmail_thread_id}")

                    result.threads_processed += 1

                except Exception as e:
                    logger.error(f"Error processing thread {thread.id} with LLM: {e}")
                    result.errors.append(f"Thread {thread.id}: {str(e)}")

            result.success = True
            logger.info(f"LLM processing complete: {result.updated_threads} threads updated")

        except Exception as e:
            logger.error(f"Error in LLM processing: {e}")
            result.errors.append(f"LLM processing error: {str(e)}")

        return result

    async def run_full_pipeline(self, dry_run: bool = False) -> ProcessingResult:
        """
        Run the complete email collection and processing pipeline

        Args:
            dry_run: If True, don't save to database

        Returns:
            Combined ProcessingResult
        """
        logger.info("Starting full email processing pipeline...")

        # Step 1: Collect new emails
        collection_result = await self.collect_new_emails(dry_run)

        # Step 2: Process with LLM
        processing_result = await self.process_with_llm(dry_run)

        # Combine results
        combined_result = ProcessingResult(
            success=collection_result.success and processing_result.success,
            threads_processed=collection_result.threads_processed + processing_result.threads_processed,
            messages_processed=collection_result.messages_processed,
            new_threads=collection_result.new_threads,
            updated_threads=processing_result.updated_threads,
            errors=collection_result.errors + processing_result.errors
        )

        # Print summary
        logger.info("=" * 50)
        logger.info("PIPELINE SUMMARY")
        logger.info("=" * 50)
        logger.info(f"New threads collected: {combined_result.new_threads}")
        logger.info(f"Messages processed: {combined_result.messages_processed}")
        logger.info(f"Threads updated with LLM: {combined_result.updated_threads}")
        logger.info(f"Total errors: {len(combined_result.errors)}")

        if combined_result.errors:
            logger.warning("Errors encountered:")
            for error in combined_result.errors:
                logger.warning(f"  - {error}")

        return combined_result

async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Email Collector for Sponsorship CRM')
    parser.add_argument('--collect-only', action='store_true',
                       help='Only collect emails, skip LLM processing')
    parser.add_argument('--process-only', action='store_true',
                       help='Only run LLM processing on existing threads')
    parser.add_argument('--dry-run', action='store_true',
                       help='Run without saving to database')

    args = parser.parse_args()

    collector = EmailCollector()

    try:
        if args.collect_only:
            result = await collector.collect_new_emails(args.dry_run)
        elif args.process_only:
            result = await collector.process_with_llm(args.dry_run)
        else:
            result = await collector.run_full_pipeline(args.dry_run)

        # Exit with appropriate code
        exit_code = 0 if result.success else 1
        logger.info(f"Script completed with exit code {exit_code}")
        return exit_code

    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
