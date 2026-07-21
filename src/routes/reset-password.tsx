import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — ALM International" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // supabase auto-exchanges the recovery token from the URL hash and signs the user in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate({ to: "/account" }); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-soft">
          <h1 className="text-3xl font-serif text-center">Set a new password</h1>
          {!ready ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">Validating reset link...</p>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm">New password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
              </div>
              <div>
                <label className="text-sm">Confirm password</label>
                <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
              </div>
              <button disabled={loading} className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
