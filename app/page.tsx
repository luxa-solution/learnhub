'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { checkUserPurchase } from '@/lib/purchaseUtils';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  videoPlaybackId?: string;
  videoDuration?: number;
  videoThumbnail?: string;
}

interface CourseWithPurchase extends Course {
  isPurchased: boolean;
}

export default function Home() {
  const [courses, setCourses] = useState<CourseWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCoursesAndPurchases() {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData: Course[] = [];
                 
        querySnapshot.forEach((doc) => {
          coursesData.push({
            id: doc.id,
            ...doc.data()
          } as Course);
        });

        if (user) {
          const coursesWithPurchaseStatus: CourseWithPurchase[] = await Promise.all(
            coursesData.map(async (course) => {
              const isPurchased = await checkUserPurchase(user.uid, course.id);
              return { ...course, isPurchased };
            })
          );
          setCourses(coursesWithPurchaseStatus);
        } else {
          setCourses(coursesData.map(course => ({ ...course, isPurchased: false })));
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCoursesAndPurchases();
  }, [user]);

  const handlePurchase = async (course: CourseWithPurchase) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
     
    setPurchasing(course.id);
    try {
      console.log('🛒 Starting purchase for course:', course);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course }),
      });

      const data = await response.json();
      console.log('🔍 Checkout API response:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.url) {
        console.log('✅ Redirecting to Stripe:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
         
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      alert('Error starting checkout: ' + error.message);
    } finally {
      setPurchasing(null);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
         
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
             
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section for Non-Logged In Users */}
        {!user && (
          <div className="text-center mb-12 py-16 px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Advance Your Skills with Expert-Led Courses
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of learners mastering new skills with our comprehensive video courses. 
              Start your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Learning Free
              </Link>
              <Link
                href="/login"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        <div className="px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {user ? 'Available Courses' : 'Featured Courses'}
          </h1>
                     
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                {/* Video Thumbnail Section */}
                <div className="relative aspect-video bg-gray-800 group">
                  {course.videoThumbnail ? (
                    <>
                      <img
                        src={course.videoThumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      {course.videoDuration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          {formatDuration(course.videoDuration)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <p className="text-sm font-medium">{course.title}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Info Section */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2 h-14">
                    {course.title}
                  </h2>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2 h-10">
                    {course.description}
                  </p>
                                   
                  <div className="flex justify-between items-center">
                    <p className="text-green-600 font-bold text-lg">
                      ${(course.price / 100).toFixed(2)}
                    </p>
                                         
                    {course.isPurchased ? (
                      <Link 
                         href={`/courses/${course.id}`}
                         className="bg-green-500 text-white px-4 py-2 rounded font-medium text-sm hover:bg-green-600 transition-colors"
                      >
                        Watch Now
                      </Link>
                    ) : (
                      <button 
                         onClick={() => handlePurchase(course)}
                         disabled={purchasing === course.id}
                         className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                           purchasing === course.id 
                             ? 'bg-gray-400 cursor-not-allowed text-white'
                             : user 
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                         }`}
                      >
                        {purchasing === course.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          user ? 'Buy Now' : 'Enroll Now'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No courses available yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
