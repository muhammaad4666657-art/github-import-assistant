import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Gem, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { setDistributorSession, setDistributorPassword } from "@/lib/distributor-session";
import { loginLocalDistributor } from "@/lib/affiliate-local";


export const Route = createFileRoute("/distributor/login")({
  head: () => ({ meta: [{ title: "Distributor Sign In — ALM International" }] }),
  component: DistributorLoginPage,
});

function DistributorLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("authenticate_distributor", {
        p_username: username.trim(),
        p_password: password,
      });
      const row: any = Array.isArray(data) ? data[0] : null;
      if (!error && row) {
        setDistributorSession({
          id: row.id,
          username: row.username,
          displayName: row.display_name ?? null,
          avatarUrl: row.avatar_url ?? null,
        });
        setDistributorPassword(password);
        toast.success("Welcome back!");
        navigate({ to: "/distributor/dashboard" });
        return;
      }
      const local = loginLocalDistributor(username, password);
      if (local) {
        setDistributorSession({ id: local.id, username: local.username });
        setDistributorPassword(password);
        toast.success("Welcome back!");
        navigate({ to: "/distributor/dashboard" });
        return;
      }
      toast.error("Invalid username or password");
    } catch {
      const local = loginLocalDistributor(username, password);
      if (local) {
        setDistributorSession({ id: local.id, username: local.username });
        setDistributorPassword(password);
        toast.success("Welcome back!");
        navigate({ to: "/distributor/dashboard" });
      } else {
        toast.error("Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-luxe">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-8 pt-10 pb-8 text-center border-b border-border/60">
              <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Gem className="h-5 w-5 text-gold" />
              </div>
              <p className="mt-4 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                ALM International
              </p>
              <h1 className="mt-2 text-3xl font-serif">Distributor Portal</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your affiliate account
              </p>
            </div>

            <form onSubmit={handle} className="px-8 py-8 space-y-5">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Username
                </label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full h-12 px-4 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60 transition"
                  placeholder="your.username"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full h-12 px-4 pr-12 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/60 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 p-1.5 text-muted-foreground hover:text-foreground rounded-md transition"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button

                disabled={loading}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium tracking-wide inline-flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="px-8 pb-8">
              <div className="gold-divider mb-6" />
              <Link
                to="/distributor/signup"
                className="w-full h-11 inline-flex items-center justify-center rounded-lg border border-gold/60 text-foreground hover:bg-gold/10 hover:border-gold transition text-sm tracking-wide"
              >
                Become a Distributor · View Plans
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected affiliate portal — for registered distributors only.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
