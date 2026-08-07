'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');

  // Exam Form
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(60);

  // Question Form
  const [selectedExamId, setSelectedExamId] = useState('');
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const { data: subjectsData } = await supabase.from('subjects').select('*, courses(title)').order('created_at', { ascending: false });
    const { data: examsData } = await supabase.from('exams').select('*, subjects(title)').order('created_at', { ascending: false });

    if (coursesData) setCourses(coursesData);
    if (subjectsData) setSubjects(subjectsData);
    if (examsData) setExams(examsData);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('courses').insert([{ title: courseTitle }]);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Course added successfully!');
      setCourseTitle('');
      fetchData();
    }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return setMessage('Select a course first.');
    setLoading(true);
    const { error } = await supabase.from('subjects').insert([{ course_id: selectedCourseId, title: subjectTitle }]);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Subject added successfully!');
      setSubjectTitle('');
      fetchData();
    }
    setLoading(false);
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return setMessage('Select a subject first.');
    setLoading(true);
    const { error } = await supabase.from('exams').insert([{ subject_id: selectedSubjectId, title: examTitle, duration_minutes: Number(duration) }]);
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Mock Test created successfully!');
      setExamTitle('');
      fetchData();
    }
    setLoading(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return setMessage('Select a test first.');
    setLoading(true);
    const { error } = await supabase.from('questions').insert([{
      exam_id: selectedExamId,
      question_text: qText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: correctOpt
    }]);

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Question added successfully!');
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD('');
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>

        {message && <div className="p-3 bg-blue-100 text-blue-800 rounded font-medium">{message}</div>}

        <div className="grid md:grid-cols-2 gap-6">
          {/* 1. Add Course */}
          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
            <h2 className="text-lg font-bold text-gray-700">1. Add Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <input type="text" placeholder="Course Title (e.g. SBI PO)" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full p-2 border rounded" />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Add Course</button>
            </form>
          </div>

          {/* 2. Add Subject */}
          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
            <h2 className="text-lg font-bold text-gray-700">2. Add Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} required className="w-full p-2 border rounded">
                <option value="">Select Course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input type="text" placeholder="Subject Title (e.g. Reasoning)" required value={subjectTitle} onChange={(e) => setSubjectTitle(e.target.value)} className="w-full p-2 border rounded" />
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Add Subject</button>
            </form>
          </div>

          {/* 3. Add Mock Test */}
          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
            <h2 className="text-lg font-bold text-gray-700">3. Create Mock Test</h2>
            <form onSubmit={handleAddExam} className="space-y-3">
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required className="w-full p-2 border rounded">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.courses?.title})</option>)}
              </select>
              <input type="text" placeholder="Test Title (e.g. Mock Test 1)" required value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-2 border rounded" />
              <input type="number" placeholder="Duration (Minutes)" required value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border rounded" />
              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Create Test</button>
            </form>
          </div>

          {/* 4. Add Question */}
          <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
            <h2 className="text-lg font-bold text-gray-700">4. Add Question to Test</h2>
            <form onSubmit={handleAddQuestion} className="space-y-3">
              <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} required className="w-full p-2 border rounded">
                <option value="">Select Target Test</option>
                {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title} ({ex.subjects?.title})</option>)}
              </select>
              <textarea placeholder="Question Text" required value={qText} onChange={(e) => setQText(e.target.value)} className="w-full p-2 border rounded h-20" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Option A" required value={optA} onChange={(e) => setOptA(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Option B" required value={optB} onChange={(e) => setOptB(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Option C" required value={optC} onChange={(e) => setOptC(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Option D" required value={optD} onChange={(e) => setOptD(e.target.value)} className="p-2 border rounded" />
              </div>
              <select value={correctOpt} onChange={(e) => setCorrectOpt(e.target.value)} className="w-full p-2 border rounded">
                <option value="A">Correct: Option A</option>
                <option value="B">Correct: Option B</option>
                <option value="C">Correct: Option C</option>
                <option value="D">Correct: Option D</option>
              </select>
              <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">Add Question</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
