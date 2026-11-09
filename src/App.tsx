import React, { useState } from 'react';
import {
  Film,
  MapPin,
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  Volume2,
  Utensils,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { VideoPlayer } from './components/VideoPlayer';
import { InteractiveExplorer } from './components/InteractiveExplorer';
import { VocabularyList } from './components/VocabularyList';
import { Flashcards } from './components/Flashcards';
import { QuizMode } from './components/QuizMode';
import { WorksheetGenerator } from './components/WorksheetGenerator';
import { DiningEtiquetteTask } from './components/DiningEtiquetteTask';
import {
  FORMAL_VIDEO_SCENES,
  FORMAL_VOCABULARY_LIST,
  STUDENT_DINING_TASKS,
  VocabularyItem,
} from './data/vocabulary';

type TabType = 'tasks' | 'video' | 'explorer' | 'vocabulary' | 'flashcards' | 'quiz' | 'worksheet';

export default function App() {
  // Primary active image provided by user
  const imageSrc = '/assets/aistudio/formal_table_setting_600x600_8065b730.webp';
  const aspectRatio = '600 / 480';

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [videoSeekTime, setVideoSeekTime] = useState<number | null>(null);

  const handleJumpToVideo = (timestamp: number) => {
    setActiveTab('video');
    setVideoSeekTime(timestamp);
  };

  const handleSelectWord = (word: VocabularyItem) => {
    setSelectedWord(word);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Formal Dining & Video Studio
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  New Image Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Formal table setting motion video, etiquette challenges, and English vocabulary
              </p>
            </div>
          </div>

          {/* Right Action: Quick Jump to Worksheet */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('worksheet')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition shadow"
            >
              <FileText className="w-4 h-4" />
              <span>Print Handout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 pt-1 pb-2">
          {[
            { id: 'tasks', label: '🎯 Student Dining Tasks', count: `${STUDENT_DINING_TASKS.length} Missions`, highlight: true },
            { id: 'video', label: '🎬 Motion Video Tour', count: '5 Scenes' },
            { id: 'explorer', label: '📍 Interactive Table Pins', count: `${FORMAL_VOCABULARY_LIST.length} Hotspots` },
            { id: 'vocabulary', label: '📚 Vocabulary Catalog', count: `${FORMAL_VOCABULARY_LIST.length} Words` },
            { id: 'flashcards', label: '📇 Study Flashcards', count: '3D Deck' },
            { id: 'quiz', label: '🏆 Etiquette & Spelling Quiz', count: 'Practice' },
            { id: 'worksheet', label: '📄 Printable Worksheet', count: 'Handout' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-slate-950/20 text-slate-950 font-extrabold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: NEW Student Dining Tasks (Hero Feature) */}
        {activeTab === 'tasks' && (
          <DiningEtiquetteTask imageSrc={imageSrc} />
        )}

        {/* TAB 2: Cinematic Video Tour */}
        {activeTab === 'video' && (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Dynamic Video Animation Engine
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Motion Video from Formal Table Setting
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Watch the camera glide over the formal table setting, detailing the <strong>bread plate & butter knife</strong>,{' '}
                  <strong>salad and dinner forks</strong> on the folded linen napkin, the <strong>dinner knife and soup spoon</strong>,{' '}
                  and the <strong>stemmed water goblet and red wine glass</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow"
                >
                  Start Dining Tasks →
                </button>
              </div>
            </div>

            {/* Video Player */}
            <VideoPlayer
              imageSrc={imageSrc}
              onSelectWord={handleSelectWord}
              externalSeekTime={videoSeekTime}
              scenes={FORMAL_VIDEO_SCENES}
              vocabularyList={FORMAL_VOCABULARY_LIST}
            />

            {/* Quick Scene Jump Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { id: 1, title: '1. Place Setting Overview', time: 0, tag: 'White Linen & Plate' },
                { id: 2, title: '2. Bread Plate & Butter', time: 6, tag: 'Upper Left Service' },
                { id: 3, title: '3. Salad & Dinner Forks', time: 12, tag: 'Outside-In Silverware' },
                { id: 4, title: '4. Knife, Spoon & Stemware', time: 18, tag: 'Water Goblet & Red Wine' },
                { id: 5, title: '5. Restaurant Atmosphere', time: 24, tag: 'Diners & Ambient Lights' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setVideoSeekTime(sc.time)}
                  className="p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">
                    {sc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{sc.tag}</div>
                  <div className="text-[10px] font-mono text-amber-500 mt-1">Jump to {sc.time}s</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Interactive Spatial Explorer */}
        {activeTab === 'explorer' && (
          <InteractiveExplorer
            imageSrc={imageSrc}
            selectedWord={selectedWord}
            onSelectWord={handleSelectWord}
            onJumpToVideo={handleJumpToVideo}
            vocabularyList={FORMAL_VOCABULARY_LIST}
            aspectRatio={aspectRatio}
          />
        )}

        {/* TAB 4: Master Vocabulary Catalog */}
        {activeTab === 'vocabulary' && (
          <VocabularyList
            onSelectWord={handleSelectWord}
            onJumpToVideo={handleJumpToVideo}
            vocabularyList={FORMAL_VOCABULARY_LIST}
          />
        )}

        {/* TAB 5: Study Flashcards */}
        {activeTab === 'flashcards' && (
          <Flashcards
            onJumpToVideo={handleJumpToVideo}
            vocabularyList={FORMAL_VOCABULARY_LIST}
          />
        )}

        {/* TAB 6: Gamified Practice Quizzes */}
        {activeTab === 'quiz' && (
          <QuizMode vocabularyList={FORMAL_VOCABULARY_LIST} />
        )}

        {/* TAB 7: Printable Student Worksheet */}
        {activeTab === 'worksheet' && (
          <WorksheetGenerator imageSrc={imageSrc} />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400 font-medium">
        Formal Table Setting & Dining - Nannestad High School- Barbara Anna Zielonka
      </footer>
    </div>
  );
}
