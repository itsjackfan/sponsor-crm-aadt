import logging
from typing import Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from ..config import Config

logger = logging.getLogger(__name__)

class SupabaseAuthClient:
    """
    Handles Gmail OAuth authentication using tokens stored in Supabase Auth
    or environment variables as fallback
    """
    
    def __init__(self):
        self.credentials: Optional[Credentials] = None
    
    def get_gmail_credentials(self) -> Optional[Credentials]:
        """
        Get Gmail API credentials using refresh token from environment
        """
        try:
            if not Config.GMAIL_REFRESH_TOKEN:
                logger.error("No Gmail refresh token found in environment")
                return None
            
            # Create credentials from refresh token
            credentials = Credentials(
                token=None,  # Will be refreshed
                refresh_token=Config.GMAIL_REFRESH_TOKEN,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=Config.GMAIL_CLIENT_ID,
                client_secret=Config.GMAIL_CLIENT_SECRET,
                scopes=Config.GMAIL_SCOPES
            )
            
            # Refresh the access token
            request = Request()
            credentials.refresh(request)
            
            if credentials.valid:
                self.credentials = credentials
                logger.info("Successfully obtained Gmail credentials")
                return credentials
            else:
                logger.error("Failed to refresh Gmail credentials")
                return None
                
        except Exception as e:
            logger.error(f"Error getting Gmail credentials: {e}")
            return None
    
    def get_access_token(self) -> Optional[str]:
        """
        Get a valid access token for Gmail API
        """
        if not self.credentials:
            self.credentials = self.get_gmail_credentials()
        
        if not self.credentials:
            return None
        
        # Check if token needs refresh
        if not self.credentials.valid:
            try:
                request = Request()
                self.credentials.refresh(request)
            except Exception as e:
                logger.error(f"Error refreshing access token: {e}")
                return None
        
        return self.credentials.token if self.credentials.valid else None
    
    def is_authenticated(self) -> bool:
        """
        Check if we have valid Gmail credentials
        """
        return self.get_access_token() is not None