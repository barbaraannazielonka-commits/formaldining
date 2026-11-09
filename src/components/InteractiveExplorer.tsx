import React, { useState, useRef } from 'react';
import {
  Search,
  Volume2,
  MapPin,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Crosshair,
  ZoomIn,
  Lightbulb,
} from 'lucide-react';
import { FORMAL_VOCABULARY_LIST, VocabularyItem } from '../data/vocabulary';
import { speechService } from '../utils/speech';

interface InteractiveExplorerProps {
  imageSrc: string;
  selectedWord: VocabularyItem | null;
  onSelectWord: (word: VocabularyItem) => void;
  onJumpToVideo: (timestamp: number) => void;
  vocabularyList?: VocabularyItem[];
  aspectRatio?: string;
}

export const InteractiveExplorer: React.FC<InteractiveExplorerProps> = ({
  imageSrc,
  selectedWord,
  onSelectWord,
  onJumpToVideo,
  vocabularyList = FORMAL_VOCABULARY_LIST,
  aspectRatio = '600 / 480',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredWord, setHoveredWord] = useState<VocabularyItem | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const categories = [
    { id: 'all', label: 'All Items', count: vocabularyList.length },
    { id: 'tableware', label: '🍽️ Plates & China', count: vocabularyList.filter((w) => w.category === 'tableware').length },
    { id: 'silverware', label: '🍴 Silverware / Cutlery', count: vocabularyList.filter((w) => w.category === 'silverware').length },
    { id: 'glassware', label: '🍷 Glassware & Stemware', count: vocabularyList.filter((w) => w.category === 'glassware').length },
    { id: 'linen', label: '🧺 Linens & Tablecloth', count: vocabularyList.filter((w) => w.category === 'linen').length },
    { id: 'background_restaurant', label: '👥 Diners & Atmosphere', count: vocabularyList.filter((w) => w.category === 'background_restaurant').length },
  ];

  const filteredPins = vocabularyList.filter((word) => {
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesSearch =
      word.word.toLowerCase().includes(filterQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeFocus = hoveredWord || selectedWord || vocabularyList[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showCrosshairs || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl">
      {/* Left Column: Image with Calibrated Pins */}
      <div className="lg:w-7/12 flex flex-col gap-3">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-white font-bold text-sm tracking-wide">
              Spatial Object Explorer
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredPins.length} pins active)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Calibration Crosshairs Toggle */}
            <button
              onClick={() => setShowCrosshairs(!showCrosshairs)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border transition ${
                showCrosshairs
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Verify coordinate alignment"
            >
              <Crosshair className="w-3 h-3" />
              <span>{showCrosshairs ? 'Crosshairs ON' : 'Show Coordinates'}</span>
              {cursorPos && showCrosshairs && (
                <span className="ml-1 font-mono text-amber-400">
                  ({cursorPos.x}%, {cursorPos.y}%)
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Image Container with Exact 600/480 Aspect Ratio */}
        <div
          ref={imageContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
          className="relative w-full rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 select-none shadow-2xl group"
          style={{ aspectRatio }}
        >
          {/* Main Photo: 100% natural fill */}
          <img
            src={imageSrc}
            alt="Table Setting"
            className="w-full h-full object-fill block"
            draggable={false}
          />

          {/* Calibrated Pins */}
          {filteredPins.map((word) => {
            const isSelected = selectedWord?.id === word.id;
            const isHovered = hoveredWord?.id === word.id;
            const isActive = isSelected || isHovered;

            return (
              <div
                key={word.id}
                style={{
                  left: `${word.xPercent}%`,
                  top: `${word.yPercent}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  isActive ? 'z-30' : 'z-10'
                }`}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => {
                  onSelectWord(word);
                  speechService.speak(word.word);
                }}
              >
                {/* Active Outer Target Ring */}
                {isActive && (
                  <div className="absolute inset-0 -m-3 rounded-full border-2 border-amber-400 animate-ping opacity-75 pointer-events-none" />
                )}

                {/* Pin Head */}
                <div
                  className={`relative flex items-center justify-center rounded-full transition-all duration-200 transform ${
                    isActive
                      ? 'scale-125 shadow-[0_0_20px_rgba(251,191,36,0.9)]'
                      : 'scale-90 hover:scale-110 opacity-90'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      isActive
                        ? 'bg-amber-400 border-white shadow-lg'
                        : 'bg-slate-950/90 border-amber-400 hover:bg-amber-400/30'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-slate-950' : 'bg-amber-400'
                      }`}
                    />
                  </div>

                  {/* Floating Tag Box on Hover/Select */}
                  {isActive && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950/95 text-white border border-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-2xl flex items-center gap-2 pointer-events-none z-40">
                      <span className="text-amber-300 capitalize">{word.word}</span>
                      <span className="text-[10px] text-slate-300 font-mono bg-slate-900 px-1 py-0.5 rounded">
                        {word.phonetic}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Object Loupe Zoom & Detail Card */}
      <div className="lg:w-5/12 flex flex-col justify-between">
        <div className="flex flex-col gap-3.5 bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-inner">
          {/* Object Close-up Macro Preview */}
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center group shadow-md">
            {/* 4.5x Zoom centered exactly on object coordinates */}
            <div
              className="absolute inset-0 bg-no-repeat transition-all duration-300"
              style={{
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: '450%',
                backgroundPosition: `${activeFocus.xPercent}% ${activeFocus.yPercent}%`,
              }}
            />
            {/* Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Badge in top left of zoom */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              <span>4.5x Macro Zoom: {activeFocus.word}</span>
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/85 text-[10px] font-mono text-slate-300 border border-slate-800">
              Pos: {activeFocus.xPercent}%, {activeFocus.yPercent}%
            </div>
          </div>

          {/* Word Name & Spoken Pronunciation */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-white capitalize">
                  {activeFocus.word}
                </span>
                <button
                  onClick={() => speechService.speak(activeFocus.word)}
                  className="p-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition shadow-sm"
                  title="Listen to native audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  {activeFocus.phonetic}
                </span>
                <span className="text-xs text-slate-400 italic">
                  {activeFocus.partOfSpeech}
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/40">
                  CEFR {activeFocus.cefr}
                </span>
              </div>
            </div>

            {/* Jump to video button */}
            <button
              onClick={() => onJumpToVideo(activeFocus.sceneTimestamp)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow"
            >
              <span>Watch in Video</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Definition */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Meaning in the Table Setting
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              {activeFocus.definition}
            </p>
          </div>

          {/* Etiquette Rule */}
          {activeFocus.etiquetteRule && (
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Dining Etiquette Rule:</strong> {activeFocus.etiquetteRule}
              </span>
            </div>
          )}

          {/* Restaurant Example */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Example Sentence
            </span>
            <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              "{activeFocus.example}"
            </p>
          </div>

          {/* Dialogue */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
              Diner & Waiter Dialogue
            </span>
            <div className="text-xs text-sky-200 font-medium bg-sky-950/30 p-2.5 rounded-lg border border-sky-900/40 flex items-center justify-between">
              <span>{activeFocus.dialogueSnippet}</span>
              <button
                onClick={() => speechService.speak(activeFocus.dialogueSnippet)}
                className="p-1 hover:text-white transition"
                title="Listen to dialogue"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search words (e.g. dinner fork, salad fork, wine glass, bread plate)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>
    </div>
  );
};
