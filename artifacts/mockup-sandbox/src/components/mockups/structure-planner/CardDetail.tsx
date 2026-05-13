import './_group.css';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, Clock, Save,
  Tag, Users, FileText, Lightbulb, StickyNote, BarChart2, Pencil
} from 'lucide-react';

const EPISODE = {
  n: 'E02',
  title: 'The First Lie',
  status: 'writing',
  logline: 'Sarah discovers that the original investigation was deliberately suppressed. A witness recants. The town has something to hide.',
  synopsis: `Sarah pulls the original case files from the county archive and finds critical evidence missing. When she tracks down the sole surviving witness — a retired fisherman called Brennan — he refuses to meet her at first, then agrees under condition of anonymity.\n\nBrennan reveals that on the night of the original murder, he saw Mayor Holt's car near the lake — but was warned off by a senior officer and told to keep quiet. He signed a statement but that statement no longer exists in the file.\n\nMeanwhile, DS Patel runs background checks and uncovers a property sale from 1998 that links the Mayor's family to the land where the body was found. Sarah begins to see the shape of the cover-up.\n\nEpisode closes on Sarah returning to her hotel to find it has been searched.`,
  theme: 'Conspiracy / Trust',
  arc: 'Sarah learns she cannot trust the institutions she relies on — the investigation itself was corrupted from day one.',
  characters: [
    { name: 'DI Sarah Cole', note: 'Protagonist. Pushing past official resistance.' },
    { name: 'Tom Reyes', note: 'County archivist. Nervous but helpful.' },
    { name: 'Mayor Holt', note: 'Antagonist (off-screen this episode — referenced only).' },
    { name: 'DS Patel', note: "Sarah's reluctant but loyal partner." },
    { name: 'Brennan', note: 'New character. Key witness. Frightened.' },
  ],
  tags: ['Rising tension', 'New character', 'B-story setup'],
  notes: 'The hotel search scene needs to feel genuinely threatening without being melodramatic. Consider ending on an empty room rather than someone leaving — implication over action.',
  words: 2100,
  target: 4500,
  assignee: 'J.M.',
  due: '14 Jun 2026',
};

const progress = Math.round((EPISODE.words / EPISODE.target) * 100);

const STATUS_OPTS = [
  { k: 'draft',    label: 'Draft',     color: 'bg-[#7A6B5E]/12 text-[#7A6B5E]' },
  { k: 'outline',  label: 'Outlined',  color: 'bg-blue-50 text-blue-700' },
  { k: 'writing',  label: 'Writing',   color: 'bg-amber-50 text-amber-700' },
  { k: 'complete', label: 'Complete',  color: 'bg-green-50 text-green-700' },
];

