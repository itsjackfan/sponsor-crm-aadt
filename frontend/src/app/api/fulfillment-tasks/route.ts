import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('thread_id')
    const completed = searchParams.get('completed')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('fulfillment_tasks')
      .select(`
        *,
        email_threads:thread_id (
          subject,
          sponsor_org_name,
          sponsor_poc_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add filters if provided
    if (threadId) {
      query = query.eq('thread_id', threadId)
    }
    if (completed !== null) {
      query = query.eq('completed', completed === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
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
    const { thread_id, title, description, task_type, priority, due_date, assigned_to, notes } = body

    if (!thread_id || !title) {
      return NextResponse.json(
        { error: 'Thread ID and title are required' },
        { status: 400 }
      )
    }

    const taskData = {
      thread_id,
      title,
      description,
      task_type: task_type || 'other',
      priority: priority || 'medium',
      due_date: due_date ? new Date(due_date).toISOString() : null,
      assigned_to,
      notes
    }

    const { data, error } = await supabase
      .from('fulfillment_tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}