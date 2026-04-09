"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge, ScoreBar } from "@/components/score-badge";
import { saveEvaluation, getProfile } from "@/lib/store";
import { JobEvaluation, SCORING_DIMENSIONS, STATUS_CONFIG } from "@/lib/types";
import {
  Search,
  Loader2,
  Building2,
  UserCheck,
  Target,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Link as LinkIcon,
  FileText,
  Save,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const BLOCK_CONFIG = [
  { key: "a_company", label: "Company Overview", icon: Building2 },
  { key: "b_role", label: "Role Analysis", icon: Target },
  { key: "c_match", label: "CV Match", icon: UserCheck },
  { key: "d_signals", label: "Signals & Red Flags", icon: AlertTriangle },
  { key: "e_comp", label: "Compensation", icon: DollarSign },
  { key: "f_verdict", label: "Verdict & Actions", icon: CheckCircle2 },
] as const;

export default function EvaluatePage() {
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobEvaluation | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleEvaluate() {
    const jdText = input.trim();
    if (!jdText) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      const profile = await getProfile();
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText, profile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Evaluation failed");
      }

      const data = await res.json();

      const evaluation: JobEvaluation = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        company: data.company,
        role: data.role,
        url: url || undefined,
        jd_text: jdText,
        scores: data.scores,
        global_score: data.global_score,
        blocks: data.blocks,
        verdict: data.verdict,
        status: "evaluated",
        report_markdown: Object.entries(data.blocks)
          .map(([, content]) => content)
          .join("\n\n---\n\n"),
        pdf_generated: false,
      };

      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    await saveEvaluation(result);
    setSaved(true);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluate Job</h1>
        <p className="text-muted-foreground mt-1">
          Paste a job description to get a detailed evaluation across 10 dimensions
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Job URL (optional)</span>
              </div>
              <Input
                placeholder="https://company.com/careers/role-name"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Job Description</span>
            </div>
            <Textarea
              placeholder="Paste the full job description here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {input.length > 0 ? `${input.split(/\s+/).length} words` : "Paste a JD to evaluate"}
            </p>
            <Button
              onClick={handleEvaluate}
              disabled={loading || !input.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Evaluate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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
          {/* Header Card */}
          <Card className="gradient-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{result.company}</h2>
                  <p className="text-lg text-muted-foreground">{result.role}</p>
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View original posting
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ScoreBadge score={result.global_score} size="lg" />
                  <Button
                    variant={saved ? "outline" : "default"}
                    onClick={handleSave}
                    disabled={saved}
                    className="gap-2"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save to Tracker
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scores Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SCORING_DIMENSIONS.map(dim => {
                  const score = result.scores[dim.key as keyof typeof result.scores];
                  return (
                    <ScoreBar
                      key={dim.key}
                      score={score}
                      label={`${dim.label} (${(dim.weight * 100).toFixed(0)}%)`}
                    />
                  );
                })}
              </CardContent>
            </Card>

            {/* Analysis Blocks */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <Tabs defaultValue="a_company">
                  <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                    {BLOCK_CONFIG.map(block => (
                      <TabsTrigger
                        key={block.key}
                        value={block.key}
                        className="gap-1.5 text-xs"
                      >
                        <block.icon className="w-3.5 h-3.5" />
                        {block.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {BLOCK_CONFIG.map(block => (
                    <TabsContent key={block.key} value={block.key} className="mt-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {result.blocks[block.key as keyof typeof result.blocks]}
                        </ReactMarkdown>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
