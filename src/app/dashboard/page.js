'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // 2. Fetch user profile (includes phone & full_name)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // 3. Fetch all active mock tests with subject & course info
    const { data: examsData } = await supabase
      .from('exams')
      .select('*, subjects(title, courses(title))')
      .order('created_at', { ascending: false });

    if (examsData) {
      setExams(examsData);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & User Profile Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.full_name || 'Student'}!</h1>
            <p className="text-sm text-gray-500 mt-1">
              Email: <span className="font-medium text-gray-700">{profile?.email}</span> | Phone: <span className="font-medium text-gray-700">{profile?.phone || 'N/A'}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-200 text-sm font-semibold hover:bg-red-100"
          >
            Log Out
          </button>
        </div>

        {/* Available Mock Tests */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Mock Tests</h2>

          {exams.length === 0 ? (
            <p className="text-gray-500 py-4">No mock tests available at the moment. Please check back later!</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="p-5 border rounded-lg hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">
                      {exam.subjects?.courses?.title || 'General'}
                    </span>
                    <h3 className="text-lg font-bold text-gray-800 mt-2">{exam.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">Subject: {exam.subjects?.title || 'General'}</p>
                    <p className="text-xs text-gray-500 mt-2">⏱ Duration: {exam.duration_minutes} Minutes</p>
                  </div>

                  <button
                    onClick={() => router.push(`/exam/${exam.id}`)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700"
                  >
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
