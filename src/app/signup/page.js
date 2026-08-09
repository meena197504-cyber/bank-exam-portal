'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Sign up user and set explicit redirect URL
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (data.user) {
        // 2. Insert user profile metadata
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: fullName,
            email: email,
            phone: phone,
          },
        ]);

        setMessage('Verification email sent! Please check your inbox and click the link.');
      }
    } catch (err) {
      setMessage(`Unexpected Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 text-center">Create Account</h1>
          <p className="text-sm text-gray-500 text-center mt-1">Join the Bank & TNPSC Exam Portal</p>
        </div>

        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              placeholder="student@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="9876543210"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-600">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-blue-600 font-bold hover:underline">
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