const Section = ({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3.5 h-3.5 text-[#7A6B5E]" />
      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#7A6B5E]">{label}</p>
    </div>
    {children}
  </div>
);

export function CardDetail() {
  return (
    <div className="min-h-screen bg-[#F9F6EE] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b-2 border-[#1A1614] px-6 py-3 flex items-center justify-between bg-[#F9F6EE]">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-full hover:bg-[#1A1614]/8 text-[#7A6B5E]">
            <X className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#1A1614]/15" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#7A6B5E]">Dark Waters S1</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#7A6B5E]">{EPISODE.n}</span>
              <h1 className="font-serif font-bold text-lg text-[#1A1614] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                {EPISODE.title}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-[#7A6B5E] hover:text-[#1A1614]"><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1.5 text-[#7A6B5E] hover:text-[#1A1614]"><ChevronRight className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-[#1A1614]/15 mx-1" />
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-[#1A1614] text-[#F9F6EE] hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 grid grid-cols-[1fr_280px] overflow-hidden">

        {/* Left — main content */}
        <div className="overflow-y-auto border-r border-[#1A1614]/10 px-8 py-6 flex flex-col gap-6">

          {/* Status + word count */}
          <div className="flex items-center gap-3 flex-wrap">
            {STATUS_OPTS.map(s => (
              <button key={s.k} className={`px-3 py-1 rounded-full text-[10px] font-bold border-2 transition-colors ${s.k === EPISODE.status ? `${s.color} border-current` : 'border-transparent text-[#7A6B5E]/50 hover:border-[#1A1614]/15'}`}>
                {s.label}
              </button>
            ))}
            <div className="ml-auto text-right">
              <p className="text-[10px] text-[#7A6B5E]"><strong className="text-[#1A1614] text-sm">{EPISODE.words.toLocaleString()}</strong> / {EPISODE.target.toLocaleString()} words</p>
              <div className="h-1 bg-[#1A1614]/10 rounded-full overflow-hidden mt-1 w-32">
                <div className="h-full bg-[#E8B84B] rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="border-t-2 border-[#1A1614]" />

          {/* Logline */}
          <Section icon={FileText} label="Logline">
            <div className="relative group">
              <p className="font-serif italic text-base text-[#1A1614] leading-relaxed bg-white border border-[#1A1614]/10 px-4 py-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                {EPISODE.logline}
              </p>
              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </Section>

          {/* Synopsis */}
          <Section icon={FileText} label="Synopsis">
            <div className="relative group">
              <div className="bg-white border border-[#1A1614]/10 px-4 py-3 text-sm text-[#1A1614] leading-relaxed whitespace-pre-line">
                {EPISODE.synopsis}
              </div>
              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </Section>

          {/* Thematic arc */}
          <Section icon={Lightbulb} label="Thematic arc">
            <div className="relative group bg-[#E8B84B]/10 border-l-2 border-[#E8B84B] px-4 py-3 text-sm text-[#1A1614] leading-relaxed">
              {EPISODE.arc}
              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </Section>

          {/* Writer's notes */}
          <Section icon={StickyNote} label="Writer's notes">
            <div className="relative group bg-amber-50/60 border border-amber-200 px-4 py-3 text-sm text-[#1A1614] leading-relaxed">
              {EPISODE.notes}
              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1A1614]/8 rounded text-[#7A6B5E]">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="overflow-y-auto px-5 py-6 flex flex-col gap-5 bg-[#F9F6EE]">

          {/* Theme */}
          <Section icon={BarChart2} label="Theme">
            <p className="text-sm font-semibold text-[#1A1614]">{EPISODE.theme}</p>
          </Section>

          <div className="border-t border-[#1A1614]/10" />

          {/* Characters */}
          <Section icon={Users} label="Characters">
            <div className="flex flex-col gap-2">
              {EPISODE.characters.map(c => (
                <div key={c.name} className="bg-white border border-[#1A1614]/10 px-3 py-2">
                  <p className="text-[11px] font-bold text-[#1A1614]">{c.name}</p>
                  <p className="text-[10px] text-[#7A6B5E] leading-snug mt-0.5">{c.note}</p>
                </div>
              ))}
              <button className="text-[10px] font-semibold text-[#7A6B5E] hover:text-[#1A1614] text-left mt-1">+ Add character</button>
            </div>
          </Section>

          <div className="border-t border-[#1A1614]/10" />

          {/* Tags */}
          <Section icon={Tag} label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {EPISODE.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-[#1A1614]/8 text-[10px] font-medium text-[#7A6B5E] rounded">
                  {t}
                </span>
              ))}
              <button className="px-2 py-0.5 border border-dashed border-[#1A1614]/20 text-[10px] text-[#7A6B5E] rounded hover:border-[#E8B84B]">+ Add</button>
            </div>
          </Section>

          <div className="border-t border-[#1A1614]/10" />

          {/* Meta */}
          <Section icon={Clock} label="Details">
            <div className="flex flex-col gap-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#7A6B5E]">Assigned to</span>
                <span className="font-semibold text-[#1A1614]">{EPISODE.assignee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6B5E]">Due</span>
                <span className="font-semibold text-[#1A1614]">{EPISODE.due}</span>
              </div>
            </div>
          </Section>

          <div className="border-t border-[#1A1614]/10" />

          {/* Begin writing CTA */}
          <button className="w-full py-2.5 border-2 border-[#1A1614] text-[11px] uppercase tracking-[0.14em] font-bold text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Open in editor
          </button>
        </div>
      </div>
    </div>
  );
}
