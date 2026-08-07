'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ExamReviewPage() {
  const { resultId } = useParams();
  const router = useRouter();

  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewData();
  }, [resultId]);

  const fetchReviewData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch result record
    const { data: resData } = await supabase
      .from('test_results')
      .select('*, exams(title, subjects(title))')
      .eq('id', resultId)
      .single();

    if (resData) {
      setResult(resData);

      // 2. Fetch questions for this exam
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', resData.exam_id);

      if (qData) setQuestions(qData);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Solutions...</div>;
  }

  if (!result || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-gray-600">Review data not found.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const userAnswers = result.answers || {};

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{result.exams?.title} — Solutions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Attempted on: {new Date(result.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Score</p>
              <p className="text-2xl font-extrabold text-blue-600">{result.score} / {result.total_questions}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded hover:bg-gray-900"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Questions Breakdown */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const selectedOpt = userAnswers[idx];
            const isCorrect = selectedOpt === q.correct_option;
            const isUnanswered = !selectedOpt;

            return (
              <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <span className="font-bold text-gray-800">Q{idx + 1}. {q.question_text}</span>
                  {isCorrect ? (
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">Correct (+1)</span>
                  ) : isUnanswered ? (
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">Unanswered (0)</span>
                  ) : (
                    <span className="text-xs font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">Incorrect (0)</span>
                  )}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optText = q[`option_${opt.toLowerCase()}`];
                    const isUserPick = selectedOpt === opt;
                    const isCorrectOpt = q.correct_option === opt;

                    let style = 'border-gray-200 bg-gray-50 text-gray-700';
                    if (isCorrectOpt) {
                      style = 'border-green-500 bg-green-50 text-green-900 font-bold';
                    } else if (isUserPick && !isCorrect) {
                      style = 'border-red-500 bg-red-50 text-red-900 font-bold';
                    }

                    return (
                      <div key={opt} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${style}`}>
                        <span className="font-bold">{opt}.</span>
                        <span className="flex-1">{optText}</span>
                        {isCorrectOpt && <span className="text-xs text-green-700 font-semibold">(Correct Answer)</span>}
                        {isUserPick && !isCorrectOpt && <span className="text-xs text-red-700 font-semibold">(Your Choice)</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Block */}
                {q.explanation && (
                  <div className="p-3.5 bg-blue-50 border-l-4 border-blue-500 rounded text-xs text-blue-900 space-y-1">
                    <p className="font-bold">Explanation:</p>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
