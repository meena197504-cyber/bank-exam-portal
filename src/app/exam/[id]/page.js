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

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const fetchExamAndQuestions = async () => {
    // 1. Check user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 2. Fetch Exam Details
    const { data: examData } = await supabase
      .from('exams')
      .select('*, subjects(title)')
      .eq('id', examId)
      .single();

    // 3. Fetch Questions
    const { data: qData } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);

    if (examData) {
      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);
    }
    if (qData) {
      setQuestions(qData);
    }

    setLoading(false);
  };

  const handleOptionSelect = (optionKey) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionKey,
    }));
  };

  const handleSubmitExam = async () => {
    let finalScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_option) {
        finalScore += q.marks || 1;
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);

    // Save score and selected answers payload for reviewing solutions
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
      console.error('Error saving test score:', err);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center font-medium">Loading Exam Portal...</div>;
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-gray-600">No questions found for this exam.</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-xs text-gray-500">Subject: {exam.subjects?.title || 'General'}</p>
        </div>
        {!isSubmitted && (
          <div className="bg-red-50 border border-red-200 px-4 py-1.5 rounded-md text-red-600 font-mono font-bold">
            ⏱ Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* Main Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 grid md:grid-cols-3 gap-6">
        
        {/* Question Area */}
        <div className="md:col-span-2 bg-white rounded-lg p-6 shadow-sm border flex flex-col justify-between">
          {!isSubmitted ? (
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <span className="font-semibold text-gray-700">Question {currentIdx + 1} of {questions.length}</span>
                <span className="text-xs bg-gray-100 px-2.5 py-1 rounded text-gray-600">Marks: {currentQuestion.marks || 1}</span>
              </div>

              <p className="text-gray-800 font-medium text-lg mb-6">{currentQuestion.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optionText = currentQuestion[`option_${opt.toLowerCase()}`];
                  const isSelected = selectedAnswers[currentIdx] === opt;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleOptionSelect(opt)}
                      className={`w-full text-left p-3.5 rounded-lg border transition text-sm font-medium ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="inline-block w-6 font-bold">{opt}.</span> {optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Result Overview */
            <div className="text-center py-8 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Test Completed!</h2>
              <div className="text-5xl font-extrabold text-blue-600">
                {score} / {questions.length}
              </div>
              <p className="text-sm text-gray-600">Your score has been saved to your dashboard.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Navigation Actions */}
          {!isSubmitted && (
            <div className="flex justify-between items-center mt-8 border-t pt-4">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="px-4 py-2 border text-gray-600 rounded disabled:opacity-40 text-sm font-semibold"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  className="px-5 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
                >
                  Submit Test
                </button>
              )}
            </div>
          )}
        </div>

        {/* Question Palette */}
        <div className="bg-white rounded-lg p-5 shadow-sm border h-fit space-y-4">
          <h3 className="font-bold text-gray-800 text-sm">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, idx) => {
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCurrent = currentIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded font-semibold text-xs border transition ${
                    isCurrent
                      ? 'ring-2 ring-blue-600 border-blue-600 bg-white text-blue-600'
                      : isAnswered
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t pt-3 text-xs space-y-2 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded-sm inline-block"></span> Answered
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
