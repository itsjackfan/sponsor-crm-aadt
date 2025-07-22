from datetime import datetime, timezone
from typing import List, Tuple
from ..database.models import EmailMessage, EmailThread

class PriorityCalculator:
    """Helper functions for calculating email thread priority"""
    
    @staticmethod
    def calculate_time_based_priority(last_message_date: datetime, is_waiting_for_response: bool) -> Tuple[str, str]:
        """
        Calculate priority based on time since last message and response status
        
        Returns:
            Tuple of (priority_level, reasoning)
        """
        now = datetime.now(timezone.utc)
        last_message_utc = last_message_date.replace(tzinfo=timezone.utc)
        time_diff = now - last_message_utc
        hours_since = time_diff.total_seconds() / 3600
        days_since = time_diff.days
        
        if is_waiting_for_response:
            # Someone sent us a message and we haven't responded
            if hours_since > 72:  # 3 days
                return "REPLY_NOW", f"No response for {days_since} days - urgent follow-up needed"
            elif hours_since > 48:  # 2 days
                return "REPLY_NOW", f"No response for {days_since} days - response overdue"
            elif hours_since > 24:  # 1 day
                return "REPLY_NOW", f"Response needed - message received {days_since} day(s) ago"
            elif hours_since > 4:  # 4 hours
                return "NORMAL", f"Recent message received {int(hours_since)} hours ago"
            else:
                return "NORMAL", f"Very recent message received"
        else:
            # We sent the last message - waiting for their response
            if days_since > 14:  # 2 weeks
                return "READ_NOW", f"Sent message {days_since} days ago - check for response or follow up"
            elif days_since > 7:  # 1 week
                return "NORMAL", f"Sent message {days_since} days ago - may need follow-up"
            elif days_since > 3:  # 3 days
                return "NORMAL", f"Sent message {days_since} days ago - waiting for response"
            else:
                return "LOW", f"Recently sent message {days_since} day(s) ago"
    
    @staticmethod
    def analyze_content_urgency(messages: List[EmailMessage]) -> Tuple[str, str]:
        """
        Analyze message content for urgency indicators
        
        Returns:
            Tuple of (priority_level, reasoning)
        """
        if not messages:
            return "NORMAL", "No messages to analyze"
        
        # Combine all message content
        all_content = ""
        for message in messages:
            all_content += f"{message.subject} {message.body_text} "
        
        content_lower = all_content.lower()
        
        # High urgency indicators
        urgent_keywords = [
            'urgent', 'asap', 'immediately', 'deadline', 'time sensitive',
            'expires', 'limited time', 'act fast', 'closing soon',
            'final notice', 'last chance'
        ]
        
        medium_urgency_keywords = [
            'soon', 'quickly', 'prompt', 'timely', 'follow up',
            'waiting', 'response needed', 'please respond'
        ]
        
        # Check for urgent keywords
        urgent_found = [keyword for keyword in urgent_keywords if keyword in content_lower]
        if urgent_found:
            return "READ_NOW", f"Urgent language detected: {', '.join(urgent_found)}"
        
        # Check for medium urgency
        medium_found = [keyword for keyword in medium_urgency_keywords if keyword in content_lower]
        if medium_found:
            return "NORMAL", f"Time-sensitive language detected: {', '.join(medium_found)}"
        
        return "LOW", "No urgency indicators in content"
    
    @staticmethod
    def analyze_sender_importance(messages: List[EmailMessage]) -> Tuple[str, str]:
        """
        Analyze sender importance based on email patterns
        
        Returns:
            Tuple of (priority_level, reasoning)
        """
        if not messages:
            return "NORMAL", "No messages to analyze"
        
        # Get unique external senders (not from user)
        external_senders = set()
        for message in messages:
            if not message.is_from_user:
                external_senders.add(message.sender_email.lower())
        
        # Check for important sender indicators
        important_domains = [
            'foundation.org', 'edu', 'gov', 'org',
            'corporation.com', 'company.com'
        ]
        
        vip_keywords_in_names = [
            'ceo', 'president', 'director', 'manager', 'head',
            'chief', 'founder', 'partner', 'executive'
        ]
        
        for sender_email in external_senders:
            # Check domain importance
            for domain in important_domains:
                if domain in sender_email:
                    return "NORMAL", f"Important organization domain detected: {domain}"
            
            # Check for VIP titles in email names
            name_part = sender_email.split('@')[0]
            for keyword in vip_keywords_in_names:
                if keyword in name_part:
                    return "NORMAL", f"Senior role detected in sender: {keyword}"
        
        return "LOW", "Standard sender priority"
    
    @staticmethod
    def calculate_overall_priority(thread: EmailThread, messages: List[EmailMessage]) -> Tuple[str, str]:
        """
        Calculate overall priority considering all factors
        
        Returns:
            Tuple of (priority_level, reasoning)
        """
        if not messages:
            return "NORMAL", "No messages in thread"
        
        # Get the most recent message to determine response status
        latest_message = max(messages, key=lambda m: m.received_date)
        is_waiting_for_response = not latest_message.is_from_user
        
        # Calculate different priority aspects
        time_priority, time_reason = PriorityCalculator.calculate_time_based_priority(
            latest_message.received_date, is_waiting_for_response
        )
        
        content_priority, content_reason = PriorityCalculator.analyze_content_urgency(messages)
        sender_priority, sender_reason = PriorityCalculator.analyze_sender_importance(messages)
        
        # Priority level hierarchy
        priority_levels = {
            "READ_NOW": 4,
            "REPLY_NOW": 3,
            "NORMAL": 2,
            "LOW": 1
        }
        
        # Take the highest priority level
        all_priorities = [time_priority, content_priority, sender_priority]
        max_priority = max(all_priorities, key=lambda p: priority_levels.get(p, 0))
        
        # Combine reasoning
        reasons = []
        if time_priority == max_priority:
            reasons.append(f"Time: {time_reason}")
        if content_priority == max_priority:
            reasons.append(f"Content: {content_reason}")
        if sender_priority == max_priority:
            reasons.append(f"Sender: {sender_reason}")
        
        combined_reason = "; ".join(reasons) if reasons else time_reason
        
        return max_priority, combined_reason
    
    @staticmethod
    def get_recommended_action(priority_level: str, is_waiting_for_response: bool) -> Tuple[str, str]:
        """
        Get recommended next action based on priority and response status
        
        Returns:
            Tuple of (action_status, action_description)
        """
        if priority_level in ["READ_NOW", "REPLY_NOW"]:
            if is_waiting_for_response:
                return "reply", "Urgent response needed"
            else:
                return "read", "Check for response or follow up"
        
        elif priority_level == "NORMAL":
            if is_waiting_for_response:
                return "reply", "Response needed"
            else:
                return "read", "Monitor for response"
        
        else:  # LOW priority
            return "read", "No immediate action required"