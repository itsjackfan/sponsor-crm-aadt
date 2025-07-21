import { NextRequest, NextResponse } from 'next/server';
import { Discovery } from '@/types';

// GET /api/discovery
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement Supabase query
    // const { data, error } = await supabase
    //   .from('discovery')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    // if (error) throw error;

    // Mock data for now
    const mockDiscovery: Discovery[] = [];

    return NextResponse.json({ 
      success: true, 
      data: mockDiscovery 
    });
  } catch (error) {
    console.error('Error fetching discovery items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discovery items' },
      { status: 500 }
    );
  }
}

// POST /api/discovery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Validate input
    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('discovery')
    //   .insert([{
    //     name: body.name,
    //     status: 'New',
    //     notes: body.notes
    //   }])
    //   .select()
    //   .single();

    // if (error) throw error;

    // Mock response for now
    const newDiscoveryItem: Discovery = {
      id: 'mock-id',
      name: body.name,
      status: 'New',
      notes: body.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({ 
      success: true, 
      data: newDiscoveryItem 
    });
  } catch (error) {
    console.error('Error creating discovery item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create discovery item' },
      { status: 500 }
    );
  }
}