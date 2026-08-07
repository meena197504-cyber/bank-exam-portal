'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'bulk' | 'analytics'
  
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');

  // Exam Form
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(60);

  // Single Question Form
  const [selectedExamId, setSelectedExamId] = useState('');
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [explanation, setExplanation] = useState('');

  // Bulk Question Form
  const [bulkExamId, setBulkExamId] = useState('');
  const [bulkJson, setBulkJson] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const { data: subjectsData } = await supabase.from('subjects').select('*, courses(title)').order('created_at', { ascending: false });
    const { data: examsData } = await supabase.from('exams').select('*, subjects(title)').order('created_at', { ascending: false });
    
    const { data: resultsData } = await supabase
      .from('test_results')
      .select('*, profiles(full_name, email, phone), exams(title)')
      .order('created_at', { ascending: false });

    if (coursesData) setCourses(coursesData);
    if (subjectsData) setSubjects(subjectsData);
    if (examsData) setExams(examsData);
    if (resultsData) setTestResults(resultsData);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('courses').insert([{ title: courseTitle }]);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage('Course added successfully!'); setCourseTitle(''); fetchData(); }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return setMessage('Select a course first.');
    setLoading(true);
    const { error } = await supabase.from('subjects').insert([{ course_id: selectedCourseId, title: subjectTitle }]);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage('Subject added successfully!'); setSubjectTitle(''); fetchData(); }
    setLoading(false);
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return setMessage('Select a subject first.');
    setLoading(true);
    const { error } = await supabase.from('exams').insert([{ subject_id: selectedSubjectId, title: examTitle, duration_minutes: Number(duration) }]);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage('Mock Test created successfully!'); setExamTitle(''); fetchData(); }
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
      correct_option: correctOpt,
      explanation: explanation
    }]);

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Question added successfully!');
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setExplanation('');
      fetchData();
    }
    setLoading(false);
  };

  // Bulk Upload Handler
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkExamId) return setMessage('Please select a target mock test.');
    if (!bulkJson.trim()) return setMessage('Please paste valid JSON data.');

    setLoading(true);
    setMessage('');

    try {
      const parsedQuestions = JSON.parse(bulkJson);

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('JSON data must be a non-empty array of question objects.');
      }

      // Map questions to include target exam_id
      const formattedData = parsedQuestions.map((q, idx) => {
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) {
          throw new Error(`Question at index ${idx + 1} is missing required fields.`);
        }
        return {
          exam_id: bulkExamId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: String(q.correct_option).toUpperCase(),
          explanation: q.explanation || '',
          marks: q.marks ? Number(q.marks) : 1
        };
      });

      const { error } = await supabase.from('questions').insert(formattedData);

      if (error) {
        setMessage(`Database Error: ${error.message}`);
      } else {
        setMessage(`Successfully uploaded ${formattedData.length} questions!`);
        setBulkJson('');
        fetchData();
      }
    } catch (err) {
      setMessage(`Invalid JSON Format: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop/upload for JSON
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkJson(event.target.result);
    };
    reader.readAsText(file);
  };

  const filteredResults = testResults.filter((res) => {
    const search = searchTerm.toLowerCase();
    const name = res.profiles?.full_name?.toLowerCase() || '';
    const email = res.profiles?.email?.toLowerCase() || '';
    const phone = res.profiles?.phone?.toLowerCase() || '';
    const exam = res.exams?.title?.toLowerCase() || '';
    return name.includes(search) || email.includes(search) || phone.includes(search) || exam.includes(search);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'manage' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              Single Manage
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'bulk' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              ⚡ Bulk Upload Questions
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              Student Scores & Analytics
            </button>
          </div>
        </div>

        {message && <div className="p-3 bg-blue-100 text-blue-800 rounded font-medium">{message}</div>}

        {/* TAB 1: MANAGE PORTAL */}
        {activeTab === 'manage' && (
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

            {/* 4. Add Single Question */}
            <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
              <h2 className="text-lg font-bold text-gray-700">4. Add Single Question</h2>
              <form onSubmit={handleAddQuestion} className="space-y-3">
                <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} required className="w-full p-2 border rounded">
                  <option value="">Select Target Test</option>
                  {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title} ({ex.subjects?.title})</option>)}
                </select>
                <textarea placeholder="Question Text" required value={qText} onChange={(e) => setQText(e.target.value)} className="w-full p-2 border rounded h-16" />
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
                <textarea placeholder="Solution Explanation (Optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full p-2 border rounded h-16" />
                <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">Add Question</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-5">
            <h2 className="text-xl font-bold text-gray-800">Bulk Upload Questions via JSON</h2>
            <p className="text-sm text-gray-600">Select a target test, paste your JSON array of questions or choose a `.json` file, and upload all questions at once.</p>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Mock Test</label>
                <select
                  value={bulkExamId}
                  onChange={(e) => setBulkExamId(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Target Test</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title} ({ex.subjects?.title})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Upload `.json` File (Optional)</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">JSON Questions Payload</label>
                <textarea
                  placeholder='[{"question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A", "explanation": "..."}]'
                  required
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  className="w-full p-3 border rounded h-64 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading Questions...' : 'Batch Import Questions'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ANALYTICS & SCORES */}
        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">All Student Submissions ({filteredResults.length})</h2>
              <input
                type="text"
                placeholder="Search by student, email, phone or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded w-full md:w-80 text-sm"
              />
            </div>

            {filteredResults.length === 0 ? (
              <p className="text-gray-500 py-4 text-center">No test submissions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-700">
                      <th className="p-3">Student</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Test</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Percentage</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((res) => {
                      const pct = Math.round((res.score / res.total_questions) * 100) || 0;
                      return (
                        <tr key={res.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-800">{res.profiles?.full_name || 'Student'}</td>
                          <td className="p-3 text-xs text-gray-600">
                            <div>{res.profiles?.email}</div>
                            <div className="text-gray-400">{res.profiles?.phone || 'No phone'}</div>
                          </td>
                          <td className="p-3 font-medium text-gray-700">{res.exams?.title || 'Mock Test'}</td>
                          <td className="p-3 font-extrabold text-blue-600">{res.score} / {res.total_questions}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${pct >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-500">{new Date(res.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
