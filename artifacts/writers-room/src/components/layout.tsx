import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, LogOut, PenTool, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <>{children}</>;

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

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>
          <Link 
            href="/" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
              location === "/" 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center border border-border">
              <span className="font-bold text-sm text-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
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
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border">
          <span className="font-bold text-xs text-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 mt-14 md:mt-0 relative">
        {children}
      </main>
    </div>
  );
}
