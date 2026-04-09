"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Briefcase,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Target,
  FileText,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      setMessage("Check your email for a confirmation link.");
      setLoading(false);
    }
  }

  const features = [
    { icon: Target, label: "AI Job Evaluation", desc: "Score any role against your profile" },
    { icon: FileText, label: "Tailored Resumes", desc: "Generate targeted resumes in seconds" },
    { icon: MessageSquare, label: "Interview Prep", desc: "STAR stories & round-by-round coaching" },
    { icon: TrendingUp, label: "Pipeline Tracker", desc: "Track every application end to end" },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Branding & Features */}
        <div className="hidden lg:flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Career Ops</h1>
              <p className="text-muted-foreground">AI Job Search Command Center</p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Evaluate opportunities, generate tailored resumes, prep for interviews, and track
            your pipeline — all powered by AI.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{f.label}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Auth Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Career Ops</h1>
              <p className="text-sm text-muted-foreground">AI Job Search Command Center</p>
            </div>
          </div>

          <Card className="shadow-xl shadow-black/5 border-border/50">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-center mb-6">
                {mode === "login" ? "Welcome back" : "Get started"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={mode === "signup" ? "Min 6 characters" : ""}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3">
                    {message}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 gap-2 text-sm font-medium" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">
                    {mode === "login" ? "New here?" : "Already registered?"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                  setMessage(null);
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in instead"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
