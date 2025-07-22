class SponsorshipPrompts:
    """Prompts for Gemini AI to extract sponsorship information"""

    def get_sponsor_extraction_prompt(self, thread_content: str) -> str:
        """Get prompt for extracting sponsor information from email thread"""

        return f"""
You are an AI assistant specialized in analyzing business email threads to extract sponsorship and partnership information.

Analyze the following email thread and extract structured information about potential sponsorship opportunities.

EMAIL THREAD:
{thread_content}

Extract the following information and return it as valid JSON with exactly these fields:

{{
    "poc_name": "Name of the point of contact at the SPONSOR's organisation (usually a person's name from email signature or content)",
    "org_name": "Name of the organization or company **that is being asked to sponsor**",
    "estimated_value_amount": "Estimated monetary value like '$5000' or 'TBD' if not mentioned",
    "value_type": "Type of sponsorship: 'monetary', 'in-kind', 'catering', 'equipment', or 'other'",
    "value_description": "Description of what's being offered (e.g., 'Catering for 200 people', 'Marketing budget')",
    "confidence_score": "between 0.0 and 1.0 for how likely the organisation is to sponsor",
    "priority_level": "Urgency level: 'READ_NOW', 'REPLY_NOW', 'NORMAL', or 'LOW'",
    "priority_reasoning": "Explanation for the assigned priority level",
    "last_action_summary": "Summary of the most recent action (e.g., 'Sarah from TechCorp replied 2 hours ago')",
    "next_action_status": "Recommended next action: 'read', 'reply', or 'other'",
    "next_action_description": "Specific description for 'other' actions, null otherwise"
}}

ANALYSIS GUIDELINES:

1. **Point of Contact (poc_name)**:

    - Ensure the point of contact is **from the target organization that is SPONSORING**, NOT the organization seeking sponsorship.

    - Look for person names in email signatures, "From" fields, or mentioned in content. Extract just the person's name, not their title.

2. **Organization (org_name)**:

    - Ensure the organization name is **that of the target organization that is SPONSORING**, NOT the organization seeking sponsorship.

    - Look for company names, organization names, or brand names mentioned in emails, signatures, or domains.

3. **Value Estimation**:
   - Look for specific monetary amounts mentioned
   - If no amount, estimate based on context (small event = $500-5000, large event = $5000+)
   - Use "TBD" if no indication is given

4. **Value Type**:
   - 'monetary': Cash sponsorship, funding, financial support
   - 'in-kind': Products, services, equipment provided for free
   - 'catering': Food and beverage sponsorship
   - 'equipment': Technical equipment, staging, etc.
   - 'other': Anything else

5. **Priority Assessment**:
   - 'READ_NOW': Urgent messages, time-sensitive opportunities, follow-ups needed
   - 'REPLY_NOW': Direct questions, proposals waiting for response, overdue replies
   - 'NORMAL': General inquiries, early-stage discussions
   - 'LOW': Informational emails, completed conversations

6. **Next Action**:
   - 'read': Information to review or digest
   - 'reply': Needs a response from you
   - 'other': Specific action like "schedule meeting", "send proposal"

7. **Confidence Score**: Rate your confidence in the extraction accuracy from 0.0 to 1.0.

Return ONLY the JSON object, no additional text or formatting.
"""

    def get_priority_analysis_prompt(self, thread_content: str) -> str:
        """Get prompt for analyzing thread priority"""

        return f"""
Analyze this email thread and determine the priority level and reasoning.

EMAIL THREAD:
{thread_content}

Consider:
- How long since the last message
- Whether it's waiting for your response
- Urgency indicators in the content
- Business importance of the opportunity

Return JSON with:
{{
    "priority_level": "READ_NOW|REPLY_NOW|NORMAL|LOW",
    "reasoning": "Explanation for the priority assignment"
}}
"""

    def get_sponsor_info_prompt(self, thread_content: str) -> str:
        """Get prompt for extracting basic sponsor information"""

        return f"""
Extract sponsor information from this email thread:

EMAIL THREAD:
{thread_content}

Return JSON with:
{{
    "poc_name": "Contact person name",
    "org_name": "Organization name",
    "estimated_value": "Estimated value of sponsorship",
    "value_type": "monetary|in-kind|catering|equipment|other",
    "confidence": 0.0-1.0
}}
"""
