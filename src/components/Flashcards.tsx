import React, { useState } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Play,
  Shuffle,
  Lightbulb,
} from 'lucide-react';
import { FORMAL_VOCABULARY_LIST, VocabularyItem } from '../data/vocabulary';
import { speechService } from '../utils/speech';

interface FlashcardsProps {
  onJumpToVideo: (timestamp: number) => void;
  vocabularyList?: VocabularyItem[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  onJumpToVideo,
  vocabularyList = FORMAL_VOCABULARY_LIST,
}) => {
  const [deck, setDeck] = useState<VocabularyItem[]>(vocabularyList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());

  const currentItem = deck[currentIndex] || deck[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
  };

  const markKnown = (known: boolean) => {
    setKnownWords((prev) => {
      const next = new Set(prev);
      if (known) next.add(currentItem.id);
      else next.delete(currentItem.id);
      return next;
    });
    handleNext();
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      {/* Top Deck Info */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Table Setting Flashcards
          </h3>
          <span className="text-xs text-slate-400">
            Card {currentIndex + 1} of {deck.length} • {knownWords.size} Mastered
          </span>
        </div>

        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle Deck</span>
        </button>
      </div>

      {/* Flashcard 3D Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 sm:h-96 relative cursor-pointer select-none perspective-1000"
      >
        <div
          className={`w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d shadow-2xl relative ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                {currentItem.category.replace('_', ' ')}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                CEFR {currentItem.cefr}
              </span>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white capitalize tracking-tight mb-2">
                {currentItem.word}
              </h2>
              <p className="text-base font-mono text-amber-300 mb-4">{currentItem.phonetic}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speechService.speak(currentItem.word);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
              >
                <Volume2 className="w-4 h-4" />
                Listen Pronunciation
              </button>
            </div>

            <div className="flex items-center justify-center text-xs text-slate-500 gap-1.5">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card to reveal definition & etiquette rule</span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-amber-300 capitalize">
                {currentItem.word}{' '}
                <span className="text-xs text-slate-400 font-normal italic">
                  ({currentItem.partOfSpeech})
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJumpToVideo(currentItem.sceneTimestamp);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:underline"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>See in Video ({currentItem.sceneTimestamp}s)</span>
              </button>
            </div>

            <div className="my-auto flex flex-col gap-2.5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  English Definition:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {currentItem.definition}
                </p>
              </div>

              {currentItem.etiquetteRule && (
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dining Rule:</strong> {currentItem.etiquetteRule}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Restaurant Example:
                </span>
                <p className="text-xs text-slate-300 italic mt-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                  "{currentItem.example}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center text-xs text-slate-500 gap-1.5">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click again to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex items-center justify-between mt-6 gap-3">
        <button
          onClick={handlePrev}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition font-medium text-xs flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markKnown(false)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Still Learning</span>
          </button>

          <button
            onClick={() => markKnown(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 rounded-xl text-xs font-bold transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mastered</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition font-medium text-xs flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
