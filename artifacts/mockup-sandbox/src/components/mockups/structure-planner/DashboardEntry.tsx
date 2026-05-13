import './_group.css';
import { Plus, Layout, FileText, ArrowRight, Film, BookOpen, LayoutGrid } from 'lucide-react';

const PROJECTS = [
  {
    id: 1, type: 'tv', title: 'Dark Waters', subtitle: 'Series 1 · 6 Episodes',
    progress: 33, complete: 2, total: 6, status: 'writing',
    color: 'bg-[#1A1614]', textColor: 'text-[#F9F6EE]',
  },
  {
    id: 2, type: 'book', title: 'The Salt Road', subtitle: 'Novel · 24 Chapters',
    progress: 12, complete: 3, total: 24, status: 'outline',
    color: 'bg-[#E8B84B]', textColor: 'text-[#1A1614]',
  },
];

const TEMPLATES = [
  { icon: Film,      label: 'TV Series',        desc: 'Season → Episode structure' },
  { icon: BookOpen,  label: 'Novel / Long-form', desc: 'Part → Chapter structure' },
  { icon: Layout,    label: 'Serial Fiction',    desc: 'Arc → Instalment structure' },
  { icon: LayoutGrid, label: 'Blank planner',    desc: 'Start from scratch' },
];

export function DashboardEntry() {
  return (
    <div className="min-h-screen bg-[#F9F6EE] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Fake nav ── */}
      <div className="border-b border-[#1A1614]/10 px-8 py-3 text-[9px] uppercase tracking-[0.22em] font-semibold text-[#7A6B5E] flex items-center gap-6">
        <span className="font-serif font-bold text-base text-[#1A1614]" style={{ fontFamily: "'Playfair Display', serif" }}>Writers Room</span>
        <span className="opacity-40">|</span>
        <span>Dashboard</span>
        <span className="text-[#E8B84B] border-b border-[#E8B84B]">Structure Planner</span>
        <span>Discover</span>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-10 flex flex-col gap-10">

        {/* ── Active planners ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#7A6B5E] mb-1">Your structure planners</p>
              <div className="border-t-2 border-[#1A1614] w-16" />
            </div>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-[#1A1614] text-[#F9F6EE] hover:bg-[#E8B84B] hover:text-[#1A1614] transition-colors">
              <Plus className="w-3.5 h-3.5" /> New planner
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {PROJECTS.map(p => (
              <div key={p.id} className={`${p.color} ${p.textColor} border-2 border-[#1A1614] flex items-center gap-5 px-6 py-4 hover:opacity-90 cursor-pointer transition-opacity group`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {p.type === 'tv' ? <Film className="w-4 h-4 shrink-0 opacity-60" /> : <BookOpen className="w-4 h-4 shrink-0 opacity-60" />}
                    <h3 className="font-serif font-bold text-lg leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{p.title}</h3>
                    <span className="text-[10px] font-semibold opacity-60">{p.subtitle}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-1 bg-current opacity-20 rounded-full overflow-hidden flex-1 max-w-xs">
                      <div className="h-full bg-current opacity-60 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold opacity-60">{p.complete}/{p.total} complete</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Link to manuscript ── */}
        <section className="border-2 border-[#E8B84B] bg-[#E8B84B]/8 px-6 py-4 flex items-center gap-4">
          <div className="w-9 h-9 bg-[#E8B84B] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#1A1614]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-[#1A1614]">Have a manuscript already?</p>
            <p className="text-[11px] text-[#7A6B5E] mt-0.5">Open any existing project and add a Structure Planner tab — map out its shape before or after writing.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 border-2 border-[#1A1614] text-[11px] font-bold text-[#1A1614] hover:bg-[#1A1614] hover:text-[#F9F6EE] transition-colors shrink-0 whitespace-nowrap">
            Go to projects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* ── Start from template ── */}
        <section>
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-[#7A6B5E] mb-1">Start from a template</p>
            <div className="border-t-2 border-[#1A1614] w-16" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.label} className="border-2 border-[#1A1614]/15 hover:border-[#E8B84B] hover:bg-[#E8B84B]/5 transition-all px-4 py-5 flex flex-col items-start gap-2 text-left group">
                <t.icon className="w-5 h-5 text-[#7A6B5E] group-hover:text-[#1A1614] transition-colors" />
                <p className="font-bold text-sm text-[#1A1614]">{t.label}</p>
                <p className="text-[10px] text-[#7A6B5E]">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
