import React, { useState } from 'react';
import {
  Search,
  Volume2,
  Play,
  Filter,
  Check,
  Lightbulb,
} from 'lucide-react';
import { FORMAL_VOCABULARY_LIST, VocabularyItem } from '../data/vocabulary';
import { speechService } from '../utils/speech';

interface VocabularyListProps {
  onSelectWord: (word: VocabularyItem) => void;
  onJumpToVideo: (timestamp: number) => void;
  vocabularyList?: VocabularyItem[];
}

export const VocabularyList: React.FC<VocabularyListProps> = ({
  onSelectWord,
  onJumpToVideo,
  vocabularyList = FORMAL_VOCABULARY_LIST,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredWords = vocabularyList.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase()) ||
      item.example.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCefr = selectedCefr === 'all' || item.cefr === selectedCefr;
    return matchesSearch && matchesCategory && matchesCefr;
  });

  const categoryTitles: Record<string, string> = {
    tableware: '🍽️ Plates & China',
    silverware: '🍴 Silverware / Cutlery',
    glassware: '🍷 Glassware & Stemware',
    linen: '🧺 Linens & Tablecloth',
    dining: '🍽️ Table & Cover',
    background_restaurant: '👥 Diners & Atmosphere',
  };

  return (
    <div className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              Master Table Setting Vocabulary in the Video
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              {vocabularyList.length} Words Named
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every visible object in the formal place setting with audio pronunciations, phonetics, and dining etiquette rules.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Student Progress:</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(masteredIds.size / vocabularyList.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-400">
            {masteredIds.size} / {vocabularyList.length} Learned
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all words, utensils, or definitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">All Categories</option>
            <option value="tableware" className="bg-slate-900 text-white">🍽️ Plates & China</option>
            <option value="silverware" className="bg-slate-900 text-white">🍴 Silverware / Cutlery</option>
            <option value="glassware" className="bg-slate-900 text-white">🍷 Glassware & Stemware</option>
            <option value="linen" className="bg-slate-900 text-white">🧺 Linens & Tablecloth</option>
            <option value="background_restaurant" className="bg-slate-900 text-white">👥 Diners & Atmosphere</option>
          </select>
        </div>

        {/* CEFR Level Filter */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
          {['all', 'A1', 'A2', 'B1', 'B2'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedCefr(lvl)}
              className={`px-2 py-1 text-[11px] rounded-lg font-semibold transition ${
                selectedCefr === lvl
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWords.map((item) => {
          const isMastered = masteredIds.has(item.id);

          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectWord(item);
                speechService.speak(item.word);
              }}
              className={`group flex flex-col justify-between p-4 rounded-xl border transition cursor-pointer ${
                isMastered
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                  : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40 hover:bg-slate-950'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white capitalize group-hover:text-amber-300 transition">
                        {item.word}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speechService.speak(item.word);
                        }}
                        className="p-1 rounded-md text-amber-400 hover:bg-amber-500/20 transition"
                        title="Pronounce word"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-amber-300">
                        {item.phonetic}
                      </span>
                      <span className="text-[11px] text-slate-400 italic">
                        {item.partOfSpeech}
                      </span>
                    </div>
                  </div>

                  {/* Level & Mastered Checkbox */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                      {item.cefr}
                    </span>
                    <button
                      onClick={(e) => toggleMastered(item.id, e)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                        isMastered
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 hover:border-slate-500 text-transparent'
                      }`}
                      title={isMastered ? 'Mark as learning' : 'Mark as learned'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Definition */}
                <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                  {item.definition}
                </p>

                {/* Etiquette Rule if present */}
                {item.etiquetteRule && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-950/25 border border-amber-500/25 flex items-start gap-1.5 text-[11px] text-amber-200">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.etiquetteRule}</span>
                  </div>
                )}

                {/* Example sentence */}
                <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                  <p className="text-[11px] text-slate-300 italic leading-snug">
                    "{item.example}"
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-500">
                  {categoryTitles[item.category]?.split(' ')[0] || '🍽️'} Scene {item.sceneId} ({item.sceneTimestamp}s)
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToVideo(item.sceneTimestamp);
                  }}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Watch in video</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No vocabulary words match your filter. Try clearing the search or category filter.
        </div>
      )}
    </div>
  );
};
