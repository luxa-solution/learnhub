'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
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

interface Purchase {
  id: string;
  courseId: string;
  purchaseDate: any;
}

interface CourseWithPurchase extends Course {
  purchaseDate: any;
}

export default function MyCoursesPage() {
  const [purchasedCourses, setPurchasedCourses] = useState<CourseWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchPurchasedCourses(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPurchasedCourses = async (userId: string) => {
    try {
      // 1. Get all purchases for this user
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('userId', '==', userId)
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
             
      const purchases: Purchase[] = [];
      purchasesSnapshot.forEach((doc) => {
        purchases.push({
          id: doc.id,
          ...doc.data()
        } as Purchase);
      });

  
      const coursesPromises = purchases.map(async (purchase) => {
    
        const coursesQuery = query(
          collection(db, 'courses'),
          where('__name__', '==', purchase.courseId)
        );
        const courseSnapshot = await getDocs(coursesQuery);
                 
        if (!courseSnapshot.empty) {
          const courseDoc = courseSnapshot.docs[0];
          return {
            id: courseDoc.id,
            ...courseDoc.data(),
            purchaseDate: purchase.purchaseDate
          } as CourseWithPurchase;
        }
        return null;
      });

      const coursesResults = await Promise.all(coursesPromises);
             
      const validCourses = coursesResults.filter((course): course is CourseWithPurchase => 
        course !== null
      );
             
      setPurchasedCourses(validCourses);
         
    } catch (error) {
      console.error('Error fetching purchased courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your courses...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Courses</h1>
          <p className="text-gray-600 mb-8">Please log in to view your courses.</p>
          <Link 
             href="/"
             className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Go to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
             
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey
          </p>
        </div>

        {purchasedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                {/* Video Thumbnail Section */}
                <div className="relative aspect-video bg-gray-800">
                  {course.videoThumbnail ? (
                    <>
                      {/* Thumbnail Image */}
                      <img
                        src={course.videoThumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                                         
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                         
                      {/* Video Duration Badge */}
                      {course.videoDuration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          {formatDuration(course.videoDuration)}
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback if no thumbnail
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
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
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">{course.title}</h2>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                      Enrolled
                    </span>
                  </div>
                                   
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">{course.description}</p>
                                   
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      <strong>Enrolled on:</strong> {formatDate(course.purchaseDate)}
                    </div>
                                         
                    <div className="flex gap-2">
                      <Link 
                         href={`/courses/${course.id}`}
                         className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-center text-sm font-medium"
                      >
                        Continue Learning
                      </Link>
                    </div>
                                         
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
                         
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No courses yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't enrolled in any courses yet. Explore our catalog and start your learning journey!
            </p>
                         
            <Link
               href="/"
               className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-block"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}