import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { FORMAL_VOCABULARY_LIST, VocabularyItem } from '../data/vocabulary';
import { speechService } from '../utils/speech';

type QuizType = 'multiple_choice' | 'spelling' | 'etiquette';

interface QuizModeProps {
  vocabularyList?: VocabularyItem[];
}

export const QuizMode: React.FC<QuizModeProps> = ({
  vocabularyList = FORMAL_VOCABULARY_LIST,
}) => {
  const [quizType, setQuizType] = useState<QuizType>('multiple_choice');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Pool of questions per quiz session
  const [questions, setQuestions] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    restartQuiz();
  }, [quizType, vocabularyList]);

  const restartQuiz = () => {
    const pool =
      quizType === 'etiquette'
        ? vocabularyList.filter((w) => Boolean(w.etiquetteRule))
        : [...vocabularyList];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setSpellingInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setQuizCompleted(false);
  };

  const currentWord = questions[questionIndex] || vocabularyList[0];

  // Generate 4 multiple choice options
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    if (!currentWord) return;
    const others = vocabularyList
      .filter((w) => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);

    const all = [currentWord.word, ...others].sort(() => Math.random() - 0.5);
    setOptions(all);
    setSelectedOption(null);
    setSpellingInput('');
    setIsAnswered(false);
    setIsCorrect(false);
  }, [questionIndex, currentWord, vocabularyList]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option.toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      speechService.speak('Correct! ' + currentWord.word);
    } else {
      setStreak(0);
      speechService.speak('Incorrect. The correct word is ' + currentWord.word);
    }
  };

  const handleSpellingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !spellingInput.trim()) return;

    setIsAnswered(true);
    const correct =
      spellingInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 15);
      setStreak((st) => st + 1);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      speechService.speak('Excellent spelling! ' + currentWord.word);
    } else {
      setStreak(0);
      speechService.speak('The correct spelling is ' + currentWord.word);
    }
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 >= questions.length) {
      setQuizCompleted(true);
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Quiz Mode Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setQuizType('multiple_choice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              quizType === 'multiple_choice'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multiple Choice
          </button>
          <button
            onClick={() => setQuizType('etiquette')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              quizType === 'etiquette'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Etiquette Rules
          </button>
          <button
            onClick={() => setQuizType('spelling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              quizType === 'spelling'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spelling Bee
          </button>
        </div>

        {/* Score & Streak counter */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>Score: {score} pts</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Streak: {streak}🔥</span>
          </div>
        </div>
      </div>

      {!quizCompleted ? (
        <div className="flex flex-col gap-6">
          {/* Question Header & Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Question {questionIndex + 1} of {questions.length}</span>
              <span className="text-amber-400 font-mono">
                {currentWord?.category?.toUpperCase()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                {quizType === 'etiquette'
                  ? 'Identify the Tableware by its Etiquette Rule'
                  : 'Identify the Object in the Formal Table Setting'}
              </span>
              <button
                onClick={() => speechService.speak(currentWord.word)}
                className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                title="Hear clue pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {quizType === 'etiquette' ? (
              <div className="flex flex-col items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-400" />
                <p className="text-base sm:text-lg text-slate-200 font-medium max-w-lg leading-relaxed">
                  "{currentWord.etiquetteRule || currentWord.definition}"
                </p>
              </div>
            ) : quizType === 'multiple_choice' ? (
              <p className="text-base sm:text-lg text-slate-200 font-medium max-w-lg leading-relaxed">
                "{currentWord.definition}"
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-400">
                  Listen to the pronunciation and spell this table setting object:
                </p>
                <button
                  onClick={() => speechService.speak(currentWord.word, { rate: 0.8 })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-bold transition"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Click to Listen Carefully</span>
                </button>
                <span className="text-xs font-mono text-slate-500 mt-1">
                  Clue: {currentWord.word.length} letters ({currentWord.category})
                </span>
              </div>
            )}
          </div>

          {/* Answer Options: Multiple Choice / Etiquette */}
          {quizType !== 'spelling' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt) => {
                const isThisSelected = selectedOption === opt;
                const isThisCorrect = opt.toLowerCase() === currentWord.word.toLowerCase();

                let btnStyle =
                  'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-amber-500/50 hover:bg-slate-950';

                if (isAnswered) {
                  if (isThisCorrect) {
                    btnStyle =
                      'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold shadow-lg';
                  } else if (isThisSelected) {
                    btnStyle =
                      'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                  } else {
                    btnStyle = 'opacity-40 border-slate-800 bg-slate-950';
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAnswered}
                    className={`p-4 rounded-xl border text-sm font-semibold capitalize text-left flex items-center justify-between transition ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isThisCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {isAnswered && isThisSelected && !isThisCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Answer Options: Spelling Bee Form */}
          {quizType === 'spelling' && (
            <form onSubmit={handleSpellingSubmit} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type the English word here..."
                  value={spellingInput}
                  onChange={(e) => setSpellingInput(e.target.value)}
                  disabled={isAnswered}
                  autoFocus
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-base focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  type="submit"
                  disabled={isAnswered || !spellingInput.trim()}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition"
                >
                  Submit
                </button>
              </div>

              {isAnswered && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>
                    Correct Answer: <strong>{currentWord.word}</strong> ({currentWord.phonetic})
                  </span>
                </div>
              )}
            </form>
          )}

          {/* Next Button after answering */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                <span>{questionIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Finished Results */
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border-2 border-amber-500/50 shadow-xl">
            <Trophy className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Quiz Completed!</h3>
          <p className="text-sm text-slate-300 max-w-sm">
            You scored <strong className="text-amber-400">{score} points</strong> across 10 table setting
            vocabulary words & dining etiquette questions!
          </p>

          <button
            onClick={restartQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-xl transition mt-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Round</span>
          </button>
        </div>
      )}
    </div>
  );
};
