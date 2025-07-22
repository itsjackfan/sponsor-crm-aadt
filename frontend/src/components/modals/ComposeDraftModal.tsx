'use client';

import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { GmailAPI } from '@/lib/gmail';

interface ComposeDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: {
    id: string;
    name: string;
    contactName?: string;
    emailChain?: string;
    contents: string;
    approximateValue: string;
    participants?: string[];
  } | null;
}

export function ComposeDraftModal({ isOpen, onClose, sponsor }: ComposeDraftModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractEmailFromParticipants = (participants: string[] | undefined): string => {
    if (!participants || participants.length === 0) return '';
    
    // Look for email addresses in participants array
    for (const participant of participants) {
      const emailMatch = participant.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      if (emailMatch) {
        return emailMatch[0];
      }
    }
    return participants[0] || '';
  };

  React.useEffect(() => {
    if (isOpen && sponsor) {
      // Pre-populate fields when modal opens
      const recipientEmail = extractEmailFromParticipants(sponsor.participants);
      setTo(recipientEmail);
      setSubject(`Re: ${sponsor.name} Sponsorship Opportunity`);
      setBody('');
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, sponsor]);

  const generateAIDraft = async () => {
    if (!sponsor) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Generate AI-assisted draft based on sponsor information
      const aiPrompt = `Generate a professional sponsorship follow-up email for:
      - Organization: ${sponsor.name}
      - Contact: ${sponsor.contactName || 'Team'}
      - Sponsorship Type: ${sponsor.contents}
      - Estimated Value: ${sponsor.approximateValue}
      
      The email should be:
      - Professional and enthusiastic
      - Thank them for their interest
      - Provide next steps or additional information
      - Include a clear call to action
      - Be concise (2-3 paragraphs)`;

      // For now, we'll create a template. In the future, this could call an AI API
      const aiGeneratedBody = `Dear ${sponsor.contactName || 'Team'},

Thank you for your interest in sponsoring our event! We're excited about the potential partnership with ${sponsor.name}.

Based on our initial discussion regarding ${sponsor.contents.toLowerCase()} with an estimated value of ${sponsor.approximateValue}, I wanted to follow up with some additional details and next steps.

We would love to schedule a brief call to discuss how we can best highlight ${sponsor.name} during our event and ensure maximum value for your investment. Are you available for a 15-minute call this week?

Looking forward to moving forward together!

Best regards,
[Your Name]`;

      setBody(aiGeneratedBody);
      setSubject(`Re: ${sponsor.name} Sponsorship Partnership - Next Steps`);
    } catch (err) {
      console.error('Error generating AI draft:', err);
      setError('Failed to generate AI-assisted draft. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const createDraft = async () => {
    if (!to || !subject || !body) {
      setError('Please fill in all fields');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const gmail = await GmailAPI.create();
      const draftId = await gmail.createDraft(to, subject, body);
      setSuccess(`Draft created successfully! Draft ID: ${draftId}`);
      
      // Clear form after success
      setTimeout(() => {
        onClose();
        setTo('');
        setSubject('');
        setBody('');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error creating draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to create draft');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setTo('');
    setSubject('');
    setBody('');
    setSuccess(null);
    setError(null);
    onClose();
  };

  if (!sponsor) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="compose-draft-modal">
        <div className="modal-header">
          <h2 className="modal-title">Compose Draft - {sponsor.name}</h2>
          <button onClick={handleClose} className="close-button">×</button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message" style={{
              padding: '12px',
              backgroundColor: 'var(--error-light)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{
              padding: '12px',
              backgroundColor: 'var(--success-light)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">To:</label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--surface)',
                fontSize: '15px'
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject:</label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--surface)',
                fontSize: '15px'
              }}
            />
          </div>

          <div className="form-group">
            <div className="form-label-with-action">
              <label className="form-label">Message:</label>
              <Button
                onClick={generateAIDraft}
                disabled={generating}
                variant="secondary"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--primary-accent)',
                  color: 'white',
                  border: 'none'
                }}
              >
                {generating ? 'Generating...' : '✨ AI Assist'}
              </Button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message here..."
              rows={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                backgroundColor: 'var(--surface)',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button
            onClick={handleClose}
            variant="secondary"
            style={{
              padding: '12px 24px',
              marginRight: '12px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={createDraft}
            disabled={creating || !to || !subject || !body}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primary-accent)',
              color: 'white',
              opacity: creating || !to || !subject || !body ? 0.5 : 1,
              cursor: creating || !to || !subject || !body ? 'not-allowed' : 'pointer'
            }}
          >
            {creating ? 'Creating...' : 'Create Draft'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .compose-draft-modal {
          background: var(--background);
          border-radius: var(--radius-lg);
          width: 600px;
          max-width: 90vw;
          max-height: 80vh;
          overflow-y: auto;
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .compose-draft-modal {
            width: 95vw;
            max-height: 90vh;
            border-radius: var(--radius-md);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
        }

        .close-button:hover {
          background: var(--surface);
        }

        .modal-content {
          padding: 20px 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .form-label-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </Modal>
  );
}