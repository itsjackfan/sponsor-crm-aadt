import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map email thread value_type to sponsor type
function mapValueTypeToSponsorType(valueType: string | null): 'Corporate' | 'In-kind' {
  if (!valueType) return 'Corporate'
  
  switch (valueType) {
    case 'monetary':
    case 'equipment':
      return 'Corporate'
    case 'in-kind':
    case 'catering':
    default:
      return 'In-kind'
  }
}

// Map thread status to sponsor status
function mapThreadStatusToSponsorStatus(status: string | null): 'Initial email' | 'See email' {
  return status === 'new' ? 'Initial email' : 'See email'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch email threads with sponsor information
    const { data: threads, error } = await supabase
      .from('email_threads')
      .select(`
        id,
        gmail_thread_id,
        subject,
        sponsor_org_name,
        sponsor_poc_name,
        estimated_value_amount,
        value_type,
        value_description,
        status,
        gmail_thread_url,
        created_at,
        updated_at,
        first_message_date,
        last_message_date,
        message_count,
        participants
      `)
      .not('sponsor_org_name', 'is', null) // Only threads with identified sponsors
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!threads) {
      return NextResponse.json([])
    }

    // For each thread, get the last message to determine direction
    const sponsorsWithLastMessage = await Promise.all(
      threads.map(async (thread: any) => {
        // Get the most recent message for this thread to determine direction and content
        const { data: lastMessage } = await supabase
          .from('email_messages')
          .select('is_from_user, received_date, sender_email, sender_name, snippet, subject')
          .eq('thread_id', thread.id)
          .order('received_date', { ascending: false })
          .limit(1)
          .single()

        return {
          ...thread,
          lastMessageFromUser: lastMessage?.is_from_user || false,
          actualLastMessageDate: lastMessage?.received_date || thread.last_message_date,
          lastMessageSender: lastMessage?.sender_name || 'Unknown',
          lastMessageSnippet: lastMessage?.snippet || '',
          lastMessageSubject: lastMessage?.subject || ''
        }
      })
    )

    // Transform email threads to sponsor format
    const sponsors = sponsorsWithLastMessage.map((thread: any) => ({
      id: thread.id,
      name: thread.sponsor_org_name || 'Unknown Organization',
      type: mapValueTypeToSponsorType(thread.value_type),
      contents: thread.value_description || thread.subject || 'Sponsorship inquiry',
      status: mapThreadStatusToSponsorStatus(thread.status),
      approximateValue: thread.estimated_value_amount || 'TBD',
      emailChain: thread.gmail_thread_url,
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at),
      // Additional sponsor-specific fields
      contactName: thread.sponsor_poc_name,
      participants: thread.participants,
      threadStatus: thread.status,
      messageCount: thread.message_count,
      firstMessageDate: thread.first_message_date,
      lastMessageDate: thread.last_message_date,
      actualLastMessageDate: thread.actualLastMessageDate,
      lastMessageFromUser: thread.lastMessageFromUser,
      lastMessageSender: thread.lastMessageSender,
      lastMessageSnippet: thread.lastMessageSnippet,
      lastMessageSubject: thread.lastMessageSubject,
      // Deprecated AI fields (use actual message data above instead)
      priority: thread.priority_level, // DEPRECATED
      processed: thread.llm_processed, // DEPRECATED
      lastActionSummary: thread.last_action_summary, // DEPRECATED
      nextActionStatus: thread.next_action_status, // DEPRECATED
      nextActionDescription: thread.next_action_description // DEPRECATED
    }))

    return NextResponse.json(sponsors)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, contents, approximateValue } = body

    if (!name || !type || !contents) {
      return NextResponse.json(
        { error: 'Name, type, and contents are required' },
        { status: 400 }
      )
    }

    // For manually added sponsors, we create a basic email thread entry
    // This keeps the data model consistent
    const threadData = {
      gmail_thread_id: `manual-${Date.now()}`, // Unique identifier for manual entries
      subject: `Manual sponsor: ${name}`,
      participants: [], 
      first_message_date: new Date().toISOString(),
      last_message_date: new Date().toISOString(),
      message_count: 0,
      sponsor_org_name: name,
      value_type: type.toLowerCase() === 'corporate' ? 'monetary' : 'in-kind',
      value_description: contents,
      estimated_value_amount: approximateValue,
      status: 'new',
      llm_processed: true, // Mark as processed since it's manually entered
      llm_processed_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('email_threads')
      .insert(threadData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform back to sponsor format for response
    const sponsor = {
      id: data.id,
      name: data.sponsor_org_name,
      type: mapValueTypeToSponsorType(data.value_type),
      contents: data.value_description,
      status: mapThreadStatusToSponsorStatus(data.status),
      approximateValue: data.estimated_value_amount,
      emailChain: data.gmail_thread_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }

    return NextResponse.json(sponsor)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}