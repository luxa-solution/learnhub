'use client'
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
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

export default function CourseVideoPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user && courseId) {
        checkCourseAccess(user.uid, courseId);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [courseId]);

  const checkCourseAccess = async (userId: string, courseId: string) => {
    try {
      // 1. Get course details
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({
          id: courseDoc.id,
          ...courseDoc.data()
        } as Course);
      }

      // 2. Check if user purchased this course
      const purchased = await checkUserPurchase(userId, courseId);
      setHasAccess(purchased);
      
    } catch (error) {
      console.error('Error checking course access:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleVideoProgress = (progress: number) => {
    // You can save progress to database here
    setCourseProgress(progress);
  };

  const handleVideoComplete = () => {
    console.log('Video completed!');
    setCourseProgress(100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading course...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist.
          </p>
          <Link 
            href="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need to purchase "{course.title}" to watch the video content.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Courses
            </Link>
            <Link 
              href="/my-courses"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              My Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto">
        {/* Simple Video Player - Always Shows */}
        <div className="bg-black">
          <div className="max-w-6xl mx-auto">
            {course.videoPlaybackId && hasAccess ? (
              <VideoPlayer 
                playbackId={course.videoPlaybackId}
                title={course.title}
                className="w-full"
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
              />
            ) : (
              <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-lg">No video available for this course</p>
                  <p className="text-gray-400 text-sm mt-2">Please contact support if this is unexpected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Info Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {course.videoDuration && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Duration: {formatDuration(course.videoDuration)}
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Enrolled
                  </span>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="bg-gray-50 rounded-lg p-4 min-w-[200px]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{courseProgress}%</div>
                  <div className="text-sm text-gray-500 mb-2">Complete</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${courseProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Section */}
        <div className="bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
            
            <div className="space-y-4">
              {/* Main Video Lesson */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Introduction Video</h3>
                      <p className="text-sm text-gray-500">Main course content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {formatDuration(course.videoDuration)}
                    </span>
                    {courseProgress > 0 && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        courseProgress === 100 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {courseProgress === 100 ? 'Completed' : 'In Progress'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-600">
                    This is the main course video. Watch it to get started with {course.title}. 
                    You'll learn the fundamental concepts and practical applications.
                  </p>
                </div>
              </div>

              {/* Coming Soon Lessons */}
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <h3 className="font-semibold text-gray-700 mb-2">More Lessons Coming Soon</h3>
                <p className="text-gray-500 text-sm">
                  Additional video lessons and resources are being prepared for this course.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Link 
                href="/my-courses"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                ← Back to My Courses
              </Link>
              
              <div className="flex gap-4">
                <Link 
                  href="/"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Browse More Courses
                </Link>
                
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Watch Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

