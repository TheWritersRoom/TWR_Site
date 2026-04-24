import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Search, Users, BookText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Project = {
  id: number;
  title: string;
  type: string;
  ownerName: string | null;
  isPublished: boolean;
  avgRating: number | null;
  ratingCount: number;
  createdAt: string;
};

const ROLE_BADGE: Record<string, string> = {
  author: "bg-[#E8B84B]/20 text-[#7A5A00] border-[#E8B84B]/40",
  contributor: "bg-[#F7C5D5]/30 text-[#8B2A50] border-[#F7C5D5]/60",
  both: "bg-[#D4E8B0]/30 text-[#3A6020] border-[#D4E8B0]/60",
};

function UsersTab() {
  const [query, setQuery] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) throw new Error(`Failed to load users (${r.status})`);
      return r.json();
    },
  });

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
        <Input
          placeholder="Search by name, email, or role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 border-2 border-[#1A1614]/20 focus-visible:border-[#1A1614] focus-visible:ring-0 rounded-none h-10 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border-2 border-[#1A1614]/15 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#1A1614]/15 hover:bg-transparent">
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Name
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Email
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Role
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Joined
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-[#7A6B5E] text-sm">
                    {query ? "No users match your search." : "No users yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id} className="border-b border-[#1A1614]/8 hover:bg-[#F9F6EE]">
                    <TableCell className="py-3 px-4 font-semibold text-[#1A1614] text-sm">
                      {u.name}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#7A6B5E] text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] font-bold border rounded-none ${
                          ROLE_BADGE[u.role] ?? "bg-[#1A1614]/5 text-[#7A6B5E] border-[#1A1614]/15"
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#7A6B5E] text-sm tabular-nums">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-[10px] text-[#7A6B5E] tracking-[0.1em]">
        {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function ProjectsTab() {
  const [query, setQuery] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/search/admin"],
    queryFn: () => fetch("/api/projects/search").then((r) => r.json()),
  });

  const filtered = projects.filter((p) => {
    const q = query.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.ownerName ?? "").toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6B5E]" />
        <Input
          placeholder="Search by title, owner, or type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 border-2 border-[#1A1614]/20 focus-visible:border-[#1A1614] focus-visible:ring-0 rounded-none h-10 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#1A1614] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="border-2 border-[#1A1614]/15 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#1A1614]/15 hover:bg-transparent">
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Title
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Type
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Owner
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Published
                </TableHead>
                <TableHead className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7A6B5E] py-3 px-4">
                  Rating
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[#7A6B5E] text-sm">
                    {query ? "No projects match your search." : "No projects yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="border-b border-[#1A1614]/8 hover:bg-[#F9F6EE]">
                    <TableCell className="py-3 px-4 font-semibold text-[#1A1614] text-sm max-w-[220px] truncate">
                      {p.title}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-bold text-[#7A6B5E]">
                        <BookText className="w-3 h-3" />
                        {p.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#7A6B5E] text-sm">
                      {p.ownerName ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] font-bold border rounded-none ${
                          p.isPublished
                            ? "bg-[#D4E8B0]/40 text-[#3A6020] border-[#D4E8B0]"
                            : "bg-[#1A1614]/5 text-[#7A6B5E] border-[#1A1614]/15"
                        }`}
                      >
                        {p.isPublished ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-[#7A6B5E] text-sm tabular-nums">
                      {p.avgRating != null
                        ? `${Number(p.avgRating).toFixed(1)} (${p.ratingCount})`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-[10px] text-[#7A6B5E] tracking-[0.1em]">
        {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="border-2 border-[#1A1614]/15 px-6 py-4 flex flex-col gap-1 min-w-[140px]">
      <span className="text-[9px] uppercase tracking-[0.22em] font-bold text-[#7A6B5E]">
        {label}
      </span>
      {value === null ? (
        <div className="w-10 h-6 bg-[#1A1614]/8 animate-pulse rounded-none" />
      ) : (
        <span className="text-3xl font-serif font-bold text-[#1A1614] tabular-nums leading-tight">
          {value.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: users } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) throw new Error(`Failed to load users (${r.status})`);
      return r.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects/search/admin"],
    queryFn: () => fetch("/api/projects/search").then((r) => r.json()),
    enabled: !!user?.isAdmin,
  });

  const totalUsers = users ? users.length : null;
  const totalProjects = projects ? projects.length : null;
  const publishedProjects = projects ? projects.filter((p) => p.isPublished).length : null;

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user?.isAdmin) return null;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#7A6B5E] mb-2">
          System Overview
        </p>
        <div className="border-t-2 border-[#1A1614] mb-3" />
        <h1 className="text-4xl font-serif font-bold text-[#1A1614]">Admin Dashboard</h1>
        <p className="text-[#7A6B5E] mt-1 text-base">
          All registered users and projects on the platform.
        </p>
        <div className="flex flex-wrap gap-4 mt-6">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Total Projects" value={totalProjects} />
          <StatCard label="Published Projects" value={publishedProjects} />
        </div>
        <div className="border-t border-[#1A1614]/15 mt-6" />
      </header>

      <Tabs defaultValue="users">
        <TabsList className="bg-transparent border-b-2 border-[#1A1614]/15 w-full justify-start rounded-none h-auto p-0 mb-8 gap-0">
          <TabsTrigger
            value="users"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8B84B] data-[state=active]:bg-transparent data-[state=active]:text-[#1A1614] data-[state=active]:shadow-none text-[#7A6B5E] px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] font-bold -mb-[2px] flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8B84B] data-[state=active]:bg-transparent data-[state=active]:text-[#1A1614] data-[state=active]:shadow-none text-[#7A6B5E] px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] font-bold -mb-[2px] flex items-center gap-2"
          >
            <BookText className="w-3.5 h-3.5" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
