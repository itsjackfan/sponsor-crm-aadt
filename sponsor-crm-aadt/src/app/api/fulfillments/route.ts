import { NextRequest, NextResponse } from 'next/server';
import { Fulfillment } from '@/types';

// GET /api/fulfillments
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement Supabase query
    // const { data, error } = await supabase
    //   .from('fulfillments')
    //   .select(`
    //     *,
    //     sponsor:sponsors(name)
    //   `)
    //   .order('deadline', { ascending: true });

    // if (error) throw error;

    // Mock data for now
    const mockFulfillments: Fulfillment[] = [];

    return NextResponse.json({ 
      success: true, 
      data: mockFulfillments 
    });
  } catch (error) {
    console.error('Error fetching fulfillments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fulfillments' },
      { status: 500 }
    );
  }
}

// POST /api/fulfillments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Validate input
    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('fulfillments')
    //   .insert([{
    //     sponsor_id: body.sponsorId,
    //     description: body.description,
    //     deadline: body.deadline,
    //     tags: body.tags,
    //     completed: false
    //   }])
    //   .select()
    //   .single();

    // if (error) throw error;

    // Mock response for now
    const newFulfillment: Fulfillment = {
      id: 'mock-id',
      sponsorId: body.sponsorId,
      sponsorName: 'Mock Sponsor',
      description: body.description,
      deadline: new Date(body.deadline),
      tags: body.tags,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({ 
      success: true, 
      data: newFulfillment 
    });
  } catch (error) {
    console.error('Error creating fulfillment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fulfillment' },
      { status: 500 }
    );
  }
}