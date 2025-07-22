import re
from typing import List, Set
from ..config import Config

class ParticipantProcessor:
    """Handles participant extraction and filtering"""
    
    @staticmethod
    def extract_email_addresses(text: str) -> List[str]:
        """Extract email addresses from text"""
        if not text:
            return []
        
        # Email regex pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text.lower())
        return list(set(emails))  # Remove duplicates
    
    @staticmethod
    def extract_name_from_email_header(header: str) -> tuple[str, str]:
        """
        Extract name and email from email header like 'John Doe <john@example.com>'
        Returns (name, email)
        """
        if not header:
            return "", ""
        
        # Pattern: "Name" <email> or Name <email>
        match = re.match(r'^"?([^"<]+?)"?\s*<([^>]+)>$', header.strip())
        if match:
            name = match.group(1).strip()
            email = match.group(2).strip().lower()
            return name, email
        
        # Just an email address
        if '@' in header:
            email = header.strip().lower()
            return email.split('@')[0], email
        
        # Just a name
        return header.strip(), ""
    
    @staticmethod
    def filter_user_emails(participants: List[str]) -> List[str]:
        """Filter out the user's email from participants"""
        filtered = []
        user_email_lower = Config.USER_EMAIL.lower()
        
        for participant in participants:
            # Extract email from participant string
            name, email = ParticipantProcessor.extract_name_from_email_header(participant)
            
            # Skip if it's the user's email
            if email and email != user_email_lower:
                filtered.append(participant)
            elif not email and participant.lower() not in [Config.USER_NAME.lower(), user_email_lower]:
                # Handle cases where participant is just a name or email
                filtered.append(participant)
        
        return filtered
    
    @staticmethod
    def normalize_participants(participants: List[str]) -> List[str]:
        """Normalize participant list for consistent processing"""
        normalized = set()
        
        for participant in participants:
            if not participant:
                continue
                
            # Clean up the participant string
            participant = participant.strip()
            
            # Extract name and email
            name, email = ParticipantProcessor.extract_name_from_email_header(participant)
            
            # Skip user's email
            if email and email.lower() == Config.USER_EMAIL.lower():
                continue
            
            # Use email if available, otherwise use name
            if email:
                normalized.add(email)
            elif name:
                normalized.add(name.lower())
        
        return sorted(list(normalized))
    
    @staticmethod
    def create_participant_signature(participants: List[str]) -> str:
        """
        Create a consistent signature for participant list for deduplication
        """
        normalized = ParticipantProcessor.normalize_participants(participants)
        # Sort to ensure consistent ordering
        return "|".join(sorted(normalized))
    
    @staticmethod
    def get_primary_contact_info(participants: List[str]) -> tuple[str, str]:
        """
        Get primary contact name and email from participants
        Returns (contact_name, contact_email)
        """
        for participant in participants:
            name, email = ParticipantProcessor.extract_name_from_email_header(participant)
            
            # Skip user's email
            if email and email.lower() != Config.USER_EMAIL.lower():
                return name or email.split('@')[0], email
        
        # Fallback - return first non-user participant
        filtered = ParticipantProcessor.filter_user_emails(participants)
        if filtered:
            name, email = ParticipantProcessor.extract_name_from_email_header(filtered[0])
            return name or "Unknown", email or "unknown@example.com"
        
        return "Unknown", "unknown@example.com"