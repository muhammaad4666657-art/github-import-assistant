import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  head: () => ({ meta: [{ title: "Sign in — ALM International" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const wantsAdmin = search.redirect === "/admin";
  const needsAdminSwitch = wantsAdmin && !!user && !isAdmin;

  useEffect(() => {
    if (!authLoading && user && !needsAdminSwitch) navigate({ to: search.redirect });
  }, [authLoading, user, needsAdminSwitch, search.redirect, navigate]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-soft">
          <h1 className="text-3xl font-serif text-center">
            {wantsAdmin ? "Admin login" : "Welcome back"}
          </h1>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {wantsAdmin ? "Sign in with the admin account" : "Sign in to your account"}
          </p>
          {needsAdminSwitch && (
            <div className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm">
              <p className="text-muted-foreground">
                You are already signed in with a customer account.
              </p>
              <button
                type="button"
                onClick={signOut}
                className="mt-3 h-10 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign out and login as admin
              </button>
            </div>
          )}
          <form onSubmit={handle} className="mt-8 space-y-4">
            <div>
              <label className="text-sm">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm">Password</label>
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <button
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <Link
            to="/admin"
            className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-border text-sm hover:bg-secondary"
          >
            Open Admin Panel
          </Link>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
