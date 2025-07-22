from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from uuid import UUID

class EmailMessage(BaseModel):
    id: Optional[UUID] = None
    thread_id: Optional[UUID] = None
    gmail_message_id: str
    sender_email: str
    sender_name: str
    recipients: List[str] = Field(default_factory=list)
    subject: str
    body_text: str
    snippet: str
    received_date: datetime
    is_from_user: bool = False
    created_at: Optional[datetime] = None

class EmailThread(BaseModel):
    id: Optional[UUID] = None
    gmail_thread_id: str
    subject: str
    participants: List[str] = Field(default_factory=list)
    participant_signature: Optional[str] = None  # For deduplication
    first_message_date: datetime
    last_message_date: datetime
    message_count: int = 0
    
    # Gemini-Extracted CRM Fields
    last_action_summary: Optional[str] = None
    next_action_status: Optional[Literal['read', 'reply', 'other']] = None
    next_action_description: Optional[str] = None
    priority_level: Literal['READ_NOW', 'REPLY_NOW', 'NORMAL', 'LOW'] = 'NORMAL'
    auto_priority_reasoning: Optional[str] = None
    
    # Gemini-Extracted Sponsor Information
    sponsor_poc_name: Optional[str] = None
    sponsor_org_name: Optional[str] = None
    estimated_value_amount: Optional[str] = None
    value_type: Optional[Literal['monetary', 'in-kind', 'catering', 'equipment', 'other']] = None
    value_description: Optional[str] = None
    sponsor_confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # Metadata
    gmail_thread_url: Optional[str] = None
    llm_processed: bool = False
    llm_processed_at: Optional[datetime] = None
    status: Literal['new', 'in_progress', 'responded', 'closed'] = 'new'
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SponsorInfo(BaseModel):
    """Structured output model for Gemini extraction"""
    poc_name: Optional[str] = Field(None, description="Point of contact name from email signature or content")
    org_name: Optional[str] = Field(None, description="Organization or company name")
    estimated_value_amount: Optional[str] = Field(None, description="Estimated monetary value like '$5000' or 'TBD'")
    value_type: Literal['monetary', 'in-kind', 'catering', 'equipment', 'other'] = Field(
        'other', description="Type of sponsorship value being offered"
    )
    value_description: Optional[str] = Field(None, description="Description of what's being offered")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="Confidence in extraction accuracy")
    priority_level: Literal['READ_NOW', 'REPLY_NOW', 'NORMAL', 'LOW'] = Field(
        'NORMAL', description="Urgency level based on email content and timing"
    )
    priority_reasoning: str = Field("", description="Explanation for the assigned priority level")
    last_action_summary: str = Field("", description="Summary of the most recent action in the thread")
    next_action_status: Literal['read', 'reply', 'other'] = Field(
        'read', description="Recommended next action type"
    )
    next_action_description: Optional[str] = Field(None, description="Specific description for 'other' actions")

class ThreadInfo(BaseModel):
    """Gmail thread information"""
    thread_id: str
    messages: List[dict]  # Raw Gmail message data
    subject: str
    participants: List[str]
    first_message_date: datetime
    last_message_date: datetime

class FulfillmentTask(BaseModel):
    """Fulfillment task for sponsor obligations"""
    id: Optional[UUID] = None
    thread_id: UUID
    title: str
    description: Optional[str] = None
    task_type: Literal['social_media', 'email', 'flyer', 'program', 'announcement', 'website', 'newsletter', 'event', 'other'] = 'other'
    priority: Literal['high', 'medium', 'low'] = 'medium'
    due_date: Optional[datetime] = None
    completed: bool = False
    completed_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProcessingResult(BaseModel):
    """Result of email processing"""
    success: bool
    threads_processed: int
    messages_processed: int
    errors: List[str] = Field(default_factory=list)
    new_threads: int = 0
    updated_threads: int = 0