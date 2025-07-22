#!/usr/bin/env python3
"""
Script to get Gmail refresh token for the email collector

Run this once to get your refresh token, then add it to your .env file
"""

import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# Gmail scopes - must match what you need
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
]

def get_refresh_token():
    """Get refresh token via OAuth flow"""
    
    # You'll need to create OAuth credentials in Google Cloud Console
    # Download the credentials.json file from Google Cloud Console
    
    print("=== Gmail Refresh Token Generator ===")
    print("\n1. Go to Google Cloud Console: https://console.cloud.google.com/")
    print("2. Enable Gmail API")
    print("3. Create OAuth 2.0 credentials (Desktop application)")
    print("4. Download the credentials.json file")
    print("5. Place credentials.json in this directory")
    print("\nPress Enter when ready...")
    input()
    
    if not os.path.exists('credentials.json'):
        print("❌ credentials.json not found!")
        print("Please download it from Google Cloud Console and place it here.")
        return
    
    try:
        # Run OAuth flow
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials.json', SCOPES
        )
        
        # This will open a browser window for authentication
        credentials = flow.run_local_server(port=0)
        
        print("\n✅ Authentication successful!")
        print("\n" + "="*50)
        print("COPY THESE VALUES TO YOUR .env FILE:")
        print("="*50)
        print(f"GMAIL_CLIENT_ID={credentials.client_id}")
        print(f"GMAIL_CLIENT_SECRET={credentials.client_secret}")
        print(f"GMAIL_REFRESH_TOKEN={credentials.refresh_token}")
        print("="*50)
        
        # Test the credentials
        if credentials.expired:
            credentials.refresh(Request())
        
        print(f"\n✅ Access token (for testing): {credentials.token[:20]}...")
        print("✅ Refresh token obtained successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    get_refresh_token()