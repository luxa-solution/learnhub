'use client'
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { recordPurchase } from '@/lib/purchaseUtils';
import { EmailService } from '@/lib/services/emailService'; 

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');
     
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseRecorded, setPurchaseRecorded] = useState(false);
  const [error, setError] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [coursePrice, setCoursePrice] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
             
      if (user && sessionId && courseId) {
        try {

          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            setCourseTitle(courseData.title);
            setCoursePrice(courseData.price);
          }

          await recordPurchase(user.uid, courseId);
          setPurchaseRecorded(true);
          console.log('Purchase successfully recorded for course:', courseId);

          if (courseTitle) {
            EmailService.sendPurchaseEmail(
              user.email!, 
              user.email?.split('@')[0] || 'Learner', 
              courseTitle, 
              coursePrice || 9900
            );
          }
                 
        } catch (error) {
          console.error('Failed to record purchase:', error);
          setError('Failed to complete enrollment. Please contact support.');
        }
      } else if (!user) {
        setError('Please log in to complete your purchase.');
      } else if (!sessionId || !courseId) {
        setError('Invalid payment session. Please contact support.');
      }
             
      setLoading(false);
    });
         
    return () => unsubscribe();
  }, [sessionId, courseId, courseTitle, coursePrice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg">Processing your purchase...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
             
      <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {error ? (
            // Error State
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
                             
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Issue</h1>
                             
              <p className="text-lg text-red-600 mb-2">
                {error}
              </p>
                             
              <p className="text-gray-500 mb-8">
                Your payment was processed, but we encountered an issue. Please contact support with your session ID.
              </p>

              {sessionId && (
                <p className="text-sm text-gray-400 mb-8">
                  Session ID: {sessionId}
                </p>
              )}
            </>
          ) : (
            // Success State
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
                             
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {purchaseRecorded ? 'Payment Successful! 🎉' : 'Completing Your Enrollment...'}
              </h1>
                             
              <p className="text-lg text-gray-600 mb-2">
                {purchaseRecorded 
                   ? `Thank you for purchasing "${courseTitle}"!`
                   : 'Finalizing your course access...'
                }
              </p>
                             
              <p className="text-gray-500 mb-6">
                {purchaseRecorded 
                   ? 'You are now enrolled and can access all course materials. Check your email for the receipt.'
                  : 'Please wait while we set up your course access.'
                }
              </p>

              {coursePrice > 0 && purchaseRecorded && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 inline-block">
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-xl font-bold text-green-600">${(coursePrice / 100).toFixed(2)}</p>
                </div>
              )}

              {sessionId && (
                <p className="text-sm text-gray-400 mb-8">
                  Order #: {sessionId}
                </p>
              )}

              {!purchaseRecorded && (
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
               href="/"
               className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Courses
            </Link>
                         
            {purchaseRecorded && courseId && (
              <Link 
                 href={`/courses/${courseId}`}
                 className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Start Learning Now
              </Link>
            )}
                         
            <Link 
               href="/my-courses"
               className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              My Courses
            </Link>
          </div>

          {purchaseRecorded && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📧 A receipt has been sent to your email address. Check your inbox for course access details.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                If this issue persists, please contact support with your session ID and email address.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}