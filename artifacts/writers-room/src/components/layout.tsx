import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, LogOut, PenTool, LayoutDashboard, UserCircle, PenLine, Users, Layers } from "lucide-react";
import { Button } from "./ui/button";

const ROLE_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  author:      { label: "Author",               className: "bg-blue-100 text-blue-700",    icon: <PenLine className="w-3 h-3" /> },
  contributor: { label: "Contributor",           className: "bg-amber-100 text-amber-700",  icon: <Users className="w-3 h-3" /> },
  both:        { label: "Author & Contributor",  className: "bg-emerald-100 text-emerald-700", icon: <Layers className="w-3 h-3" /> },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <>{children}</>;

  const roleBadge = ROLE_BADGE[user.role ?? "both"] ?? ROLE_BADGE.both;

  const navLinks = [
    { href: "/",        label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/profile", label: "My Profile", icon: <UserCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card/50 backdrop-blur-sm fixed h-full z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 text-primary transition-opacity hover:opacity-80">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif font-bold text-xl text-foreground tracking-tight">Writers Room</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>
          {navLinks.map((link) => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <Link href="/profile" className="flex items-center gap-3 mb-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border border-border group-hover:border-primary/40 transition-colors">
              <span className="font-bold text-sm text-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{user.name}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
                {roleBadge.icon}
                {roleBadge.label}
              </span>
            </div>
          </Link>
          <Button variant="outline" className="w-full text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 w-full z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <PenTool className="w-5 h-5 text-primary" />
          <span className="font-serif font-bold text-lg text-foreground">Writers Room</span>
        </Link>
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border hover:border-primary/40 transition-colors">
            <span className="font-bold text-xs text-foreground">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </Link>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-30 bg-card/90 backdrop-blur-md border-t border-border flex">
        {navLinks.map((link) => {
          const active = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 mt-14 md:mt-0 mb-16 md:mb-0 relative">
        {children}
      </main>
    </div>
  );
}
