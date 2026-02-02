'use client'
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import { checkUserPurchase, saveCourseProgress, getCourseProgress } from '@/lib/purchaseUtils';
import Link from 'next/link';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Star,
  Users,
  Award,
  Bookmark,
  Save,
  Target,
  Loader2
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  videoPlaybackId?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  instructor?: string;
  category?: string;
  rating?: number;
  students?: number;
  whatYoullLearn?: string[];
  requirements?: string[];
}

export default function CourseVideoPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && courseId) {
        await checkCourseAccess(user.uid, courseId);
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
        const data = courseDoc.data();
        setCourse({
          id: courseDoc.id,
          title: data.title,
          description: data.description,
          price: data.price,
          videoPlaybackId: data.videoPlaybackId,
          videoDuration: data.videoDuration,
          videoThumbnail: data.videoThumbnail,
          instructor: data.instructor || 'Expert Instructor',
          category: data.category || 'Development',
          rating: data.rating || 4.5,
          students: data.students || 1000,
          whatYoullLearn: data.whatYoullLearn || [
            'Master the core concepts',
            'Build real-world projects',
            'Get certificate of completion'
          ],
          requirements: data.requirements || [
            'Basic computer knowledge',
            'Internet connection',
            'Willingness to learn'
          ]
        } as Course);
      }

      // 2. Check if user purchased this course
      const purchased = await checkUserPurchase(userId, courseId);
      setHasAccess(purchased);

      // 3. Load saved progress if user has access
      if (purchased) {
        const savedProgress = await getCourseProgress(userId, courseId);
        setCourseProgress(savedProgress);
        console.log('📊 Loaded saved progress:', savedProgress);
      }
      
    } catch (error) {
      console.error('Error checking course access:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save progress to Firebase
  const saveProgressToDatabase = useCallback(async (progress: number) => {
    if (!user || !courseId || savingProgress) return;
    
    setSavingProgress(true);
    try {
      await saveCourseProgress(
        user.uid, 
        courseId, 
        progress
      );
      
      console.log('💾 Progress saved to database:', progress);
      
      // Update local state
      setCourseProgress(progress);
      
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSavingProgress(false);
    }
  }, [user, courseId, savingProgress]);

  // Handle video progress
  const handleVideoProgress = useCallback((progress: number) => {
    const roundedProgress = Math.round(progress);
    
    // Only update if progress increased
    if (roundedProgress > courseProgress) {
      setCourseProgress(roundedProgress);
      
      // Auto-save to database at milestones
      const shouldSave = roundedProgress === 100 || roundedProgress % 25 === 0;
      
      if (shouldSave) {
        saveProgressToDatabase(roundedProgress);
      }
    }
  }, [courseProgress, saveProgressToDatabase]);

  // Handle video completion - FIXED VERSION
  const handleVideoComplete = useCallback(async () => {
    // 🛡️ GUARD CLAUSE: Prevent multiple completions
    if (courseProgress === 100) {
      console.log('⚠️ Course already marked as complete. Skipping...');
      return;
    }
    
    console.log('🎉 Video completed!');
    
    // Set to 100% immediately
    setCourseProgress(100);
    setJustCompleted(true);
    
    // Save completion to database
    if (user && courseId) {
      try {
        await saveCourseProgress(user.uid, courseId, 100);
        console.log('✅ Course marked as completed in database');
        
        // Show celebration message
        setTimeout(() => {
          alert('🎉 Congratulations! You have completed this course!');
        }, 1000);
        
      } catch (error) {
        console.error('Error marking course as completed:', error);
      }
    }
  }, [user, courseId, courseProgress]); // ✅ Added courseProgress to dependencies

  // Manual save button
  const handleSaveProgress = async () => {
    if (!user || !courseId) return;
    
    await saveProgressToDatabase(courseProgress);
    
    // Show temporary success feedback
    const button = document.getElementById('saveProgressBtn');
    if (button) {
      const originalHTML = button.innerHTML;
      button.innerHTML = `
        <div class="flex items-center">
          <CheckCircle class="h-4 w-4 mr-2" />
          <span>Saved!</span>
        </div>
      `;
      button.className = 'px-4 py-2 bg-green-500 text-white rounded-lg transition-all duration-300';
      
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = 'px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300';
      }, 2000);
    }
  };

  // Mark as complete button
  const handleMarkAsComplete = async () => {
    if (!user || !courseId) return;
    
    if (window.confirm('Mark this course as 100% complete?')) {
      try {
        setCourseProgress(100);
        await saveCourseProgress(user.uid, courseId, 100);
        setJustCompleted(true);
        
        alert('🎉 Course marked as complete! Your progress has been saved.');
      } catch (error) {
        console.error('Error marking course as complete:', error);
        alert('Error saving progress. Please try again.');
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user}/>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading course content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user}/>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need to purchase <span className="font-semibold">"{course.title}"</span> to watch the video content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
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
      <Navbar user={user}/>
      
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-sm mb-2">
                <Link href="/" className="hover:text-blue-200">Home</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/courses" className="hover:text-blue-200">Courses</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium">{course.category}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{course.title}</h1>
              <p className="text-blue-100 max-w-3xl">{course.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Bookmark className="h-6 w-6" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Share2 className="h-6 w-6" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Download className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Video Player */}
            <div className="bg-black">
              <div className="aspect-video max-w-5xl mx-auto">
                {course.videoPlaybackId ? (
                  <VideoPlayer 
                    playbackId={course.videoPlaybackId}
                    title={course.title}
                    className="w-full h-full"
                    onProgress={handleVideoProgress}
                    onComplete={handleVideoComplete}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg">Video content coming soon</p>
                      <p className="text-gray-400 text-sm mt-2">We're preparing the video materials</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Content */}
            <div className="p-6">
              {/* Progress & Stats */}
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-blue-600">{courseProgress}%</span>
                        {savingProgress && (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          courseProgress === 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${courseProgress}%` }}
                      ></div>
                    </div>
                    {courseProgress === 100 && (
                      <div className="mt-3 flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Course Completed! 🎉</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      id="saveProgressBtn"
                      onClick={handleSaveProgress}
                      disabled={savingProgress || courseProgress === 100}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50"
                    >
                      {savingProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Progress</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleMarkAsComplete}
                      disabled={courseProgress === 100}
                      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        courseProgress === 100
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 cursor-default'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                      }`}
                    >
                      <Target className="h-4 w-4" />
                      <span>{courseProgress === 100 ? 'Completed ✓' : 'Mark as Complete'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* What You'll Learn */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">What You'll Learn</h3>
                  <ul className="space-y-3">
                    {course.whatYoullLearn?.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Requirements</h3>
                  <ul className="space-y-3">
                    {course.requirements?.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Instructor */}
              <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900">About Instructor</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {course.instructor?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{course.instructor}</h4>
                    <p className="text-gray-600 mb-3">Expert Instructor • 10+ Years Experience</p>
                    <p className="text-gray-700">
                      Passionate educator with industry experience. Dedicated to helping students 
                      achieve their learning goals through practical, hands-on instruction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4 lg:pl-6 p-6">
            <div className="sticky top-6 space-y-6">
              {/* Course Card */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${(course.price / 100).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">One-time payment • Lifetime access</p>
                  
                  <div className="space-y-4">
                    <Link
                      href={`/courses/${course.id}`}
                      className="block w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg text-center"
                    >
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Continue Learning</span>
                      </div>
                    </Link>
                    
                    <button className="w-full py-3.5 border-2 border-blue-500 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300">
                      <div className="flex items-center justify-center">
                        <Download className="h-5 w-5 mr-2" />
                        <span>Download Resources</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-3">This course includes:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Full lifetime access</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Certificate of completion</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Downloadable resources</span>
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Access on mobile and TV</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4">Course Content</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="font-medium text-gray-900">Introduction</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">Getting Started</span>
                    </div>
                    <span className="text-sm text-gray-500">20 min</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">Core Concepts</span>
                    </div>
                    <span className="text-sm text-gray-500">45 min</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <PlayCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">Advanced Topics</span>
                    </div>
                    <span className="text-sm text-gray-500">60 min</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link 
              href="/my-courses"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to My Courses</span>
            </Link>
            
            <div className="flex gap-4">
              <Link 
                href="/"
                className="px-6 py-3 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Browse More Courses
              </Link>
              
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
              >
                Watch Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

