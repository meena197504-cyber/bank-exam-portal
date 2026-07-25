'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function ExamEnginePage() {
  const params = useParams();
  const examId = params?.id;
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId) fetchExamDetails();
  }, [examId]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const fetchExamDetails = async () => {
    setLoading(true);
    // Fetch Exam metadata
    const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
    if (examData) {
      setExam(examData);
      setTimeLeft((examData.duration_minutes || 120) * 60);
    }

    // Fetch MCQs for this exam
    const { data: questionsData } = await supabase.from('questions').select('*').eq('exam_id', examId);
    setQuestions(questionsData || []);
    setLoading(false);
  };

  const handleSelectOption = (option) => {
    if (isSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [questions[currentIndex].id]: option });
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;
    if (!confirm('Are you sure you want to end and submit the exam?')) return;

    setIsSubmitted(true);

    // Calculate Scores
    let score = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_option) {
        score += 1;
        correctCount += 1;
      }
    });

    const finalResult = {
      score,
      total_questions: questions.length,
      correct_answers: correctCount,
      answers: selectedAnswers,
    };

    setResult(finalResult);

    // Save Score to Supabase DB for candidate history & admin viewing
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.from('exam_results').insert([
        {
          user_id: userData.user.id,
          exam_id: examId,
          score: score,
          total_questions: questions.length,
          correct_answers: correctCount,
          user_responses: selectedAnswers,
        },
      ]);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Exam Engine...</div>;
  if (!questions.length) return <div className="p-10 text-center text-red-500">No questions found for this exam.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold">{exam?.title || 'Bank Exam Mock Test'}</h1>
          <p className="text-xs text-blue-200">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        {!isSubmitted ? (
          <div className="bg-red-600 text-white font-mono px-4 py-2 rounded-md font-bold text-lg animate-pulse">
            ⏱ Time Left: {formatTime(timeLeft)}
          </div>
        ) : (
          <div className="bg-green-600 text-white font-bold px-4 py-2 rounded-md">
            Exam Submitted
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Question Column */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow flex flex-col justify-between">
          {!isSubmitted ? (
            <div>
              <div className="mb-6 border-b pb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  Q{currentIndex + 1}
                </span>
                <p className="text-lg font-semibold text-gray-800 mt-2">{currentQ.question_text}</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <label
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                      selectedAnswers[currentQ.id] === opt
                        ? 'border-blue-600 bg-blue-50 font-medium'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQ.id}`}
                      checked={selectedAnswers[currentQ.id] === opt}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">
                      <strong>{opt})</strong> {currentQ[`option_${opt.toLowerCase()}`]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            /* Results & Review View */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Exam Completed!</h2>
                <p className="text-4xl font-extrabold text-blue-600 my-2">
                  {result?.score} / {result?.total_questions} Marks
                </p>
                <p className="text-sm text-gray-600">
                  Accuracy: {Math.round((result?.correct_answers / result?.total_questions) * 100)}%
                </p>
              </div>

              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Detailed Question Review</h3>
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correct_option;
                return (
                  <div key={q.id} className={`p-4 border rounded-lg ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="font-semibold text-gray-900">Q{idx + 1}. {q.question_text}</p>
                    <div className="text-sm mt-2 space-y-1">
                      <p className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        Your Answer: {userAns ? `${userAns}) ${q[`option_${userAns.toLowerCase()}`]}` : 'Not Answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-700 font-medium">
                          Correct Answer: {q.correct_option}) {q[`option_${q.correct_option.toLowerCase()}`]}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-gray-600 text-xs italic mt-2 bg-white p-2 rounded border">
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation Controls */}
          {!isSubmitted && (
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="px-4 py-2 border rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-gray-100"
              >
                ← Previous
              </button>
              <button
                onClick={handleSubmitExam}
                className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700"
              >
                End & Submit Exam
              </button>
              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold disabled:opacity-50 hover:bg-blue-700"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Question Navigation Palette Sidebar */}
        {!isSubmitted && (
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h3 className="font-bold text-gray-800 mb-4 text-sm border-b pb-2">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-full rounded font-semibold text-xs border transition ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-100 text-blue-900'
                        : isAnswered
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 text-xs space-y-2 border-t pt-4 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div> Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border rounded"></div> Unanswered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-600 rounded"></div> Current Question
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
