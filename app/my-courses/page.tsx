// app/my-courses/page.tsx 
'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  PlayCircle,
  Award,
  Filter,
  Search,
  Grid,
  List,
  Calendar,
  BarChart3,
  Target,
  Sparkles,
  Globe
} from 'lucide-react';
import { getCourseProgress } from '@/lib/purchaseUtils';

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
  lastWatched?: any;
  progress?: number;
}

interface Purchase {
  id: string;
  courseId: string;
  purchaseDate: any;
}

interface CourseWithPurchase extends Course {
  purchaseDate: any;
  progress: number;
}

export default function MyCoursesPage() {
  const [purchasedCourses, setPurchasedCourses] = useState<CourseWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          const courseData = courseDoc.data();
          
          let progress = 0;
          progress = await getCourseProgress(userId, purchase.courseId);
          
          return {
            id: courseDoc.id,
            title: courseData.title,
            description: courseData.description,
            price: courseData.price,
            videoPlaybackId: courseData.videoPlaybackId,
            videoDuration: courseData.videoDuration,
            videoThumbnail: courseData.videoThumbnail,
            instructor: courseData.instructor || 'Native Arabic Instructor',
            category: courseData.category || 'Arabic',
            purchaseDate: purchase.purchaseDate,
            progress: progress,
            lastWatched: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          } as CourseWithPurchase;
        }
        return null;
      });

      const coursesResults = await Promise.all(coursesPromises);
             
      const validCourses = coursesResults.filter((course): course is CourseWithPurchase => 
        course !== null
      );

      const uniqueCourses = validCourses.filter((course, index, self) => {
        const firstIndex = self.findIndex(c => c.id === course.id);
        return index === firstIndex;
      });
             
      setPurchasedCourses(uniqueCourses);
         
    } catch (error) {
      console.error('Error fetching purchased Arabic courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '10h';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
         
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredCourses = purchasedCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'completed') return matchesSearch && course.progress === 100;
    if (filter === 'in-progress') return matchesSearch && course.progress > 0 && course.progress < 100;
    
    return matchesSearch;
  });

  const totalCourses = purchasedCourses.length;
  const completedCourses = purchasedCourses.filter(c => c.progress === 100).length;
  const inProgressCourses = purchasedCourses.filter(c => c.progress > 0 && c.progress < 100).length;
  const totalLearningTime = purchasedCourses.reduce((acc, course) => {
    const hours = course.videoDuration ? Math.floor(course.videoDuration / 3600) : 2;
    return acc + hours;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar user={user}/>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your Arabic courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar user={user} />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          {/* Logo removed */}
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-blue-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Arabic Journey</h1>
          <p className="text-gray-600 mb-8">Please sign in to view your Arabic courses.</p>
          <Link 
             href="/"
             className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
          >
            <span>Go to Arabic Courses</span>
            <TrendingUp className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar user={user} />
             
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">My Arabic Journey</h1>
              <p className="text-gray-600 mt-2">
                Continue your Arabic learning journey
              </p>
            </div>
            
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                Keep going! You're making great Arabic progress
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Arabic Courses</p>
                <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Arabic Completed</p>
                <p className="text-3xl font-bold text-gray-900">{completedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Arabic In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{inProgressCourses}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 font-medium">Arabic Practice Hours</p>
                <p className="text-3xl font-bold text-gray-900">{totalLearningTime}h</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-pink-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your Arabic courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filters & View */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Arabic Courses</option>
                  <option value="in-progress">Arabic In Progress</option>
                  <option value="completed">Arabic Completed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        {filteredCourses.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300">
                  {/* Course Image */}
                  <div className="relative aspect-video">
                    {course.videoThumbnail ? (
                      <img
                        src={course.videoThumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white opacity-75" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Progress Overlay */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="px-4 pb-4">
                        <div className="flex justify-between items-center text-white text-sm mb-2">
                          <span>{course.progress}% Complete</span>
                          <span>{formatDuration(course.videoDuration)}</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              course.progress === 100 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-blue-400 to-purple-500'
                            }`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        course.progress === 100
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                          : course.progress > 0
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700'
                            : 'bg-white/90 text-gray-700'
                      }`}>
                        {course.progress === 100 ? 'Completed' : course.progress > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {course.category}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {course.instructor?.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600">{course.instructor}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(course.purchaseDate)}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Link
                      href={`/courses/${course.id}`}
                      className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        course.progress === 100
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 border border-green-200'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {course.progress === 100 ? (
                        <>
                          <Award className="h-5 w-5" />
                          <span>View Arabic Certificate</span>
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <PlayCircle className="h-5 w-5" />
                          <span>Continue Arabic Lessons</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-5 w-5" />
                          <span>Start Arabic Lessons</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Course Thumbnail */}
                    <div className="lg:w-48 flex-shrink-0">
                      <div className="relative aspect-video rounded-xl overflow-hidden">
                        {course.videoThumbnail ? (
                          <img
                            src={course.videoThumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-white opacity-75" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(course.videoDuration)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Course Details */}
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {course.category}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              course.progress === 100
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {course.progress === 100 ? 'Completed' : `${course.progress}%`}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {course.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-4">
                            {course.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                                {course.instructor?.charAt(0)}
                              </div>
                              <span>{course.instructor}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Enrolled {formatDate(course.purchaseDate)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress & Action */}
                        <div className="lg:w-48 flex-shrink-0">
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Arabic Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  course.progress === 100 
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-500'
                                }`}
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <Link
                            href={`/courses/${course.id}`}
                            className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                              course.progress === 100
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 border border-green-200'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                            }`}
                          >
                            {course.progress === 100 ? (
                              <>
                                <Award className="h-4 w-4" />
                                <span>View Arabic Certificate</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                <span>Continue Arabic</span>
                              </>
                            )}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-12 w-12 text-blue-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No Arabic courses found' : 'Start Your Arabic Journey'}
            </h2>
            
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? 'No Arabic courses match your search. Try different keywords.'
                : 'You haven\'t enrolled in any Arabic courses yet. Explore our catalog and start learning Arabic!'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  Clear Search
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  Browse Arabic Courses
                </Link>
              )}
              
              <Link
                href="/courses"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
              >
                Explore All Arabic
              </Link>
            </div>
          </div>
        )}

        {/* Learning Tips */}
        {filteredCourses.length > 0 && (
          <div className="mt-12">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Keep Practicing Arabic! 🚀</h3>
                  <p className="text-gray-600">
                    Consistency is key to mastering Arabic. Try to spend at least 30 minutes daily on your Arabic lessons.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(filteredCourses.reduce((acc, c) => acc + c.progress, 0) / filteredCourses.length)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg. Arabic Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {filteredCourses.filter(c => c.progress > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Arabic Courses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}