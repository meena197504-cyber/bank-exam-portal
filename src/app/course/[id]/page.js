'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CourseDetailsPage() {
  const { id: courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [isCoursePurchased, setIsCoursePurchased] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    // 1. Fetch Course details
    const { data: cData } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (cData) setCourse(cData);

    // 2. Check if user purchased THIS course
    const { data: subData } = await supabase
      .from('user_course_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    setIsCoursePurchased(subData && subData.length > 0);

    // 3. Fetch Subjects for this course
    const { data: subjs } = await supabase.from('subjects').select('*').eq('course_id', courseId);
    if (subjs) setSubjects(subjs);

    // 4. Fetch Exams for these subjects
    const subjectIds = subjs ? subjs.map((s) => s.id) : [];
    if (subjectIds.length > 0) {
      const { data: examList } = await supabase
        .from('exams')
        .select('*, subjects(title)')
        .in('subject_id', subjectIds);

      if (examList) setExams(examList);
    }

    // 5. Fetch user's previous results
    const { data: resData } = await supabase.from('test_results').select('exam_id').eq('user_id', user.id);
    if (resData) setUserResults(resData.map((r) => r.exam_id));

    setLoading(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Course...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center flex-wrap gap-4">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-xs text-blue-600 font-bold mb-2 block hover:underline">
              ← Back to Courses Catalog
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{course?.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{course?.description || 'Browse subjects and available tests.'}</p>
          </div>

          <div>
            {isCoursePurchased ? (
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-bold">
                ✓ Full Course Unlocked
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-bold">
                🔒 Free Mode (1 Test Free)
              </span>
            )}
          </div>
        </div>

        {/* Subjects & Tests List */}
        <div className="space-y-6">
          {subjects.length === 0 ? (
            <div className="bg-white p-6 rounded border text-gray-500">No subjects found in this course.</div>
          ) : (
            subjects.map((sub) => {
              const subjectExams = exams.filter((e) => e.subject_id === sub.id);

              return (
                <div key={sub.id} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                  <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{sub.title}</h2>

                  {subjectExams.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No tests uploaded under this subject yet.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {subjectExams.map((exam, idx) => {
                        const isFreeExam = exam.is_free || idx === 0;
                        const canTakeTest = isCoursePurchased || isFreeExam || userResults.length < 1;

                        return (
                          <div key={exam.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                                  ⏱ {exam.duration_minutes} Mins
                                </span>
                                {isFreeExam ? (
                                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Free Test</span>
                                ) : (
                                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Premium</span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-800 mt-2">{exam.title}</h3>
                            </div>

                            {canTakeTest ? (
                              <button
                                onClick={() => router.push(`/exam/${exam.id}`)}
                                className="w-full bg-blue-600 text-white py-2 rounded font-semibold text-xs hover:bg-blue-700"
                              >
                                Start Mock Test
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-amber-500 text-white py-2 rounded font-semibold text-xs hover:bg-amber-600"
                              >
                                🔒 Unlock {course?.title} Pass
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
