'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ExamPage() {
  const { id: examId } = useParams();
  const router = useRouter();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (examId) {
      verifyAndFetchExam();
    }
  }, [examId]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const verifyAndFetchExam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch Profile, past test count, and exam details
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: results } = await supabase.from('test_results').select('id').eq('user_id', user.id);
    const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();

    // 2. Check freemium access conditions
    const isSubscribed = profile?.is_subscribed || false;
    const isFreeExam = examData?.is_free || false;
    const attemptsCount = results?.length || 0;

    if (!isSubscribed && !isFreeExam && attemptsCount >= 1) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setExam(examData);
    setTimeLeft(examData ? examData.duration_minutes * 60 : 3600);

    // 3. Fetch Questions
    const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', examId);
    if (qData) setQuestions(qData);

    setLoading(false);
  };

  const handleOptionSelect = (optionKey) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optionKey }));
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;

    let finalScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_option) {
        finalScore += q.marks || 1;
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('test_results').insert([
          {
            user_id: user.id,
            exam_id: examId,
            score: finalScore,
            total_questions: questions.length,
            answers: selectedAnswers,
          },
        ]);
      }
    } catch (err) {
      console.error('Error saving result:', err);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Verifying Exam Access...</div>;
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border max-w-md space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800">Test Locked</h2>
          <p className="text-gray-600 text-sm">
            You have used your 1 Free Exam attempt. Please subscribe to unlock unlimited mock tests!
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 bg-green-600 text-white font-bold rounded hover:bg-green-700"
          >
            Go to Dashboard & Upgrade
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const userChoice = selectedAnswers[currentIdx];
  const hasAnsweredCurrent = userChoice !== undefined;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{exam?.title}</h1>
          <p className="text-xs text-gray-500">Bank Test Series</p>
        </div>
        {!isSubmitted && (
          <div className="bg-red-50 border border-red-200 px-4 py-1.5 rounded-md text-red-600 font-mono font-bold">
            ⏱ Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Question & Instant Solutions */}
        <div className="md:col-span-2 bg-white rounded-lg p-6 shadow-sm border flex flex-col justify-between space-y-6">
          {!isSubmitted ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold text-gray-700">Question {currentIdx + 1} of {questions.length}</span>
                <span className="text-xs bg-gray-100 px-2.5 py-1 rounded text-gray-600">Marks: {currentQuestion?.marks || 1}</span>
              </div>

              <p className="text-gray-800 font-medium text-lg">{currentQuestion?.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionText = currentQuestion?.[`option_${opt.toLowerCase()}`];
                  const isCorrectOpt = currentQuestion?.correct_option === opt;
                  const isUserPick = userChoice === opt;

                  let buttonStyle = 'border-gray-200 hover:bg-gray-50 text-gray-700 bg-white';
                  let badge = null;

                  if (hasAnsweredCurrent) {
                    if (isCorrectOpt) {
                      buttonStyle = 'border-green-600 bg-green-50 text-green-900 font-bold';
                      badge = <span className="text-xs text-green-700 font-bold ml-auto">✓ Correct Answer</span>;
                    } else if (isUserPick && !isCorrectOpt) {
                      buttonStyle = 'border-red-500 bg-red-50 text-red-900 font-bold';
                      badge = <span className="text-xs text-red-700 font-bold ml-auto">✗ Your Answer</span>;
                    } else {
                      buttonStyle = 'border-gray-200 bg-gray-50 text-gray-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleOptionSelect(opt)}
                      className={`w-full text-left p-3.5 rounded-lg border transition text-sm font-medium flex items-center justify-between ${buttonStyle}`}
                    >
                      <div>
                        <span className="inline-block w-6 font-bold">{opt}.</span> {optionText}
                      </div>
                      {badge}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Solution Block */}
              {hasAnsweredCurrent && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r text-sm text-blue-900 space-y-1.5 transition-all">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <span>💡</span> Solution & Explanation:
                  </div>
                  <p className="text-xs leading-relaxed text-blue-900">
                    {currentQuestion?.explanation || 'No detailed explanation available for this question.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Submitted Screen */
            <div className="text-center py-8 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Test Completed!</h2>
              <div className="text-5xl font-extrabold text-blue-600">
                {score} / {questions.length}
              </div>
              <p className="text-sm text-gray-600">Your performance score has been saved to your dashboard.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Navigation & Always-Visible Submit Button */}
          {!isSubmitted && (
            <div className="flex justify-between items-center border-t pt-4 gap-2 flex-wrap">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="px-4 py-2 border text-gray-600 rounded disabled:opacity-40 text-sm font-semibold"
              >
                Previous
              </button>

              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow-sm"
              >
                Submit Exam
              </button>

              <button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette */}
        <div className="bg-white rounded-lg p-5 shadow-sm border h-fit space-y-4">
          <h3 className="font-bold text-gray-800 text-sm">Question Navigation</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIdx === idx;
              const isCorrect = selectedAnswers[idx] === q.correct_option;

              let style = 'bg-gray-100 text-gray-700 border-gray-200';
              if (isCurrent) {
                style = 'ring-2 ring-blue-600 border-blue-600 bg-white text-blue-600';
              } else if (isAnswered) {
                style = isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded font-semibold text-xs border transition ${style}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t pt-3 text-xs space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded-sm inline-block"></span> Correct
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block"></span> Incorrect
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm inline-block"></span> Unanswered
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
