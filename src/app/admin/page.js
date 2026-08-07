'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const { data: subjectsData } = await supabase.from('subjects').select('*, courses(title)').order('created_at', { ascending: false });

    if (coursesData) setCourses(coursesData);
    if (subjectsData) setSubjects(subjectsData);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('courses').insert([{ title: courseTitle }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Course added successfully!');
      setCourseTitle('');
      fetchData();
    }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setMessage('Please select a course first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('subjects').insert([{ course_id: selectedCourseId, title: subjectTitle }]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Subject added successfully!');
      setSubjectTitle('');
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>

        {message && <div className="p-3 bg-blue-100 text-blue-800 rounded font-medium">{message}</div>}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Course */}
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-3 text-gray-700">1. Create Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <input
                type="text"
                placeholder="Course Title (e.g. SBI PO, IBPS Clerk)"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Add Course
              </button>
            </form>
          </div>

          {/* Create Subject */}
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <h2 className="text-lg font-bold mb-3 text-gray-700">2. Create Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Target Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Subject Title (e.g. Reasoning, Quant)"
                required
                value={subjectTitle}
                onChange={(e) => setSubjectTitle(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                Add Subject
              </button>
            </form>
          </div>
        </div>

        {/* Overview List */}
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h2 className="text-lg font-bold mb-4 text-gray-700">Active Courses & Subjects</h2>
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses created yet.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const courseSubs = subjects.filter((s) => s.course_id === course.id);
                return (
                  <div key={course.id} className="p-4 border-l-4 border-blue-600 bg-gray-50 rounded">
                    <h3 className="font-bold text-gray-800 text-base">{course.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {courseSubs.length > 0 ? (
                        courseSubs.map((sub) => (
                          <span key={sub.id} className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                            {sub.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No subjects added</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
