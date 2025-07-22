import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    # Gmail Configuration
    GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID")
    GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET")
    GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN")

    # Gemini Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # Email Collection Settings
    COLLECTION_START_DATE = datetime(2025, 7, 14)  # July 14, 2025

    # User email to exclude from participants/contacts
    USER_EMAIL = "jackfan@college.harvard.edu"
    USER_NAME = "Jack Fan"

    # Focused keywords for subject line search - more precise to reduce noise
    SPONSORSHIP_KEYWORDS = [
        "sponsorship", "partnership", "sponsor", "partnering",
        "collaboration", "brand partnership", "marketing partnership",
        "sponsoring", "partnership opportunity", "sponsor opportunity",
        "collaborative partnership", "business partnership"
    ]

    # Gmail Search Configuration
    MAX_RESULTS_PER_QUERY = 500
    GMAIL_SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify'
    ]

    # Gemini Configuration
    GEMINI_MODEL = "gemini-1.5-flash"
    GEMINI_TEMPERATURE = 0.1
    GEMINI_MAX_OUTPUT_TOKENS = 2048

    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def validate(cls):
        """Validate that all required environment variables are set"""
        required_vars = [
            "SUPABASE_URL", "SUPABASE_SERVICE_KEY",
            "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN",
            "GEMINI_API_KEY"
        ]

        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)

        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

        return True
