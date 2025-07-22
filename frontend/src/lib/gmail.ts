import { supabase } from './supabase'

interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  snippet: string
  body?: string
}

interface GmailApiResponse {
  messages?: Array<{
    id: string
    threadId: string
  }>
  nextPageToken?: string
}

interface MessageDetailsResponse {
  id: string
  threadId: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
    }
    parts?: Array<{
      mimeType: string
      body: {
        data?: string
      }
    }>
  }
  snippet: string
}

export class GmailAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  static async create(): Promise<GmailAPI> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.provider_token) {
      throw new Error('No access token found. Please sign in with Google.')
    }
    return new GmailAPI(session.provider_token)
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gmail API error: ${response.status} ${error}`)
    }

    return response
  }

  async getRecentEmails(maxResults: number = 10): Promise<EmailMessage[]> {
    try {
      // Get list of recent messages
      const response = await this.makeRequest(`/users/me/messages?maxResults=${maxResults}&q=in:inbox`)
      const data: GmailApiResponse = await response.json()

      if (!data.messages || data.messages.length === 0) {
        return []
      }

      // Get details for each message
      const emailPromises = data.messages.map(async (message) => {
        const detailResponse = await this.makeRequest(`/users/me/messages/${message.id}`)
        const details: MessageDetailsResponse = await detailResponse.json()
        
        // Extract email details from headers
        const headers = details.payload.headers
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject'
        const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender'
        const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || ''

        return {
          id: details.id,
          threadId: details.threadId,
          subject,
          from,
          date: new Date(date).toLocaleDateString(),
          snippet: details.snippet,
        }
      })

      return await Promise.all(emailPromises)
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
  }

  async createDraft(to: string, subject: string, body: string): Promise<string> {
    try {
      // Create RFC 2822 formatted message
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n')

      // Base64 encode the email
      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await this.makeRequest('/users/me/drafts', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            raw: encodedEmail
          }
        })
      })

      const draft = await response.json()
      return draft.id
    } catch (error) {
      console.error('Error creating draft:', error)
      throw error
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<string> {
    try {
      // Create RFC 2822 formatted message
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n')

      // Base64 encode the email
      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await this.makeRequest('/users/me/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          raw: encodedEmail
        })
      })

      const message = await response.json()
      return message.id
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }
}