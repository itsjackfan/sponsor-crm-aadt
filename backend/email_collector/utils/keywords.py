import re
from typing import List, Set, Dict
from ..config import Config

class KeywordMatcher:
    """Handles keyword matching and filtering for sponsorship emails"""
    
    def __init__(self):
        self.sponsorship_keywords = set(keyword.lower() for keyword in Config.SPONSORSHIP_KEYWORDS)
        
        # Extended keyword variations
        self.keyword_variations = {
            'sponsor': ['sponsors', 'sponsored', 'sponsoring', 'sponsorship'],
            'partner': ['partners', 'partnership', 'partnering', 'partnerships'],
            'collaborate': ['collaboration', 'collaborative', 'collaborating'],
            'marketing': ['marketing opportunity', 'brand partnership', 'promotional'],
        }
    
    def get_all_keywords(self) -> Set[str]:
        """Get all keywords including variations"""
        all_keywords = self.sponsorship_keywords.copy()
        
        for base_word, variations in self.keyword_variations.items():
            all_keywords.update(variation.lower() for variation in variations)
        
        return all_keywords
    
    def find_keywords_in_text(self, text: str) -> List[str]:
        """Find all matching keywords in the given text"""
        if not text:
            return []
        
        text_lower = text.lower()
        found_keywords = []
        
        for keyword in self.get_all_keywords():
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                found_keywords.append(keyword)
        
        return found_keywords
    
    def is_sponsorship_related(self, subject: str, body: str, snippet: str = "") -> bool:
        """Check if email content is sponsorship-related"""
        # Combine all text for analysis
        combined_text = f"{subject} {body} {snippet}"
        
        # Find matching keywords
        found_keywords = self.find_keywords_in_text(combined_text)
        
        return len(found_keywords) > 0
    
    def get_keyword_score(self, subject: str, body: str, snippet: str = "") -> float:
        """Calculate relevance score based on keyword matches"""
        combined_text = f"{subject} {body} {snippet}"
        found_keywords = self.find_keywords_in_text(combined_text)
        
        if not found_keywords:
            return 0.0
        
        # Weight different types of matches
        score = 0.0
        
        # Primary keywords get higher weight
        primary_keywords = {'sponsorship', 'partnership', 'sponsor', 'partner'}
        for keyword in found_keywords:
            if keyword in primary_keywords:
                score += 1.0
            else:
                score += 0.5
        
        # Subject line matches get extra weight
        subject_keywords = self.find_keywords_in_text(subject)
        score += len(subject_keywords) * 0.5
        
        return min(score, 5.0)  # Cap at 5.0
    
    def filter_spam_patterns(self, subject: str, body: str, sender_email: str) -> bool:
        """Filter out obvious spam or irrelevant emails"""
        
        # Common spam patterns
        spam_patterns = [
            r'unsubscribe',
            r'click here',
            r'act now',
            r'limited time',
            r'free trial',
            r'newsletter',
            r'promotional',
            r'noreply@',
            r'do-not-reply@'
        ]
        
        combined_text = f"{subject} {body} {sender_email}".lower()
        
        # Check for spam patterns
        for pattern in spam_patterns:
            if re.search(pattern, combined_text):
                return False  # Filter out (not sponsorship)
        
        # Check for automated emails
        automated_indicators = [
            'automated',
            'auto-generated',
            'system notification',
            'donotreply'
        ]
        
        for indicator in automated_indicators:
            if indicator in combined_text:
                return False
        
        return True  # Keep (potential sponsorship)
    
    def extract_organization_hints(self, text: str) -> List[str]:
        """Extract potential organization names from text"""
        org_hints = []
        
        # Look for common organization patterns
        patterns = [
            r'(\w+\s+(?:Inc|Corp|LLC|Ltd|Company|Organization|Foundation))',
            r'(\w+\s+(?:University|College|School))',
            r'(\w+\s+(?:Group|Team|Association|Society))',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            org_hints.extend(matches)
        
        return org_hints
    
    def categorize_sponsorship_type(self, text: str) -> str:
        """Categorize the type of sponsorship based on content"""
        text_lower = text.lower()
        
        # Monetary indicators
        if any(word in text_lower for word in ['funding', 'budget', 'financial', 'money', '$']):
            return 'monetary'
        
        # In-kind indicators
        if any(word in text_lower for word in ['product', 'service', 'in-kind', 'donation']):
            return 'in-kind'
        
        # Catering indicators
        if any(word in text_lower for word in ['food', 'catering', 'meal', 'lunch', 'dinner', 'refreshment']):
            return 'catering'
        
        # Equipment indicators
        if any(word in text_lower for word in ['equipment', 'technology', 'hardware', 'venue', 'space']):
            return 'equipment'
        
        return 'other'