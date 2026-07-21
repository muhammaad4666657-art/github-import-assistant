import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — ALM International" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  component: SignupPage,
});

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: search.redirect }); }, [user, navigate, search.redirect]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created! You can now sign in."); navigate({ to: "/login" }); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-soft">
          <h1 className="text-3xl font-serif text-center">Create your account</h1>
          <p className="text-center text-sm text-muted-foreground mt-2">Join ALM International</p>
          <form onSubmit={handle} className="mt-8 space-y-4">
            <div>
              <label className="text-sm">Full name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <input required type="tel" placeholder="+92 300 0000000" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <button disabled={loading} className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" search={{ redirect: search.redirect } as any} className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
