'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';
import { createCourseRequest, getCourses, getBranches, type Course, type Branch } from '@/lib/api';
import StatsLoop from './StatsLoop';

interface CourseCatalogProps {
  initialCourses?: Course[];
  initialBranches?: Branch[];
  enrolledCourseIds?: string[];
  hideEnrolledCourses?: boolean;
}

export function CourseCatalog({
  initialCourses,
  initialBranches,
  enrolledCourseIds = [],
  hideEnrolledCourses = false,
}: CourseCatalogProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [branches, setBranches] = useState<Branch[]>(initialBranches || []);
  const [loading, setLoading] = useState(!initialCourses);
  const [error, setError] = useState('');
  const [enrolledIds, setEnrolledIds] = useState<string[]>(enrolledCourseIds);

  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [requestForm, setRequestForm] = useState({
    name: '',
    requestedCourse: '',
    description: '',
    stream: '',
    email: '',
  });

  const categories = ['All', 'Chemical', 'Civil', 'Mechanical', 'Electrical', 'Electronic', 'CSE/IT'];
  const categoryColors: Record<string, string> = {
    All: '#A8E6FF', Chemical: '#FF6B9D', Civil: '#95E77E', Mechanical: '#B084FF',
    Electrical: '#4ECDC4', Electronic: '#FFB347', 'CSE/IT': '#A8E6FF'
  };

  const filteredCourses = activeCategory === 'All'
    ? courses.filter(course => !hideEnrolledCourses || !enrolledIds.includes(course.courseId))
    : courses.filter(course => {
        const branchMatches =
          course.affiliatedBranch.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]) ||
          activeCategory.toLowerCase().includes(course.affiliatedBranch.toLowerCase());
        if (!branchMatches) return false;
        return !hideEnrolledCourses || !enrolledIds.includes(course.courseId);
      });

  useEffect(() => {
    if (initialCourses && initialBranches && initialCourses.length > 0) return;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [coursesRes, branchesRes] = await Promise.all([
          getCourses({ page: 1, limit: 50 }),
          getBranches(),
        ]);
        if (coursesRes.success && coursesRes.data) {
          setCourses(coursesRes.data.courses);
          setTotalPages(coursesRes.pagination?.totalPages || 1);
        } else {
          setError(coursesRes.error?.message || 'Failed to load courses');
        }
        if (branchesRes.success && branchesRes.data) {
          setBranches(branchesRes.data.branches);
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enrolledCourseIds.length > 0) {
      setEnrolledIds(enrolledCourseIds);
    }
  }, [enrolledCourseIds]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handlePageChange = async (newPage: number) => {
    setLoading(true);
    try {
      const res = await getCourses({ page: newPage, limit: 12 });
      if (res.success && res.data) {
        setCourses(res.data.courses);
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCourse = async () => {
    setSubmittingRequest(true);
    setRequestMessage(null);
    try {
      const response = await createCourseRequest(requestForm);
      if (!response.success) {
        setRequestMessage({ ok: false, text: response.error?.message || 'Failed to submit course request.' });
        return;
      }
      setRequestMessage({ ok: true, text: 'Course request sent successfully.' });
      setRequestForm({ name: '', requestedCourse: '', description: '', stream: '', email: '' });
      setTimeout(() => { setShowRequestModal(false); setRequestMessage(null); }, 1200);
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <section id="courses" className="py-24 relative overflow-hidden" style={{ background: '#E0F7FF' }}>
      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6" style={{ background: '#fff', border: '3px solid #1a1a2e', boxShadow: '8px 8px 0 #1a1a2e' }}>
            <div className="mb-5">
              <h3 className="text-2xl" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#1a1a2e' }}>Request a Course</h3>
              <p className="mt-1 text-sm" style={{ fontFamily: "'Poppins', sans-serif", color: '#666' }}>
                Send your request directly to suggestion@sprintern.com.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {['name', 'email', 'requestedCourse', 'stream'].map(field => (
                <input
                  key={field}
                  value={(requestForm as any)[field]}
                  onChange={e => setRequestForm(c => ({ ...c, [field]: e.target.value }))}
                  placeholder={field === 'requestedCourse' ? 'Requested Course' : field.charAt(0).toUpperCase() + field.slice(1)}
                  className="neo-input"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              ))}
              <textarea
                value={requestForm.description}
                onChange={e => setRequestForm(c => ({ ...c, description: e.target.value }))}
                placeholder="Description"
                rows={5}
                className="sm:col-span-2 neo-input"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
            </div>

            {requestMessage && (
              <div className="mt-4 rounded-xl px-4 py-3 text-sm font-bold" style={{ fontFamily: "'Poppins', sans-serif", background: requestMessage.ok ? '#95E77E' : '#FF6B6B', border: '2px solid #1a1a2e' }}>
                {requestMessage.text}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => { setShowRequestModal(false); setRequestMessage(null); }}
                className="neo-btn bg-white flex-1 py-3"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>Cancel</button>
              <button onClick={() => void handleRequestCourse()}
                disabled={submittingRequest || !requestForm.name.trim() || !requestForm.email.trim() || !requestForm.requestedCourse.trim() || !requestForm.description.trim() || !requestForm.stream.trim()}
                className="neo-btn neo-btn-pink flex-1 py-3 disabled:opacity-60"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
                {submittingRequest ? 'Sending...' : 'SUBMIT REQUEST'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl mb-4 animate-fade-in"
            style={{ background: '#B084FF', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#1a1a2e' }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Industry-Ready Certification
            </span>
          </div>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 6vw, 48px)', color: '#1a1a2e' }}>
            Explore Our Course Catalog
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in animation-delay-200">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: '#fff', border: '2px solid #1a1a2e' }}>
              <Filter className="w-4 h-4" style={{ color: '#1a1a2e' }} />
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>Filter:</span>
            </div>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className="neo-tab"
                suppressHydrationWarning={true}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  background: activeCategory === cat ? categoryColors[cat] : '#fff',
                  boxShadow: activeCategory === cat ? '3px 3px 0 #1a1a2e' : 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <StatsLoop />

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-8 font-bold" style={{ color: '#FF6B6B' }}>
            <AlertCircle className="w-5 h-5" /> <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-neo-bounce" style={{ background: '#A8E6FF', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1a1a2e' }} />
              </div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#1a1a2e' }}>Loading courses...</p>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  purchased={enrolledIds.includes(course.courseId)}
                  popular={index === 0 && activeCategory === 'All'}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredCourses.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: '#E8D5FF', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                  <Sparkles className="w-8 h-8" style={{ color: '#1a1a2e' }} />
                </div>
                <p className="text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#1a1a2e' }}>No courses found</p>
                <p className="text-sm" style={{ fontFamily: "'Poppins', sans-serif", color: '#1a1a2e', opacity: 0.5 }}>Try selecting a different category</p>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="text-center animate-fade-in animation-delay-400">
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '16px', color: '#1a1a2e', marginBottom: '1.5rem' }}>
                Can't find your specialization? We're constantly adding new courses!
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="neo-btn neo-btn-purple px-8 py-4"
              >
                <span className="flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '16px' }}>
                  REQUEST A COURSE
                  <Sparkles className="w-5 h-5" />
                </span>
              </button>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                  className="neo-btn bg-white px-5 py-2.5 disabled:opacity-50" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>Previous</button>
                <span className="px-4 py-2 font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: '#1a1a2e' }}>Page {page} of {totalPages}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                  className="neo-btn bg-white px-5 py-2.5 disabled:opacity-50" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
