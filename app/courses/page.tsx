'use client'
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { checkUserPurchase } from '@/lib/purchaseUtils';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ChevronRight,
  BookOpen,
  Sparkles,
  Grid,
  List,
  X,
  CheckCircle,
  PlayCircle,
  Clock
} from 'lucide-react';

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithPurchase[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const priceFilters = [
    { id: 'all', name: 'All Courses' },
    { id: 'free', name: 'Free' },
    { id: 'paid', name: 'Paid' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData: Course[] = [];
                 
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          coursesData.push({
            id: doc.id,
            title: data.title || 'Untitled Course',
            description: data.description || 'No description available',
            price: data.price || 0,
            videoPlaybackId: data.videoPlaybackId,
            videoDuration: data.videoDuration,
            videoThumbnail: data.videoThumbnail,
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
          setFilteredCourses(coursesWithPurchaseStatus);
        } else {
          const defaultCourses = coursesData.map(course => ({ 
            ...course, 
            isPurchased: false 
          }));
          setCourses(defaultCourses);
          setFilteredCourses(defaultCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [user]);

  useEffect(() => {
    let result = [...courses];

    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPrice === 'free') {
      result = result.filter(course => course.price === 0);
    } else if (selectedPrice === 'paid') {
      result = result.filter(course => course.price > 0);
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedPrice, courses]);

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
    if (!seconds) return '2h';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
         
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPrice('all');
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
        <Navbar user={user}/>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
      <Navbar user={user}/>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Discover Your Arabic Path
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              From alphabet to eloquence, find the perfect course for your goals
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Simplified */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Price Filter Only */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
                <div className="space-y-2">
                  {priceFilters.map((price) => (
                    <button
                      key={price.id}
                      onClick={() => setSelectedPrice(price.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        selectedPrice === price.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{price.name}</span>
                      {selectedPrice === price.id && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Arabic Courses Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Arabic Courses</span>
                    <span className="font-medium">{courses.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Free Arabic Lessons</span>
                    <span className="font-medium">{courses.filter(c => c.price === 0).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium Courses</span>
                    <span className="font-medium">{courses.filter(c => c.price > 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Content */}
          <div className="lg:w-3/4">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchTerm ? 'Search Results' : 'All Arabic Courses'}
                </h2>
                <p className="text-gray-600">
                  {filteredCourses.length} Arabic course{filteredCourses.length !== 1 ? 's' : ''} available
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
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

            {/* Active Filters */}
            {(selectedPrice !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPrice !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                    Price: {priceFilters.find(p => p.id === selectedPrice)?.name}
                    <button onClick={() => setSelectedPrice('all')} className="ml-2 text-blue-500 hover:text-blue-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-2 text-yellow-500 hover:text-yellow-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Courses Grid/List */}
            {filteredCourses.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
                      {/* Course Image */}
                      <div className="relative aspect-video overflow-hidden">
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
                            ${course.price > 0 ? (course.price / 100).toFixed(2) : 'Free'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-6 line-clamp-3">
                          {course.description}
                        </p>
                        
                        {/* Action Button */}
                        <div className="pt-4 border-t border-gray-200">
                          {user ? (
                            course.isPurchased ? (
                              <Link
                                href={`/courses/${course.id}`}
                                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 font-semibold border border-green-200"
                              >
                                <PlayCircle className="h-5 w-5" />
                                <span>Continue Arabic Lessons</span>
                              </Link>
                            ) : (
                              <button
                                onClick={() => handlePurchase(course)}
                                disabled={purchasing === course.id}
                                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                  purchasing === course.id 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : course.price === 0
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                                }`}
                              >
                                {purchasing === course.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Processing...</span>
                                  </>
                                ) : course.price === 0 ? (
                                  <>
                                    <span>Start Arabic Lessons</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Start Arabic Course</span>
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
                              <span>Start Arabic Learning</span>
                              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List View
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
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {course.title}
                              </h3>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {course.description}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    ${course.price > 0 ? (course.price / 100).toFixed(2) : 'Free'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Button */}
                            <div className="lg:w-48 flex-shrink-0">
                              {user ? (
                                course.isPurchased ? (
                                  <Link
                                    href={`/courses/${course.id}`}
                                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 border border-green-200"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                    <span>Continue</span>
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => handlePurchase(course)}
                                    disabled={purchasing === course.id}
                                    className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                                      purchasing === course.id 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : course.price === 0
                                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                                    }`}
                                  >
                                    {purchasing === course.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Processing...</span>
                                      </>
                                    ) : course.price === 0 ? (
                                      <>
                                        <span>Enroll Free</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Enroll Now</span>
                                      </>
                                    )}
                                  </button>
                                )
                              ) : (
                                <Link
                                  href="/login"
                                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                                >
                                  <span>Start Learning</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // No courses found
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-blue-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No courses found
                </h2>
                
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? `No courses match "${searchTerm}". Try different keywords.`
                    : 'No courses match your current filters.'
                  }
                </p>
                
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-16 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Arabic Learning Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{courses.length}</div>
                  <div className="text-gray-600">Arabic Courses</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-1">{courses.filter(c => c.price === 0).length}</div>
                  <div className="text-gray-600">Free Arabic Lessons</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{courses.filter(c => c.price > 0).length}</div>
                  <div className="text-gray-600">Premium Arabic Courses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}