'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [purchasedExams, setPurchasedExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserAndFetchData();
  }, []);

  const checkUserAndFetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    // Fetch All Active Exams
    const { data: examsData } = await supabase.from('exams').select('*');
    setExams(examsData || []);

    // Fetch Unlocked Purchases
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('exam_id')
      .eq('user_id', user.id);
    setPurchasedExams((purchasesData || []).map((p) => p.exam_id));

    // Fetch Candidate Score History
    const { data: resultsData } = await supabase
      .from('exam_results')
      .select('*, exams(title)')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });
    setMyResults(resultsData || []);

    setLoading(false);
  };

  const handleStartExam = (examId) => {
    router.push(`/exam/${examId}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Candidate Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-900">Candidate Dashboard</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1.5 px-3 rounded"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Active Exams Grid */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Available Mock Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const isUnlocked = purchasedExams.includes(exam.id);
              return (
                <div key={exam.id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">{exam.title}</h3>
                    <p className="text-xs text-gray-500 mb-4">Duration: {exam.duration_minutes} Mins</p>
                  </div>
                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 transition text-sm"
                      >
                        Start Mock Test
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">₹{exam.price_inr}</span>
                        <button
                          onClick={() => alert('Razorpay Payment Gateway Modal Triggers Here')}
                          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Unlock Test
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Previous Score History */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Previous Test Scores</h2>
          {myResults.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500 text-sm">
              No completed tests yet. Select a mock test above to begin practicing!
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-700">
                  <tr>
                    <th className="p-3">Exam Name</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Correct Answers</th>
                    <th className="p-3">Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myResults.map((res) => (
                    <tr key={res.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{res.exams?.title || `Exam ID: ${res.exam_id}`}</td>
                      <td className="p-3 font-bold text-blue-600">{res.score} Marks</td>
                      <td className="p-3">{res.correct_answers} / {res.total_questions}</td>
                      <td className="p-3 text-gray-500">{new Date(res.submitted_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
