import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get total sponsor count
    const { data: totalData, error: totalError } = await supabase
      .from('email_threads')
      .select('id', { count: 'exact' })
      .not('sponsor_org_name', 'is', null)

    if (totalError) {
      console.error('Error getting total sponsors:', totalError)
      return NextResponse.json({ error: totalError.message }, { status: 500 })
    }

    const totalSponsors = totalData?.length || 0

    // Get total estimated value (sum of numeric values)
    const { data: valueData, error: valueError } = await supabase
      .from('email_threads')
      .select('estimated_value_amount, value_type')
      .not('sponsor_org_name', 'is', null)
      .not('estimated_value_amount', 'is', null)

    if (valueError) {
      console.error('Error getting sponsor values:', valueError)
      return NextResponse.json({ error: valueError.message }, { status: 500 })
    }

    // Calculate total value
    let totalValue = 0
    let monetaryCount = 0
    let inKindCount = 0
    
    valueData?.forEach((thread: any) => {
      // Count by value type
      if (thread.value_type === 'monetary' || thread.value_type === 'equipment') {
        monetaryCount++
      } else {
        inKindCount++
      }

      // Extract numeric value from estimated_value_amount
      if (thread.estimated_value_amount) {
        const numericValue = thread.estimated_value_amount.toString()
          .replace(/[^0-9.]/g, '') // Remove non-numeric characters except decimal
        const value = parseFloat(numericValue)
        if (!isNaN(value)) {
          totalValue += value
        }
      }
    })

    // Get priority breakdown
    const { data: priorityData, error: priorityError } = await supabase
      .from('email_threads')
      .select('priority_level', { count: 'exact' })
      .not('sponsor_org_name', 'is', null)
      .in('priority_level', ['READ_NOW', 'REPLY_NOW'])

    if (priorityError) {
      console.error('Error getting priority data:', priorityError)
      return NextResponse.json({ error: priorityError.message }, { status: 500 })
    }

    const highPrioritySponsors = priorityData?.length || 0

    // Format total value
    const formattedTotalValue = totalValue > 0 ? `$${totalValue.toLocaleString()}` : '$0'

    return NextResponse.json({
      totalSponsors,
      totalValue: formattedTotalValue,
      monetarySponsors: monetaryCount,
      inKindSponsors: inKindCount,
      highPrioritySponsors,
      // Additional stats for the dashboard
      otherStat: monetaryCount.toString(),
      anotherStat: inKindCount.toString()
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}