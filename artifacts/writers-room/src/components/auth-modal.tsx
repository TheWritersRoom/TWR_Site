import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function AuthModal() {
  const { user, login, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSubmitting(true);
    try {
      await login(name, email);
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
              <Button 
                type="submit" 
                className="w-full mt-4 text-lg h-14" 
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
