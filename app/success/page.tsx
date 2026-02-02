// app/success/page.tsx - COMPLETE FIXED VERSION
'use client'

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { recordPurchase } from '@/lib/purchaseUtils';
import { EmailService } from '@/lib/services/emailService'; 

// Create the main content component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');
     
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseRecorded, setPurchaseRecorded] = useState(false);
  const [error, setError] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [coursePrice, setCoursePrice] = useState<number>(0);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
             
      if (user && sessionId && courseId) {
        try {
          console.log('🔄 Processing purchase for user:', user.email);
          console.log('Session ID:', sessionId);
          console.log('Course ID:', courseId);

          // 1. Get course details
          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            setCourseTitle(courseData.title);
            setCoursePrice(courseData.price);
            console.log('📚 Course found:', courseData.title, 'Price:', courseData.price);
          } else {
            console.error('❌ Course not found:', courseId);
            setError('Course not found. Please contact support.');
            setLoading(false);
            return;
          }

          // 2. Record purchase in database
          await recordPurchase(user.uid, courseId);
          setPurchaseRecorded(true);
          console.log('✅ Purchase recorded in database');

          // 3. Send purchase email via Formspree
          if (!emailSent) {
            console.log('📧 Sending purchase email...');
            const emailSuccess = await EmailService.sendPurchaseEmail(
              user.email!, 
              user.email?.split('@')[0] || 'Learner', 
              courseTitle || courseDoc.data().title, 
              coursePrice || courseDoc.data().price || 9900
            );
            
            if (emailSuccess) {
              setEmailSent(true);
              console.log('✅ Purchase email sent successfully');
            } else {
              console.warn('⚠️ Purchase email failed, but purchase was recorded');
              // Don't show error to user, just log it
            }
          }
                 
        } catch (error: any) {
          console.error('❌ Failed to complete purchase:', error);
          setError(`Failed to complete enrollment: ${error.message || 'Unknown error'}. Please contact support.`);
        } finally {
          setLoading(false);
        }
      } else {
        if (!user) {
          setError('Please log in to complete your purchase.');
        } else if (!sessionId || !courseId) {
          setError('Invalid payment session. Please contact support with your order details.');
        }
        setLoading(false);
      }
    });
         
    return () => unsubscribe();
  }, [sessionId, courseId, emailSent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700 mb-2">Processing Your Purchase</div>
            <div className="text-gray-500">Please wait while we confirm your enrollment...</div>
            {sessionId && (
              <div className="mt-4 text-sm text-gray-400">
                Order: {sessionId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
      <Navbar user={user} />
             
      <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {error ? (
            // Error State
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
                             
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Issue</h1>
                             
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                <p className="font-medium">{error}</p>
              </div>
                             
              <p className="text-gray-500 mb-8">
                Your payment was processed by Stripe, but we encountered an issue completing your enrollment.
              </p>

              {sessionId && (
                <div className="bg-gray-100 p-4 rounded-lg mb-8">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reference Information</p>
                  <p className="text-sm text-gray-600">
                    Session ID: <span className="font-mono">{sessionId}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Course ID: <span className="font-mono">{courseId}</span>
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                   href="/support"
                   className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Contact Support
                </Link>
                <Link 
                   href="/my-courses"
                   className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Check My Courses
                </Link>
              </div>
            </>
          ) : (
            // Success State
            <>
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
                             
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Payment Successful! 🎉
              </h1>
                             
              <p className="text-xl text-gray-600 mb-2">
                Thank you for purchasing <span className="font-semibold text-blue-600">"{courseTitle}"</span>
              </p>
                             
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                {purchaseRecorded 
                   ? 'You are now enrolled and can access all course materials immediately.'
                   : 'Finalizing your course access...'
                }
              </p>

              {/* Purchase Details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase Details</h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{courseTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-600 text-lg">${(coursePrice / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="font-medium text-green-600">Confirmed</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Access:</span>
                    <span className="font-medium">Immediate & Lifetime</span>
                  </div>
                </div>
              </div>

              {/* Email Status */}
              {emailSent ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-lg mb-8 inline-flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Receipt sent to your email
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-lg mb-8 inline-flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Preparing your receipt...
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                   href="/"
                   className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-md"
                >
                  Browse More Courses
                </Link>
                         
                {purchaseRecorded && courseId && (
                  <Link 
                     href={`/courses/${courseId}`}
                     className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md"
                  >
                    Start Learning Now
                  </Link>
                )}
                         
                <Link 
                   href="/my-courses"
                   className="bg-white border-2 border-blue-500 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Go to My Courses
                </Link>
              </div>

              {/* Help Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                     href="/help"
                     className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Help Center
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link 
                     href="/contact"
                     className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Contact Support
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link 
                     href="/faq"
                     className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    FAQ
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700 mb-2">Loading Purchase Details...</div>
            <div className="text-gray-500">Please wait while we prepare your success page...</div>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}