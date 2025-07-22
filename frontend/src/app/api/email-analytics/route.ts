import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get total threads count
    const { count: totalThreads, error: totalError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error getting total threads:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    // Get unprocessed threads count
    const { count: unprocessedThreads, error: unprocessedError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .eq('llm_processed', false)

    if (unprocessedError) {
      console.error('Error getting unprocessed threads:', unprocessedError)
      return NextResponse.json({ error: unprocessedError.message }, { status: 500 })
    }

    // Get high priority threads count
    const { count: highPriorityThreads, error: priorityError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .in('priority_level', ['READ_NOW', 'REPLY_NOW'])

    if (priorityError) {
      console.error('Error getting high priority threads:', priorityError)
      return NextResponse.json({ error: priorityError.message }, { status: 500 })
    }

    // Get processed threads count
    const { count: processedThreads, error: processedError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .eq('llm_processed', true)

    if (processedError) {
      console.error('Error getting processed threads:', processedError)
      return NextResponse.json({ error: processedError.message }, { status: 500 })
    }

    // Get recent activity (threads updated in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentActivity, error: recentError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo.toISOString())

    if (recentError) {
      console.error('Error getting recent activity:', recentError)
      return NextResponse.json({ error: recentError.message }, { status: 500 })
    }

    // Get value type breakdown
    const { data: valueTypeBreakdown, error: valueTypeError } = await supabase
      .from('email_threads')
      .select('value_type')
      .not('value_type', 'is', null)

    if (valueTypeError) {
      console.error('Error getting value type breakdown:', valueTypeError)
      return NextResponse.json({ error: valueTypeError.message }, { status: 500 })
    }

    // Count value types
    const valueTypeCounts = valueTypeBreakdown?.reduce((acc: any, thread: any) => {
      const type = thread.value_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {}) || {}

    // Get priority level breakdown
    const { data: priorityBreakdown, error: priorityBreakdownError } = await supabase
      .from('email_threads')
      .select('priority_level')

    if (priorityBreakdownError) {
      console.error('Error getting priority breakdown:', priorityBreakdownError)
      return NextResponse.json({ error: priorityBreakdownError.message }, { status: 500 })
    }

    // Count priority levels
    const priorityCounts = priorityBreakdown?.reduce((acc: any, thread: any) => {
      const priority = thread.priority_level || 'NORMAL'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {}) || {}

    const analytics = {
      total_threads: totalThreads || 0,
      unprocessed_threads: unprocessedThreads || 0,
      high_priority_threads: highPriorityThreads || 0,
      processed_threads: processedThreads || 0,
      recent_activity: recentActivity || 0,
      value_type_breakdown: valueTypeCounts,
      priority_breakdown: priorityCounts,
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}