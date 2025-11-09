import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

export async function createStripeCheckoutSession(course: Course) {
  try {
    console.log('🔍 Creating Stripe session for course:', course);
    
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      throw new Error('NEXT_PUBLIC_SITE_URL is not defined');
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    console.log('🔍 Using site URL:', siteUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description || 'Course enrollment',
              metadata: {
                courseId: course.id
              }
            },
            unit_amount: course.price, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}&course_id=${course.id}`,
      cancel_url: `${siteUrl}/courses`,
      metadata: {
        courseId: course.id,
      },
    });

    console.log('✅ Stripe session created successfully:', {
      id: session.id,
      url: session.url,
      amount_total: session.amount_total,
      success_url: session.success_url
    });

    return session;
  } catch (error: any) {
    console.error('❌ Error creating Stripe session:', error);
    
    if (error.type) {
      console.error('Stripe error type:', error.type);
    }
    if (error.param) {
      console.error('Stripe error param:', error.param);
    }
    
    throw error;
  }
}