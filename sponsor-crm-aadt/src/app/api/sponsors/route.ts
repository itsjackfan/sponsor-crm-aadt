import { NextRequest, NextResponse } from 'next/server';
import { Sponsor } from '@/types';

// GET /api/sponsors
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement Supabase query
    // const { data, error } = await supabase
    //   .from('sponsors')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    // if (error) throw error;

    // Mock data for now
    const mockSponsors: Sponsor[] = [];

    return NextResponse.json({ 
      success: true, 
      data: mockSponsors 
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sponsors' },
      { status: 500 }
    );
  }
}

// POST /api/sponsors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Validate input
    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('sponsors')
    //   .insert([{
    //     name: body.name,
    //     type: body.type,
    //     contents: body.contents,
    //     approximate_value: body.approximateValue,
    //     status: 'Initial email'
    //   }])
    //   .select()
    //   .single();

    // if (error) throw error;

    // Mock response for now
    const newSponsor: Sponsor = {
      id: 'mock-id',
      name: body.name,
      type: body.type,
      contents: body.contents,
      status: 'Initial email',
      approximateValue: body.approximateValue,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({ 
      success: true, 
      data: newSponsor 
    });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sponsor' },
      { status: 500 }
    );
  }
}