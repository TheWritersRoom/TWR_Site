import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Users, Layers } from "lucide-react";

type RoleOption = {
  value: "author" | "contributor" | "both";
  label: string;
  description: string;
  icon: React.ReactNode;
};

const ROLES: RoleOption[] = [
  {
    value: "author",
    label: "Author",
    description: "Create and own projects, manage suggestions",
    icon: <PenLine className="w-5 h-5" />,
  },
  {
    value: "contributor",
    label: "Contributor",
    description: "Give feedback and suggest edits on others' work",
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: "both",
    label: "Both",
    description: "Write your own projects and collaborate on others'",
    icon: <Layers className="w-5 h-5" />,
  },
];

export function AuthModal() {
  const { user, login, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"author" | "contributor" | "both">("both");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    try {
      await login(name, email, role);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            alt="Background"
            className="w-full h-full object-cover opacity-30 mix-blend-multiply"
          />
        </div>

        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative z-10 w-full max-w-md bg-card/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-semibold text-foreground">Writers Room</h1>
              <p className="text-muted-foreground mt-2 font-sans">Enter your details to start collaborating.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Virginia Woolf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border-2 border-input focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="virginia@bloomsbury.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 ml-1">I want to join as</label>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        role === r.value
                          ? "border-primary bg-primary/8 text-foreground"
                          : "border-input bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        role === r.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{r.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                        role === r.value ? "border-primary bg-primary" : "border-input"
                      }`}>
                        {role === r.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 text-lg h-14"
                disabled={isSubmitting || !name || !email}
              >
                {isSubmitting ? "Entering..." : "Enter the Room"}
              </Button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
