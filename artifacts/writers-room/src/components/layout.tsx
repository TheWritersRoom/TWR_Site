import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/avatar";

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  author:      { label: "Author",              color: "text-[#E8B84B]" },
  contributor: { label: "Contributor",          color: "text-[#F7C5D5]" },
  both:        { label: "Author & Contributor", color: "text-[#F7C5D5]" },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <>{children}</>;

  const roleConf = ROLE_LABEL[user.role ?? "both"] ?? ROLE_LABEL.both;
  const isAuthor = user.role === "author" || user.role === "both";

  const { data: inboxMessages = [] } = useQuery<{ isRead: boolean }[]>({
    queryKey: ["/api/messages/inbox", user.id],
    queryFn: () => fetch(`/api/messages/inbox?userId=${user.id}`, { credentials: "include" }).then(async (r) => {
      if (!r.ok) return [];
      return r.json();
    }),
    refetchInterval: 60_000,
  });
  const unreadCount = inboxMessages.filter((m) => !m.isRead).length;

  const navLinks = [
    { href: "/",             label: "Dashboard"        },
    { href: "/contributors", label: "Find Collaborators", hidden: !isAuthor },
    { href: "/pitches",      label: "Pitches"          },
    { href: "/discover",     label: "Browse & Rate"    },
    { href: "/inbox",        label: "Inbox",            badge: unreadCount > 0 ? unreadCount : undefined },
    { href: "/profile",      label: "My Profile"       },
    { href: "/admin",        label: "Admin",            hidden: !user.isAdmin },
  ].filter((l) => !l.hidden);

  const infoLinks = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing",      label: "Pricing"      },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#F9F6EE]">

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-60 border-r-2 border-[#1A1614] bg-[#F9F6EE] fixed h-full z-20">

        {/* Masthead */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-[9px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-1.5">
            Collaborative Writing
          </p>
          <div className="border-t-2 border-[#1A1614] mb-2" />
          <Link href="/home">
            <span className="font-serif font-bold text-xl text-[#1A1614] leading-tight block hover:text-[#E8B84B] transition-colors">
              The Writers Room
            </span>
          </Link>
          <div className="border-t border-[#1A1614]/20 mt-2" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-px">
          {navLinks.map((link) => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 text-[10px] uppercase tracking-[0.16em] font-bold border-l-2 transition-all ${
                  active
                    ? "border-[#E8B84B] bg-[#E8B84B]/10 text-[#1A1614]"
                    : "border-transparent text-[#7A6B5E] hover:text-[#1A1614] hover:border-[#1A1614]/20 hover:bg-[#1A1614]/3"
                }`}
              >
                {link.label}
                {"badge" in link && link.badge !== undefined && (
                  <span className="ml-1.5 min-w-[16px] h-4 px-1 bg-[#E8B84B] text-[#1A1614] text-[8px] font-bold flex items-center justify-center rounded-sm">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Info links */}
        <div className="px-3 pb-2 border-t border-[#1A1614]/10 pt-2">
          {infoLinks.map((link) => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] font-bold border-l-2 transition-all ${
                  active
                    ? "border-[#E8B84B] text-[#1A1614]"
                    : "border-transparent text-[#7A6B5E]/70 hover:text-[#1A1614] hover:border-[#1A1614]/20"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User footer */}
        <div className="p-4 border-t-2 border-[#1A1614]">
          <Link href="/profile" className="flex items-center gap-3 mb-3 group">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1614] truncate group-hover:text-[#E8B84B] transition-colors">
                {user.name}
              </p>
              <p className={`text-[9px] uppercase tracking-[0.14em] font-bold ${roleConf.color}`}>
                {roleConf.label}
              </p>
            </div>
          </Link>
          <div className="flex gap-2 mb-2">
            <button
              onClick={logout}
              className="flex-1 py-1.5 border border-[#1A1614]/25 text-[#7A6B5E] text-[9px] uppercase tracking-[0.18em] font-bold hover:border-[#1A1614] hover:text-[#1A1614] transition-colors"
            >
              Sign Out
            </button>
          </div>
          <p className="mt-2 text-[8px] text-[#7A6B5E]/60 tracking-[0.1em] text-center">
            © {new Date().getFullYear()} The Writers Room
          </p>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="md:hidden fixed top-0 w-full z-30 bg-[#F9F6EE] border-b-2 border-[#1A1614] px-5 py-3 flex items-center justify-between">
        <Link href="/home">
          <span className="font-serif font-bold text-lg text-[#1A1614]">The Writers Room</span>
        </Link>
        <Link href="/profile">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" className="w-8 h-8" />
        </Link>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 w-full z-30 bg-[#F9F6EE] border-t-2 border-[#1A1614] flex">
        {navLinks.map((link) => {
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex items-center justify-center py-3 text-[8px] uppercase tracking-[0.1em] font-bold transition-colors ${
                active
                  ? "text-[#1A1614] bg-[#E8B84B]/15"
                  : "text-[#7A6B5E] hover:text-[#1A1614]"
              }`}
            >
              {link.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      {/* ── MAIN ── */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0 mb-16 md:mb-0">
        {children}
      </main>
    </div>
  );
}
