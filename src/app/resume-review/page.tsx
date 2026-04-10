"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSearch,
  Loader2,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RoleAlignment {
  role: string;
  score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

interface SectionCritique {
  section: string;
  rating: "weak" | "adequate" | "strong";
  current_issue: string;
  recommendation: string;
}

interface ReviewResult {
  executive_presence_score: number;
  overall_assessment: string;
  role_alignments: RoleAlignment[];
  section_critiques: SectionCritique[];
  keywords: {
    present: string[];
    missing: string[];
    ats_pass_rate: number;
  };
  red_flags: string[];
  top_3_actions: string[];
  rewritten_resume: string;
  rewrite_changelog: string[];
}

function ScoreRing({ score, label, max = 10 }: { score: number; label: string; max?: number }) {
  const pct = (score / max) * 100;
  const color =
    pct >= 80 ? "text-emerald-600 dark:text-emerald-400" :
    pct >= 60 ? "text-amber-600 dark:text-amber-400" :
    "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
          <circle
            cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={color}
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>
          {score.toFixed(1)}
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

const RATING_CONFIG = {
  weak: { color: "bg-red-500/15 text-red-700 dark:text-red-400", icon: XCircle },
  adequate: { color: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: AlertTriangle },
  strong: { color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
};

export default function ResumeReviewPage() {
  const [resumeText, setResumeText] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  async function handleAnalyze() {
    if (!resumeText.trim() || !goals.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/resume-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, goals }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.rewritten_resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleRole(role: string) {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Review</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered executive resume analysis and rewrite — powered by Claude Sonnet 4.6
        </p>
      </div>

      {/* Input */}
      {!result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary" />
                Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your full resume here..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
              />
              {resumeText.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {resumeText.split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                What do you want to analyze?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={"Example: I want to make sure this resume makes me a strong candidate for CTO, CIO, CAIO, and VP/SVP positions. I'm targeting remote roles at mid-to-large companies in tech or cybersecurity."}
                value={goals}
                onChange={e => setGoals(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !resumeText.trim() || !goals.trim()}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze & Rewrite
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Start Over */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => { setResult(null); setError(""); }}
              className="gap-2"
            >
              <FileSearch className="w-4 h-4" />
              Analyze Another Resume
            </Button>
          </div>

          {/* Score Overview */}
          <Card className="gradient-border">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex gap-6">
                  <ScoreRing score={result.executive_presence_score} label="Executive Presence" />
                  <ScoreRing score={result.keywords.ats_pass_rate} label="ATS Pass Rate" max={100} />
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.overall_assessment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 3 Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Top 3 Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.top_3_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-1">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Alignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Role Alignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.role_alignments.map(role => {
                const expanded = expandedRoles.has(role.role);
                const color =
                  role.score >= 8 ? "text-emerald-600 dark:text-emerald-400" :
                  role.score >= 6 ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400";

                return (
                  <div key={role.role} className="border border-border/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleRole(role.role)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${color}`}>{role.score.toFixed(1)}</span>
                        <span className="font-medium">{role.role}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-3">
                        <div>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Strengths</p>
                          <ul className="space-y-1">
                            {role.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Gaps</p>
                          <ul className="space-y-1">
                            {role.gaps.map((g, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                                {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-primary mb-1.5">Recommendations</p>
                          <ul className="space-y-1">
                            {role.recommendations.map((r, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Section Critiques + Red Flags */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Section Critique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.section_critiques.map((section, i) => {
                  const config = RATING_CONFIG[section.rating];
                  const Icon = config.icon;
                  return (
                    <div key={i} className="p-3 rounded-lg border border-border/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{section.section}</span>
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {section.rating}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{section.current_issue}</p>
                      <p className="text-xs text-primary">{section.recommendation}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Red Flags */}
              {result.red_flags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.red_flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">ATS Pass Rate</span>
                      <span className="text-sm font-bold">{result.keywords.ats_pass_rate}%</span>
                    </div>
                    <Progress value={result.keywords.ats_pass_rate} className="h-2" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">Present</p>
                    <div className="flex flex-wrap gap-1">
                      {result.keywords.present.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">Missing</p>
                    <div className="flex flex-wrap gap-1">
                      {result.keywords.missing.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rewritten Resume */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Rewritten Resume
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Markdown
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="changelog">What Changed</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-card p-6 rounded-lg border">
                    <ReactMarkdown>{result.rewritten_resume}</ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="markdown" className="mt-4">
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-x-auto">
                    {result.rewritten_resume}
                  </pre>
                </TabsContent>
                <TabsContent value="changelog" className="mt-4">
                  <ul className="space-y-2">
                    {result.rewrite_changelog.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{change}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
