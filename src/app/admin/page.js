'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'purchases', 'results', 'exams'
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    
    // Fetch Profiles
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(usersData || []);

    // Fetch Purchases with Exam & Profile info
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*, exams(title), profiles(email)')
      .order('created_at', { ascending: false });
    setPurchases(purchasesData || []);

    // Fetch Exam Results
    const { data: resultsData } = await supabase
      .from('exam_results')
      .select('*, exams(title), profiles(email)')
      .order('submitted_at', { ascending: false });
    setResults(resultsData || []);

    // Fetch Exams
    const { data: examsData } = await supabase.from('exams').select('*');
    setExams(examsData || []);

    setLoading(false);
  };

  // Allow Admin to manually grant access without payment
  const handleGrantAccess = async (userId, examId) => {
    if (!confirm('Grant free access to this user for the selected exam?')) return;

    const { error } = await supabase.from('purchases').insert([
      {
        user_id: userId,
        exam_id: examId,
        razorpay_payment_id: 'MANUAL_GRANT_ADMIN',
        status: 'PAID'
      }
    ]);

    if (error) {
      alert('Error granting access: ' + error.message);
    } else {
      alert('Access granted successfully!');
      fetchAdminData();
    }
  };

  // Delete Purchase / Revoke Access
  const handleRevokeAccess = async (purchaseId) => {
    if (!confirm('Are you sure you want to revoke exam access?')) return;

    const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);
    if (error) {
      alert('Error revoking access: ' + error.message);
    } else {
      alert('Access revoked.');
      fetchAdminData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-200 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Admin Control Center</h1>
            <p className="text-xs text-gray-500">Manage candidates, verify Razorpay payments, and monitor results.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Student Dashboard
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-4 font-medium text-sm border-b-2 transition ${
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registered Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-2 px-4 font-medium text-sm border-b-2 transition ${
              activeTab === 'purchases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payments & Unlocks ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-2 px-4 font-medium text-sm border-b-2 transition ${
              activeTab === 'results' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Exam Scores & Submissions ({results.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`pb-2 px-4 font-medium text-sm border-b-2 transition ${
              activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Exams ({exams.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading admin records...</div>
        ) : (
          <div>
            {/* TAB 1: USERS */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-700">
                      <th className="p-3">User ID</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs text-gray-500">{u.id}</td>
                        <td className="p-3 font-medium text-gray-900">{u.email}</td>
                        <td className="p-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              const examId = prompt('Enter Exam ID to unlock for this user (e.g. 1):', '1');
                              if (examId) handleGrantAccess(u.id, examId);
                            }}
                            className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                          >
                            + Grant Free Exam Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: PAYMENTS */}
            {activeTab === 'purchases' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-700">
                      <th className="p-3">Candidate Email</th>
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Razorpay Payment ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{p.profiles?.email || 'Unknown User'}</td>
                        <td className="p-3">{p.exams?.title || `Exam ID: ${p.exam_id}`}</td>
                        <td className="p-3 font-mono text-xs text-blue-600">{p.razorpay_payment_id}</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleRevokeAccess(p.id)}
                            className="text-red-600 hover:underline text-xs font-semibold"
                          >
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: RESULTS */}
            {activeTab === 'results' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-700">
                      <th className="p-3">Candidate Email</th>
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Correct / Total</th>
                      <th className="p-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{r.profiles?.email || 'Unknown'}</td>
                        <td className="p-3">{r.exams?.title || `Exam ID: ${r.exam_id}`}</td>
                        <td className="p-3 font-bold text-blue-700">{r.score} marks</td>
                        <td className="p-3">{r.correct_answers} / {r.total_questions}</td>
                        <td className="p-3 text-gray-500">{new Date(r.submitted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: EXAMS */}
            {activeTab === 'exams' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((e) => (
                  <div key={e.id} className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{e.title}</h3>
                      <p className="text-xs text-gray-500">ID: {e.id} | Duration: {e.duration_minutes} mins</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-green-700">₹{e.price_inr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
