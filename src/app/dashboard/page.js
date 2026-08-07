'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) setProfile(profileData);

    // Fetch Exams
    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (examsData) setExams(examsData);

    // Fetch Past Results
    const { data: resultsData } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (resultsData) setResults(resultsData);

    setLoading(false);
  };

  // Mock Payment Activation Handler (Simulating Payment Gateway Success)
  const handleUpgradePlan = async () => {
    setPaymentLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Mark profile as subscribed
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ is_subscribed: true })
        .eq('id', user.id);

      // 2. Log transaction
      await supabase.from('payments').insert([
        {
          user_id: user.id,
          amount: 499,
          payment_id: `PAY_MOCK_${Date.now()}`,
          status: 'completed'
        }
      ]);

      if (!profileErr) {
        alert('Payment Successful! Full access unlocked.');
        fetchDashboardData();
      }
    }
    setPaymentLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Dashboard...</div>;
  }

  const isUserSubscribed = profile?.is_subscribed || false;
  const freeTestsAttempted = results.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* User Status Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.full_name || 'Student'}!</h1>
              {isUserSubscribed ? (
                <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold">VIP Premium Member</span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-bold">Free Plan (1 Test Limit)</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Email: <span className="font-medium text-gray-700">{profile?.email}</span> | Phone: <span className="font-medium text-gray-700">{profile?.phone || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isUserSubscribed && (
              <button
                onClick={handleUpgradePlan}
                disabled={paymentLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-700 shadow-sm"
              >
                {paymentLoading ? 'Processing...' : 'Unlock All Tests (₹499)'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-200 text-sm font-semibold hover:bg-red-100"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Available Mock Tests */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Mock Tests</h2>
          {exams.length === 0 ? (
            <p className="text-gray-500 py-2">No mock tests available right now.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {exams.map((exam, index) => {
                // Free rule: Either exam is marked free, OR it's the student's 1st exam attempt
                const isFreeExam = exam.is_free || index === 0;
                const canAccess = isUserSubscribed || isFreeExam || freeTestsAttempted < 1;

                return (
                  <div key={exam.id} className="p-5 border rounded-lg bg-gray-50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">
                          Bank Exam
                        </span>
                        {isFreeExam ? (
                          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Free Access</span>
                        ) : (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Premium</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mt-2">{exam.title}</h3>
                      <p className="text-xs text-gray-500 mt-2">⏱ Duration: {exam.duration_minutes} Minutes</p>
                    </div>

                    {canAccess ? (
                      <button
                        onClick={() => router.push(`/exam/${exam.id}`)}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700"
                      >
                        Start Test
                      </button>
                    ) : (
                      <button
                        onClick={handleUpgradePlan}
                        className="mt-4 w-full bg-amber-500 text-white py-2 rounded font-semibold text-sm hover:bg-amber-600 flex items-center justify-center gap-1"
                      >
                        🔒 Upgrade to Unlock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Results */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Recent Performance</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 py-2">You haven't attempted any mock tests yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map((res) => (
                <div key={res.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Mock Test Attempt</p>
                    <p className="text-xs text-gray-500 mt-0.5">Attempted on: {new Date(res.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-blue-600 text-lg">
                      {res.score} / {res.total_questions}
                    </span>
                    <button
                      onClick={() => router.push(`/exam/review/${res.id}`)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200 hover:bg-blue-100"
                    >
                      Review Solutions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
