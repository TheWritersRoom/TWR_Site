import './_group.css';
import { useState } from 'react';
import {
  Plus, GripVertical, ChevronDown, LayoutGrid, List, Clock,
  CheckCircle2, Circle, AlertCircle, Film, BookOpen, MoreHorizontal, Search, Filter
} from 'lucide-react';

const STATUS = {
  draft:      { label: 'Draft',       color: 'bg-[#7A6B5E]/12 text-[#7A6B5E]',         icon: Circle },
  outline:    { label: 'Outlined',    color: 'bg-blue-50 text-blue-700',                icon: Clock },
  writing:    { label: 'Writing',     color: 'bg-amber-50 text-amber-700',              icon: AlertCircle },
  complete:   { label: 'Complete',    color: 'bg-green-50 text-green-700',              icon: CheckCircle2 },
};

const CARDS = [
  { id: 1, n: 'E01', title: 'Pilot', logline: 'A disgraced detective returns to the town she fled twenty years ago — only to find the cold case that broke her still very much alive.', status: 'complete', theme: 'Identity / Return', chars: ['DI Sarah Cole', 'Mayor Holt'], tags: ['Opening', 'Setup'], words: 3820, assignee: 'J.M.' },
  { id: 2, n: 'E02', title: 'The First Lie', logline: 'Sarah discovers that the original investigation was deliberately suppressed. A witness recants. The town has something to hide.', status: 'writing', theme: 'Conspiracy / Trust', chars: ['DI Sarah Cole', 'Tom Reyes', 'Mayor Holt'], tags: ['Rising tension'], words: 2100, assignee: 'J.M.' },
  { id: 3, n: 'E03', title: 'Homecoming', logline: "Sarah's estranged sister surfaces — and she knows more than she's letting on. A second body changes everything.", status: 'outline', theme: 'Family / Secrets', chars: ['DI Sarah Cole', 'Lena Cole'], tags: ['Midpoint turn'], words: 0, assignee: '' },
  { id: 4, n: 'E04', title: 'Deep Water', logline: "The investigation takes Sarah below the surface of the lake — and into the financial records of a man who should be untouchable.", status: 'draft', theme: 'Power / Corruption', chars: ['DI Sarah Cole', 'Mayor Holt', 'DS Patel'], tags: ['B-story peak'], words: 0, assignee: '' },
  { id: 5, n: 'E05', title: 'The Reckoning', logline: "With evidence in hand and her own life under threat, Sarah must decide how far she's willing to go — and who she can truly trust.", status: 'draft', theme: 'Justice / Sacrifice', chars: ['DI Sarah Cole', 'Lena Cole', 'Tom Reyes'], tags: ['Climax', 'Resolution'], words: 0, assignee: '' },
  { id: 6, n: 'E06', title: 'Aftermath', logline: "Epilogue. Three months later. The town is changed — but is it healed? Sarah receives a call that suggests the story isn't over.", status: 'draft', theme: 'Aftermath / Hook', chars: ['DI Sarah Cole'], tags: ['Finale', 'Series hook'], words: 0, assignee: '' },
];

const totalWords = CARDS.reduce((s, c) => s + c.words, 0);
const complete = CARDS.filter(c => c.status === 'complete').length;
const progress = Math.round((complete / CARDS.length) * 100);

export function CardGrid() {
  const [search, setSearch] = useState('');
  const filtered = CARDS.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.logline.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F6EE] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b-2 border-[#1A1614] px-8 py-4 flex items-center justify-between bg-[#F9F6EE]">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#7A6B5E]">Structure Planner</p>
            <h1 className="font-serif font-bold text-xl text-[#1A1614] leading-none mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dark Waters — Series 1
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full border border-[#1A1614]/15 text-[10px] font-semibold text-[#7A6B5E]">
            <Film className="w-3 h-3" /> TV Drama
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-[#1A1614]/20 text-[#7A6B5E] hover:bg-[#1A1614]/5">
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-[#1A1614]/15 text-[#7A6B5E]/60 hover:bg-[#1A1614]/5">
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-[#1A1614] text-[#F9F6EE] hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add episode
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="border-b border-[#1A1614]/10 px-8 py-3 flex items-center gap-6 bg-white/50">
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between text-[10px] text-[#7A6B5E] font-medium mb-1">
            <span>{complete} of {CARDS.length} complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-[#1A1614]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#E8B84B] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#7A6B5E]">
          <span><strong className="text-[#1A1614]">{CARDS.length}</strong> episodes</span>
          <span className="opacity-30">·</span>
          <span><strong className="text-[#1A1614]">{totalWords.toLocaleString()}</strong> words written</span>
          {Object.entries(STATUS).map(([k, s]) => (
            <span key={k} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.color}`}>
              {CARDS.filter(c => c.status === k).length} {s.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A6B5E]/50" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search episodes…"
              className="pl-8 pr-3 py-1.5 text-[11px] border border-[#1A1614]/15 rounded-full bg-white focus:outline-none focus:border-[#E8B84B] w-40"
            />
          </div>
          <button className="p-1.5 border border-[#1A1614]/15 rounded-full text-[#7A6B5E] hover:bg-[#1A1614]/5">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Card grid ── */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((card) => {
            const s = STATUS[card.status as keyof typeof STATUS];
            const StatusIcon = s.icon;
            return (
              <div
                key={card.id}
                className="group bg-white border border-[#1A1614]/10 hover:border-[#E8B84B] hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Card top bar */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#1A1614]/8">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#7A6B5E]">{card.n}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${s.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-3.5 h-3.5 text-[#1A1614]/20 group-hover:text-[#1A1614]/40" />
                    <button className="p-0.5 text-[#1A1614]/20 hover:text-[#1A1614]/60">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 flex-1 flex flex-col gap-2">
                  <h3 className="font-serif font-bold text-base text-[#1A1614] leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-[#7A6B5E] leading-relaxed line-clamp-3">
                    {card.logline}
                  </p>

                  {/* Theme */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] uppercase tracking-[0.14em] font-bold text-[#7A6B5E]/50">Theme</span>
                    <span className="text-[10px] font-semibold text-[#1A1614]/70">{card.theme}</span>
                  </div>

                  {/* Characters */}
                  {card.chars.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.chars.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-[#E8B84B]/15 text-[9px] font-semibold text-[#7A5A00] rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#1A1614]/6 text-[9px] font-medium text-[#7A6B5E] rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-4 py-2 border-t border-[#1A1614]/8 flex items-center justify-between">
                  <span className="text-[10px] text-[#7A6B5E]">
                    {card.words > 0 ? <><strong className="text-[#1A1614]">{card.words.toLocaleString()}</strong> words</> : <span className="opacity-40">Not started</span>}
                  </span>
                  {card.assignee && (
                    <span className="w-5 h-5 rounded-full bg-[#1A1614] text-[#F9F6EE] text-[8px] font-bold flex items-center justify-center">
                      {card.assignee}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button className="border-2 border-dashed border-[#1A1614]/15 hover:border-[#E8B84B] hover:bg-[#E8B84B]/5 transition-all flex flex-col items-center justify-center gap-2 py-12 text-[#7A6B5E] hover:text-[#1A1614] min-h-[200px]">
            <Plus className="w-6 h-6" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Add episode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
