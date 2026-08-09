'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'bulk' | 'analytics'
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    verifyAdminAndFetchData();
  }, []);

  const verifyAdminAndFetchData = async () => {
    // 1. Check user session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 2. Verify admin role in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    setIsAdmin(true);
    setCheckingAuth(false);

    // 3. Fetch Admin Data
    fetchData();
  };

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

  // Delete Handlers
  const handleDeleteCourse = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove its subjects and tests.`)) return;
    setLoading(true);
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage(`Course "${title}" deleted successfully.`); fetchData(); }
    setLoading(false);
  };

  const handleDeleteSubject = async (id, title) => {
    if (!confirm(`Delete subject "${title}"?`)) return;
    setLoading(true);
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage(`Subject "${title}" deleted.`); fetchData(); }
    setLoading(false);
  };

  const handleDeleteExam = async (id, title) => {
    if (!confirm(`Delete mock test "${title}"?`)) return;
    setLoading(true);
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage(`Mock test "${title}" deleted.`); fetchData(); }
    setLoading(false);
  };

  // Form Submissions
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

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkExamId) return setMessage('Please select a target mock test.');
    if (!bulkJson.trim()) return setMessage('Please paste valid JSON data.');

    setLoading(true);
    try {
      const parsedQuestions = JSON.parse(bulkJson);
      const formattedData = parsedQuestions.map((q) => ({
        exam_id: bulkExamId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: String(q.correct_option).toUpperCase(),
        explanation: q.explanation || '',
        marks: q.marks ? Number(q.marks) : 1
      }));

      const { error } = await supabase.from('questions').insert(formattedData);
      if (error) setMessage(`Database Error: ${error.message}`);
      else {
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

  if (checkingAuth) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Verifying Admin Permissions...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border max-w-md space-y-4">
          <div className="text-4xl">⛔</div>
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 text-sm">
            You do not have administrator permissions to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-sm"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

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
        
        {/* Navigation Header */}
        <div className="flex justify-between items-center border-b pb-4 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
            <p className="text-xs text-gray-500">Secured Access (Authorized Admins Only)</p>
          </div>
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
              ⚡ Bulk Questions
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              Student Scores
            </button>
          </div>
        </div>

        {message && <div className="p-3 bg-blue-100 text-blue-800 rounded font-medium text-sm">{message}</div>}

        {/* TAB 1: MANAGE PORTAL */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            
            {/* Create Forms Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 1. Add Course */}
              <div className="bg-white p-5 rounded-lg shadow-sm border space-y-3">
                <h2 className="text-lg font-bold text-gray-700">1. Add Course</h2>
                <form onSubmit={handleAddCourse} className="space-y-3">
                  <input type="text" placeholder="Course Title (e.g. TNPSC Group 2)" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full p-2 border rounded" />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700">Add Course</button>
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
                  <input type="text" placeholder="Subject Title (e.g. General Tamil)" required value={subjectTitle} onChange={(e) => setSubjectTitle(e.target.value)} className="w-full p-2 border rounded" />
                  <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded font-semibold text-sm hover:bg-green-700">Add Subject</button>
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
                  <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded font-semibold text-sm hover:bg-purple-700">Create Test</button>
                </form>
              </div>

              {/* 4. Add Question */}
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
                  <textarea placeholder="Solution Explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="w-full p-2 border rounded h-16" />
                  <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2 rounded font-semibold text-sm hover:bg-orange-700">Add Question</button>
                </form>
              </div>
            </div>

            {/* DELETE MANAGEMENT SECTION */}
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-3">Existing Content Management (Delete Options)</h2>

              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Courses List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-gray-700 uppercase">Courses ({courses.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded bg-gray-50">
                    {courses.map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                        <span className="font-medium text-gray-800 truncate">{c.title}</span>
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-gray-700 uppercase">Subjects ({subjects.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded bg-gray-50">
                    {subjects.map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                        <div className="truncate">
                          <p className="font-medium text-gray-800">{s.title}</p>
                          <p className="text-xs text-gray-400">{s.courses?.title}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(s.id, s.title)}
                          className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exams List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-gray-700 uppercase">Mock Tests ({exams.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded bg-gray-50">
                    {exams.map((ex) => (
                      <div key={ex.id} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                        <div className="truncate">
                          <p className="font-medium text-gray-800">{ex.title}</p>
                          <p className="text-xs text-gray-400">{ex.subjects?.title}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteExam(ex.id, ex.title)}
                          className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 ml-2"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Bulk Upload Questions via JSON</h2>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Mock Test</label>
                <select
                  value={bulkExamId}
                  onChange={(e) => setBulkExamId(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Target Test</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title} ({ex.subjects?.title})</option>
                  ))}
                </select>
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
                className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 text-sm"
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
              <p className="text-gray-500 py-4 text-center text-sm">No test submissions found.</p>
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
