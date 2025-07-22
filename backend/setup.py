#!/usr/bin/env python3

from setuptools import setup, find_packages

setup(
    name="email_collector",
    version="0.1.0",
    description="Email Collector for Sponsorship CRM",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "google-auth>=2.0.0",
        "google-auth-oauthlib>=0.8.0",
        "google-auth-httplib2>=0.1.0",
        "google-api-python-client>=2.0.0",
        "supabase>=2.0.0",
        "python-dotenv>=1.0.0",
        "google-generativeai>=0.3.0",
    ],
    entry_points={
        "console_scripts": [
            "email-collector=email_collector.main:main",
        ],
    },
)