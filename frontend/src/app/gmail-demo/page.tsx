'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GmailAPI } from '@/lib/gmail'
import { MainLayout } from '@/components/layout/MainLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useRouter } from 'next/navigation'

interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  snippet: string
}

interface SponsorThread {
  id: string
  gmail_thread_id: string
  subject: string
  participants: string[]
  last_action_summary: string | null
  next_action_status: 'read' | 'reply' | 'other' | null
  priority_level: 'READ_NOW' | 'REPLY_NOW' | 'NORMAL' | 'LOW'
  sponsor_poc_name: string | null
  sponsor_org_name: string | null
  estimated_value_amount: string | null
  value_type: 'monetary' | 'in-kind' | 'catering' | 'equipment' | 'other' | null
  status: 'new' | 'in_progress' | 'responded' | 'closed'
  gmail_thread_url: string | null
  created_at: string
}

interface ThreadStats {
  total_threads: number
  unprocessed_threads: number
  high_priority_threads: number
  processed_threads: number
}

export default function GmailDemo() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [sponsorThreads, setSponsorThreads] = useState<SponsorThread[]>([])
  const [threadStats, setThreadStats] = useState<ThreadStats | null>(null)
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftTo, setDraftTo] = useState('')
  const [draftSubject, setDraftSubject] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [draftSuccess, setDraftSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'emails' | 'sponsors'>('sponsors')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadRecentEmails()
      loadSponsorThreads()
    }
  }, [user])

  const loadRecentEmails = async () => {
    setLoadingEmails(true)
    setError(null)
    try {
      const gmail = await GmailAPI.create()
      const recentEmails = await gmail.getRecentEmails(10)
      setEmails(recentEmails)
    } catch (err) {
      console.error('Error loading emails:', err)
      setError(err instanceof Error ? err.message : 'Failed to load emails')
    } finally {
      setLoadingEmails(false)
    }
  }

  const loadSponsorThreads = async () => {
    setLoadingThreads(true)
    setError(null)
    try {
      const [threadsResponse, statsResponse] = await Promise.all([
        fetch('/api/email-threads'),
        fetch('/api/email-analytics')
      ])
      
      if (threadsResponse.ok) {
        const threads = await threadsResponse.json()
        setSponsorThreads(threads)
      } else {
        const errorData = await threadsResponse.json()
        setError(`Failed to load threads: ${errorData.error}`)
      }
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setThreadStats(stats)
      } else {
        const errorData = await statsResponse.json()
        setError(`Failed to load analytics: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Error loading sponsor threads:', err)
      setError('Failed to connect to API. Make sure the backend is running and database is set up.')
      
      // Use empty data instead of mock data
      setSponsorThreads([])
      setThreadStats({
        total_threads: 0,
        unprocessed_threads: 0,
        high_priority_threads: 0,
        processed_threads: 0
      })
    } finally {
      setLoadingThreads(false)
    }
  }

  const updateThreadStatus = async (threadId: string, status: string) => {
    try {
      const response = await fetch(`/api/email-threads/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update thread status')
      }

      // Refresh threads after update
      await loadSponsorThreads()
    } catch (err) {
      console.error('Error updating thread status:', err)
      setError(`Failed to update thread status: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'READ_NOW':
      case 'REPLY_NOW':
        return 'var(--error)'
      case 'NORMAL':
        return 'var(--warning)'
      case 'LOW':
        return 'var(--success)'
      default:
        return 'var(--text-tertiary)'
    }
  }

  const getValueTypeBadgeColor = (valueType: string) => {
    switch (valueType) {
      case 'monetary':
        return 'var(--success)'
      case 'in-kind':
        return 'var(--primary-accent)'
      case 'catering':
        return 'var(--warning)'
      default:
        return 'var(--text-tertiary)'
    }
  }

  const createTestDraft = async () => {
    if (!draftTo || !draftSubject || !draftBody) {
      setError('Please fill in all draft fields')
      return
    }

    setCreatingDraft(true)
    setError(null)
    setDraftSuccess(null)
    
    try {
      const gmail = await GmailAPI.create()
      const draftId = await gmail.createDraft(draftTo, draftSubject, draftBody)
      setDraftSuccess(`Draft created successfully! Draft ID: ${draftId}`)
      setDraftTo('')
      setDraftSubject('')
      setDraftBody('')
    } catch (err) {
      console.error('Error creating draft:', err)
      setError(err instanceof Error ? err.message : 'Failed to create draft')
    } finally {
      setCreatingDraft(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="glass-card p-8">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--primary-accent)' }} />
          <p className="mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <PageHeader
        title="Sponsorship Email CRM"
        subtitle="AI-powered email management for sponsorship opportunities"
      />

      {/* Statistics Cards */}
      {threadStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Total Threads
            </h3>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary-accent)' }}>
              {threadStats.total_threads}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              High Priority
            </h3>
            <p className="text-2xl font-bold" style={{ color: 'var(--error)' }}>
              {threadStats.high_priority_threads}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Processed
            </h3>
            <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {threadStats.processed_threads}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Pending
            </h3>
            <p className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
              {threadStats.unprocessed_threads}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'sponsors' 
              ? 'bg-[var(--primary-accent)] text-white' 
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          Sponsor Threads ({sponsorThreads.length})
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'emails' 
              ? 'bg-[var(--primary-accent)] text-white' 
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          Recent Emails
        </button>
      </div>

      {error && (
        <div 
          className="glass-card p-4 mb-8 border-l-4"
          style={{ 
            borderLeftColor: 'var(--error)',
            backgroundColor: 'var(--error-light)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <p style={{ color: 'var(--error)', fontSize: '15px', fontWeight: 500 }}>
            {error}
          </p>
        </div>
      )}

      {draftSuccess && (
        <div 
          className="glass-card p-4 mb-8 border-l-4"
          style={{ 
            borderLeftColor: 'var(--success)',
            backgroundColor: 'var(--success-light)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <p style={{ color: 'var(--success)', fontSize: '15px', fontWeight: 500 }}>
            {draftSuccess}
          </p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'sponsors' && (
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="page-title text-2xl">Sponsorship Threads</h2>
            <Button 
              onClick={loadSponsorThreads} 
              disabled={loadingThreads}
              style={{
                backgroundColor: 'var(--primary-accent)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: 'var(--radius-button)',
                fontSize: '14px'
              }}
            >
              {loadingThreads ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          {loadingThreads ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-accent)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading sponsor threads...</p>
            </div>
          ) : sponsorThreads.length > 0 ? (
            <div className="space-y-6">
              {sponsorThreads.map((thread) => (
                <div 
                  key={thread.id} 
                  className="p-6 border rounded-lg hover:bg-opacity-80 transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 
                          className="font-semibold text-lg" 
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {thread.subject}
                        </h3>
                        <Badge 
                          text={thread.priority_level.replace('_', ' ')}
                          color={getPriorityBadgeColor(thread.priority_level)}
                        />
                        {thread.value_type && (
                          <Badge 
                            text={thread.value_type}
                            color={getValueTypeBadgeColor(thread.value_type)}
                          />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Organization
                          </p>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {thread.sponsor_org_name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Contact
                          </p>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {thread.sponsor_poc_name || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Estimated Value
                          </p>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {thread.estimated_value_amount || 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Last Action
                          </p>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {thread.last_action_summary || 'No recent activity'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {thread.gmail_thread_url && (
                          <Button
                            onClick={() => window.open(thread.gmail_thread_url!, '_blank')}
                            style={{
                              backgroundColor: 'var(--primary-accent)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-button)',
                              fontSize: '14px'
                            }}
                          >
                            View in Gmail
                          </Button>
                        )}
                        <Button
                          onClick={() => updateThreadStatus(thread.id, 'in_progress')}
                          style={{
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-button)',
                            fontSize: '14px'
                          }}
                        >
                          Mark as In Progress
                        </Button>
                        <Button
                          onClick={() => updateThreadStatus(thread.id, 'responded')}
                          style={{
                            backgroundColor: 'var(--success)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-button)',
                            fontSize: '14px'
                          }}
                        >
                          Mark as Responded
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }} className="text-lg mb-4">
                No sponsorship threads found
              </p>
              <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
                Run the email collector script to import sponsorship emails from Gmail
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Emails Section */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="page-title text-2xl">Recent Emails</h2>
              <Button 
                onClick={loadRecentEmails} 
                disabled={loadingEmails}
                style={{
                  backgroundColor: 'var(--primary-accent)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-button)',
                  fontSize: '14px'
                }}
              >
                {loadingEmails ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {loadingEmails ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--primary-accent)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading emails...</p>
              </div>
            ) : emails.length > 0 ? (
              <div className="space-y-4">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    className="p-4 border rounded-lg hover:bg-opacity-80 transition-all"
                    style={{ 
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 
                        className="font-semibold truncate flex-1 mr-4" 
                        style={{ color: 'var(--text-primary)', fontSize: '15px' }}
                      >
                        {email.subject}
                      </h3>
                      <span 
                        className="text-sm whitespace-nowrap"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {email.date}
                      </span>
                    </div>
                    <p 
                      className="text-sm mb-2" 
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      From: {email.from}
                    </p>
                    <p 
                      className="text-sm" 
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {email.snippet}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }} className="text-center py-8">
                No emails found. Try refreshing or check your Gmail access permissions.
              </p>
            )}
          </div>

          {/* Create Draft Section */}
          <div className="glass-card p-8">
            <h2 className="page-title text-2xl mb-6">Create Test Draft</h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">To:</label>
                <Input
                  type="email"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
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
              
              <div>
                <label className="form-label">Subject:</label>
                <Input
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  placeholder="Test email subject"
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
              
              <div>
                <label className="form-label">Message:</label>
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Enter your test message here..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    backgroundColor: 'var(--surface)',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <Button
                onClick={createTestDraft}
                disabled={creatingDraft || !draftTo || !draftSubject || !draftBody}
                style={{
                  backgroundColor: 'var(--primary-accent)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-button)',
                  fontSize: '15px',
                  fontWeight: 600,
                  width: '100%',
                  opacity: creatingDraft || !draftTo || !draftSubject || !draftBody ? 0.5 : 1,
                  cursor: creatingDraft || !draftTo || !draftSubject || !draftBody ? 'not-allowed' : 'pointer'
                }}
              >
                {creatingDraft ? 'Creating Draft...' : 'Create Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}