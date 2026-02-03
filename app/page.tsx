// app/page.tsx 
'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { checkUserPurchase } from '@/lib/purchaseUtils';
import Link from 'next/link';
import { 
  Star, 
  Clock, 
  Users, 
  PlayCircle,
  ChevronRight,
  TrendingUp,
  Award,
  Shield,
  Sparkles
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  videoPlaybackId?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  rating?: number;
  students?: number;
  instructor?: string;
  category?: string;
}

interface CourseWithPurchase extends Course {
  isPurchased: boolean;
}

export default function Home() {
  const [courses, setCourses] = useState<CourseWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [featuredCourse, setFeaturedCourse] = useState<CourseWithPurchase | null>(null);

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
          const data = doc.data();
          coursesData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            price: data.price,
            videoPlaybackId: data.videoPlaybackId,
            videoDuration: data.videoDuration,
            videoThumbnail: data.videoThumbnail,
            rating: data.rating || 4.5,
            students: data.students || Math.floor(Math.random() * 1000) + 100,
            instructor: data.instructor || 'Expert Instructor',
            category: data.category || 'Development'
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
          if (coursesWithPurchaseStatus.length > 0) {
            setFeaturedCourse(coursesWithPurchaseStatus[0]);
          }
        } else {
          const defaultCourses = coursesData.map(course => ({ 
            ...course, 
            isPurchased: false 
          }));
          setCourses(defaultCourses);
          if (defaultCourses.length > 0) {
            setFeaturedCourse(defaultCourses[0]);
          }
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
    if (!seconds) return '2h 30m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
         
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user}/>
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading amazing Arabic courses...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user}/>
      
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                🎉 10,000+ students learned Arabic this month
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master Arabic
              </span>
              <br />
              <span className="text-gray-900">From Your First Word to Fluency</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Journey from "مرحبا" to fluent conversations with our expert-led courses. Learn Modern Standard Arabic or popular dialects with native instructors.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={user ? "#courses" : "/signup"}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">
                    {user ? 'Explore Courses' : 'Start Learning Free'}
                  </span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </Link>
              
              {!user && (
                <Link
                  href="/login"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-semibold"
                >
                  Already a member? Sign In
                </Link>
              )}
            </div>
            
            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">30-Day Money Back</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Arabic Proficiency Certificate</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Native Arabic Instructors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Course Section */}
      {featuredCourse && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-2/3">
                <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full mb-4">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Featured Course
                  </span>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                  {featuredCourse.title}
                </h2>
                
                <p className="text-gray-600 mb-6 text-lg">
                  {featuredCourse.description}
                </p>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ا</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Native Arabic Instructor</p>
                      <p className="text-sm text-gray-500">10+ Years Experience</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{featuredCourse.rating?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span>{featuredCourse.students?.toLocaleString()}+ students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-5 w-5 text-purple-500" />
                      <span>{formatDuration(featuredCourse.videoDuration)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {user ? (
                    featuredCourse.isPurchased ? (
                      <Link
                        href={`/courses/${featuredCourse.id}`}
                        className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg"
                      >
                        <PlayCircle className="h-5 w-5" />
                        <span className="font-semibold">Continue Learning</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePurchase(featuredCourse)}
                        disabled={purchasing === featuredCourse.id}
                        className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                      >
                        {purchasing === featuredCourse.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Enroll Now</span>
                            <span className="text-lg font-bold">${(featuredCourse.price / 100).toFixed(2)}</span>
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <Link
                      href="/signup"
                      className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                    >
                      <span className="font-semibold">Start Free Trial</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                  
                  <Link
                    href={`/courses/${featuredCourse.id}`}
                    className="flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-semibold"
                  >
                    Preview Course
                  </Link>
                </div>
              </div>
              
              <div className="lg:w-1/3">
                <div className="relative group">
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl overflow-hidden shadow-2xl">
                    {featuredCourse.videoThumbnail ? (
                      <img
                        src={featuredCourse.videoThumbnail}
                        alt={featuredCourse.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="h-16 w-16 text-white opacity-75" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex justify-between items-center text-white">
                        <div className="flex items-center space-x-1">
                          <PlayCircle className="h-4 w-4" />
                          <span className="text-sm">Preview available</span>
                        </div>
                        <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                          {formatDuration(featuredCourse.videoDuration)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Grid Section */}
      <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Popular Arabic Courses
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Handpicked courses to master the Arabic language
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-200 hover:shadow-2xl transition-all duration-300">
              {/* Course Image */}
              <div className="relative aspect-video overflow-hidden">
                {course.videoThumbnail ? (
                  <img
                    src={course.videoThumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white opacity-75" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Course Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    {course.category || 'Arabic'}
                  </span>
                </div>
                
                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.videoDuration)}</span>
                  </div>
                </div>
              </div>
              
              {/* Course Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ${(course.price / 100).toFixed(2)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                {/* Course Stats */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{course.rating?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-500">{course.students}+ students</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    By {course.instructor}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    course.isPurchased ? (
                      <Link
                        href={`/courses/${course.id}`}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 font-semibold border border-green-200"
                      >
                        <PlayCircle className="h-5 w-5" />
                        <span>Continue Learning</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePurchase(course)}
                        disabled={purchasing === course.id}
                        className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          purchasing === course.id 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {purchasing === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Enroll Now</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <span>Start Learning</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {courses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Arabic courses available yet</h3>
            <p className="text-gray-600 mb-6">We're preparing amazing Arabic courses for you!</p>
            {user && (
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                Suggest a Course
              </button>
            )}
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">
              Ready to Speak Arabic with Confidence?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of successful learners who've achieved fluency with Master Arabic.
            </p>
            <Link
              href={user ? "/my-courses" : "/signup"}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <span className="font-semibold text-lg">
                {user ? 'Go to My Dashboard' : 'Start Your Journey Today'}
              </span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}