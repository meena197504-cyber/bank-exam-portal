'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
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

    // 1. Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) setProfile(profileData);

    // 2. Fetch All Courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (coursesData) setCourses(coursesData);

    // 3. Fetch User's Purchased Courses
    const { data: subData } = await supabase
      .from('user_course_subscriptions')
      .select('course_id')
      .eq('user_id', user.id);

    if (subData) {
      setUserSubscriptions(subData.map((s) => s.course_id));
    }

    // 4. Fetch Test Performance Results
    const { data: resultsData } = await supabase
      .from('test_results')
      .select('*, exams(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (resultsData) setResults(resultsData);

    setLoading(false);
  };

  // Razorpay Checkout Handler for a specific Course
  const handleBuyCourse = async (courseId, courseTitle) => {
    setPaymentLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // 1. Create order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 499 }),
      });

      const orderData = await orderRes.json();
      if (!orderData.orderId) {
        alert('Failed to initiate payment.');
        setPaymentLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout Popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Bank & TNPSC Exam Portal',
        description: `Unlock Full Pass: ${courseTitle}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // 3. Verify Payment Signature
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            // 4. Record course subscription
            await supabase.from('user_course_subscriptions').insert([
              {
                user_id: user.id,
                course_id: courseId,
                payment_id: response.razorpay_payment_id,
              },
            ]);

            alert(`🎉 Congratulations! You have unlocked ${courseTitle}.`);
            fetchDashboardData();
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: profile?.full_name || 'Student',
          email: profile?.email || '',
          contact: profile?.phone || '',
        },
        theme: { color: '#2563eb' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Error initiating checkout.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Catalog...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {profile?.full_name || 'Student'}!</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select a target course below to start practicing mock tests.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-200 text-sm font-semibold hover:bg-red-100"
          >
            Log Out
          </button>
        </div>

        {/* Course Catalog Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Available Exam Categories</h2>
          
          {courses.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded border">No courses added yet by admin.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map((course) => {
                const isPurchased = userSubscriptions.includes(course.id);

                return (
                  <div key={course.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                          Target Exam
                        </span>
                        {isPurchased ? (
                          <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            ✓ Unlocked
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.description || 'Complete test series and subject notes.'}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <button
                        onClick={() => router.push(`/course/${course.id}`)}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700"
                      >
                        View Subjects & Tests
                      </button>

                      {!isPurchased && (
                        <button
                          onClick={() => handleBuyCourse(course.id, course.title)}
                          disabled={paymentLoading}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition"
                        >
                          Unlock All Tests in {course.title} (₹499)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Your Recent Test Scores</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 py-2 text-sm">You haven't attempted any mock tests yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map((res) => (
                <div key={res.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-800">{res.exams?.title || 'Mock Test'}</p>
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
