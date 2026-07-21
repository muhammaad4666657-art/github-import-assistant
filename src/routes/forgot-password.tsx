import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — ALM International" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("Check your email for the reset link"); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-soft">
          <h1 className="text-3xl font-serif text-center">Forgot password</h1>
          <p className="text-center text-sm text-muted-foreground mt-2">We'll email you a link to reset it.</p>
          {sent ? (
            <div className="mt-8 text-center text-sm">
              <p className="text-foreground">A reset link has been sent to <span className="font-medium">{email}</span>.</p>
              <Link to="/login" className="inline-block mt-6 text-accent hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
              </div>
              <button disabled={loading} className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
