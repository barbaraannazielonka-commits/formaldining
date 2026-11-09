import React, { useRef } from 'react';
import { Printer, FileText } from 'lucide-react';
import { FORMAL_VOCABULARY_LIST } from '../data/vocabulary';

interface WorksheetGeneratorProps {
  imageSrc: string;
}

export const WorksheetGenerator: React.FC<WorksheetGeneratorProps> = ({ imageSrc }) => {
  const printableRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg no-print">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Printable Formal Dining & Table Setting Worksheet
          </h3>
          <p className="text-xs text-slate-400">
            Export or print student handouts covering table setting terminology, utensil rules, and restaurant etiquette.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Sheet Body */}
      <div
        ref={printableRef}
        className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 print:p-0 print:border-none print:shadow-none"
      >
        {/* Worksheet Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-0.5">
              English Language Learning Handout • Formal Dining & Etiquette Unit
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              Formal Table Setting & Dining Etiquette Study Sheet
            </h1>
          </div>

          <div className="text-xs font-medium text-slate-700 flex flex-col gap-1 sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-slate-300">
            <div>
              <strong>Student Name:</strong> ______________________
            </div>
            <div>
              <strong>Date:</strong> ___________________ <strong>Score:</strong> _____/20
            </div>
          </div>
        </div>

        {/* Part 1: Visual Labeled Place Setting */}
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Part 1: The Formal Place Setting (Identify the Objects)
          </h2>
          <p className="text-xs text-slate-600 mb-3">
            Refer to the table setting photo below. Match each numbered pointer to the correct English
            word from the word bank.
          </p>

          <div
            className="relative rounded-xl overflow-hidden border border-slate-300 mx-auto bg-slate-100 mb-4 max-w-[520px]"
            style={{ aspectRatio: '600 / 480' }}
          >
            <img
              src={imageSrc}
              alt="Formal Table Setting"
              className="w-full h-full object-fill block"
            />
            {/* Labeled numbers matching exact calibrated coordinates with zero overlapping */}
            {[
              { num: 1, x: 52.0, y: 70.0, label: 'Dinner plate' },
              { num: 2, x: 21.0, y: 55.0, label: 'Bread plate' }, // Left center of bread plate
              { num: 3, x: 34.0, y: 50.0, label: 'Butter knife / bread knife' }, // Right handle of knife
              { num: 4, x: 15.0, y: 81.0, label: 'Cloth napkin' }, // Lower hem of folded cloth napkin - clearly visible!
              { num: 5, x: 18.5, y: 67.0, label: 'Salad fork' },
              { num: 6, x: 25.0, y: 67.0, label: 'Dinner fork' },
              { num: 7, x: 75.0, y: 69.0, label: 'Dinner knife' },
              { num: 8, x: 82.0, y: 72.0, label: 'Soup spoon' },
              { num: 9, x: 73.0, y: 46.0, label: 'Water goblet' },
              { num: 10, x: 86.5, y: 46.0, label: 'Red wine glass' },
            ].map((pin) => (
              <div
                key={pin.num}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-20"
                title={`${pin.num}. ${pin.label}`}
              >
                {pin.num}
              </div>
            ))}
          </div>

          {/* Word Bank Box */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs flex flex-wrap gap-3 font-semibold justify-center">
            <span>[A] dinner plate</span>
            <span>[B] bread plate</span>
            <span>[C] butter knife / bread knife</span>
            <span>[D] salad fork</span>
            <span>[E] dinner fork</span>
            <span>[F] dinner knife</span>
            <span>[G] soup spoon</span>
            <span>[H] water goblet</span>
            <span>[I] wine glass</span>
            <span>[J] cloth napkin</span>
          </div>
        </div>

        {/* Part 2: Dining Etiquette Rules */}
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Part 2: Essential Dining Etiquette Rules (Fill in the Blanks)
          </h2>
          <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-800">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <strong>1. The "Outside-In" Rule:</strong> When multiple forks and spoons are set, you always start with the utensils on the _________________ (outside / inside) for the first course.
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <strong>2. The "b and d" Rule:</strong> Form circles with your left and right thumbs and index fingers. Your left hand makes a "b" for _________________ (bread / butter), and your right hand makes a "d" for _________________ (dinner / drinks).
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <strong>3. Knife Blade Orientation:</strong> The cutting blade of your dinner knife must always face _________________ (inward toward the plate / outward toward the room).
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <strong>4. Holding Stemware:</strong> To prevent warming the chilled wine or leaving smudges, always hold a wine glass by its slender _________________ (bowl / stem).
            </div>
          </div>
        </div>

        {/* Part 3: Dialogue Practice */}
        <div className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">
            Part 3: Complete the Restaurant Conversation
          </h2>
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-xs flex flex-col gap-2 leading-relaxed">
            <p>
              <strong>Waiter:</strong> "Good evening! Welcome to Le Bistro. May I pour you some still or sparkling mineral water in your{' '}
              <strong>(1)</strong> ____________________?"
            </p>
            <p>
              <strong>Guest:</strong> "Still water, please. And could you bring warm dinner rolls for the{' '}
              <strong>(2)</strong> ____________________?"
            </p>
            <p>
              <strong>Waiter:</strong> "Certainly. And to accompany your steak, would you like a glass of Bordeaux{' '}
              <strong>(3)</strong> ____________________?"
            </p>
            <p>
              <strong>Guest:</strong> "That sounds delightful. I will begin with the garden salad using the outer{' '}
              <strong>(4)</strong> ____________________."
            </p>
          </div>
        </div>

        {/* Teacher Key Footer */}
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between gap-1">
          <span className="font-semibold text-slate-700">
            Formal Table Setting & Dining - Nannestad High School- Barbara Anna Zielonka
          </span>
          <span>
            Answer Key: Part 1 (1-A, 2-B, 3-C, 4-J, 5-D, 6-E, 7-F, 8-G, 9-H, 10-I) | Part 2 (1: outside, 2: bread, drinks, 3: inward, 4: stem)
          </span>
        </div>
      </div>
    </div>
  );
};
