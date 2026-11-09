import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Utensils,
  BookOpen,
  Volume2,
  Lightbulb,
} from 'lucide-react';
import { STUDENT_DINING_TASKS, FORMAL_VOCABULARY_LIST, DiningTask } from '../data/vocabulary';
import { speechService } from '../utils/speech';

interface DiningEtiquetteTaskProps {
  imageSrc: string;
}

export const DiningEtiquetteTask: React.FC<DiningEtiquetteTaskProps> = ({ imageSrc }) => {
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const currentTask: DiningTask = STUDENT_DINING_TASKS[selectedTaskIndex] || STUDENT_DINING_TASKS[0];
  const currentStep = currentTask.steps[currentStepIndex] || currentTask.steps[0];
  const targetWord = FORMAL_VOCABULARY_LIST.find((w) => w.id === currentStep.targetWordId);

  const handleSelectItem = (wordId: string) => {
    if (answeredState === 'correct') return;

    const clickedWord = FORMAL_VOCABULARY_LIST.find((w) => w.id === wordId);
    setSelectedItemName(clickedWord?.word || wordId);

    if (wordId === currentStep.targetWordId) {
      setAnsweredState('correct');
      setScore((s) => s + 20);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      speechService.speak('Correct! ' + (clickedWord?.word || '') + '. ' + currentStep.explanation);
    } else {
      setAnsweredState('wrong');
      speechService.speak('Not quite. Try again or check the etiquette hint.');
    }
  };

  const handleNextStep = () => {
    setShowHint(false);
    setAnsweredState('idle');
    setSelectedItemName('');

    if (currentStepIndex + 1 < currentTask.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed current task
      setCompletedTasks((prev) => new Set(prev).add(currentTask.id));
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleSelectTask = (index: number) => {
    setSelectedTaskIndex(index);
    setCurrentStepIndex(0);
    setShowHint(false);
    setAnsweredState('idle');
    setSelectedItemName('');
  };

  const isCurrentTaskFinished =
    answeredState === 'correct' && currentStepIndex + 1 >= currentTask.steps.length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
      {/* Top Header & Task Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Utensils className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Student Dining Tasks & Etiquette Challenges
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              Interactive Practice
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Learn formal dining rules, utensil sequences, and restaurant English by solving realistic dinner scenarios.
          </p>
        </div>

        {/* Total Score */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">
            Total Points: <strong className="text-amber-400">{score} pts</strong>
          </span>
          <span className="text-xs font-medium text-emerald-400">
            ({completedTasks.size} / {STUDENT_DINING_TASKS.length} Mastered)
          </span>
        </div>
      </div>

      {/* Task Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {STUDENT_DINING_TASKS.map((task, idx) => {
          const isDone = completedTasks.has(task.id);
          const isCurrent = idx === selectedTaskIndex;

          return (
            <button
              key={task.id}
              onClick={() => handleSelectTask(idx)}
              className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-amber-400">{task.level}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {task.title}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {task.steps.length} interactive steps
              </span>
            </button>
          );
        })}
      </div>

      {/* Task Body: Split Layout (Interactive Image vs Mission Card) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Interactive Table Setting with Hotspot Click Targets */}
        <div className="lg:w-7/12 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Click the correct item on the table setting:
            </span>
            <span className="text-amber-400 text-[11px]">Tap on any utensil, plate, or glass</span>
          </div>

          <div
            className="relative w-full rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 select-none shadow-2xl"
            style={{ aspectRatio: '600 / 480' }}
          >
            <img
              src={imageSrc}
              alt="Formal Table Setting"
              className="w-full h-full object-fill block"
            />

            {/* Clickable Hotspots for Key Items */}
            {FORMAL_VOCABULARY_LIST.filter((w) =>
              ['salad_fork', 'dinner_fork', 'dinner_plate', 'bread_plate', 'butter_knife', 'dinner_knife', 'soup_spoon', 'water_glass', 'wine_glass', 'cloth_napkin', 'stem'].includes(w.id)
            ).map((item) => {
              const isTarget = item.id === currentStep.targetWordId;
              const isCorrectAnswer = answeredState === 'correct' && isTarget;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  style={{
                    left: `${item.xPercent}%`,
                    top: `${item.yPercent}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer p-1.5 focus:outline-none"
                  title={`Click: ${item.word}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition transform group-hover:scale-125 ${
                      isCorrectAnswer
                        ? 'bg-emerald-400 border-white shadow-[0_0_20px_rgba(52,211,153,1)] scale-125 animate-bounce'
                        : 'bg-slate-950/80 border-amber-400/80 hover:bg-amber-400 hover:border-white shadow-md'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCorrectAnswer ? 'bg-slate-950' : 'bg-amber-400 group-hover:bg-slate-950'
                      }`}
                    />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2 py-0.5 rounded bg-slate-950 text-white text-[10px] font-bold whitespace-nowrap border border-amber-400 pointer-events-none z-30 shadow-lg">
                    {item.word}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Mission Instruction Card */}
        <div className="lg:w-5/12 w-full flex flex-col gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-inner">
          {/* Progress within current task */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              Step {currentStepIndex + 1} of {currentTask.steps.length}
            </span>
            <span className="text-xs text-slate-400">
              Mission: {currentTask.title.split(':')[0]}
            </span>
          </div>

          {/* Current Question / Scenario Prompt */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {currentStep.prompt}
              </p>
            </div>
          </div>

          {/* Answer Feedback Alert */}
          {answeredState === 'correct' && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex flex-col gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Splendid! You picked the {targetWord?.word}!</span>
              </div>
              <p className="leading-relaxed text-emerald-100">{currentStep.explanation}</p>
              {targetWord?.etiquetteRule && (
                <div className="p-2 rounded bg-emerald-900/40 border border-emerald-700/50 text-[11px] font-medium text-emerald-300 flex items-start gap-1.5 mt-1">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Rule:</strong> {targetWord.etiquetteRule}
                  </span>
                </div>
              )}
            </div>
          )}

          {answeredState === 'wrong' && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  You clicked <strong>{selectedItemName}</strong>. That is not the correct item for this course. Try again!
                </span>
              </div>
            </div>
          )}

          {/* Hint Accordion */}
          {answeredState !== 'correct' && (
            <div className="flex flex-col gap-1.5 pt-1">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Need an etiquette hint?</span>
                </button>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Hint:</strong> {currentStep.ruleHint}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Next / Completion Button */}
          {answeredState === 'correct' && (
            <div className="pt-2">
              <button
                onClick={handleNextStep}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
              >
                <span>
                  {currentStepIndex + 1 < currentTask.steps.length
                    ? 'Next Etiquette Step →'
                    : 'Complete Task & Celebrate 🎉'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
