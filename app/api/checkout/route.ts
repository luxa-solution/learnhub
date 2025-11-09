import { NextRequest, NextResponse } from 'next/server';
import { createStripeCheckoutSession } from '@/lib/stripe';

interface RequestBody {
  course: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { course }: RequestBody = await request.json();
    
    console.log('🔍 Checkout API - Received course:', course);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course is required' },
        { status: 400 }
      );
    }

    if (!course.id || !course.title || !course.price) {
      return NextResponse.json(
        { error: 'Course ID, title, and price are required' },
        { status: 400 }
      );
    }

    if (course.price <= 0) {
      return NextResponse.json(
        { error: 'Invalid course price' },
        { status: 400 }
      );
    }

    const session = await createStripeCheckoutSession(course);
    
    console.log('✅ Stripe session created:', {
      id: session.id,
      url: session.url,
      amount: session.amount_total
    });

    if (!session.url) {
      throw new Error('No URL returned from Stripe');
    }
    
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
      
  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}