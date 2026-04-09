"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfile } from "@/lib/store";
import {
  FileText,
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  Download,
  Target,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ResumeResult {
  summary: string;
  keywords: string[];
  keyword_coverage: number;
  competencies: string[];
  experience_bullets: {
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }[];
  tailoring_notes: string;
  full_resume_markdown: string;
}

export default function ResumePage() {
  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!jdText.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const profile = await getProfile();
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText, cv_text: cvText, profile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Resume generation failed");
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
    navigator.clipboard.writeText(result.full_resume_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate an ATS-optimized resume tailored to a specific job
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your CV / Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your current CV/resume content (or leave blank to use profile)..."
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={loading || !jdText.trim()}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Tailored Resume
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Keyword Coverage */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium">Keyword Coverage</span>
                </div>
                <span className="text-sm font-bold">{result.keyword_coverage}%</span>
              </div>
              <Progress value={result.keyword_coverage} className="h-2" />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.keywords.map(kw => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competencies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competency Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.competencies.map(comp => (
                  <Badge key={comp} className="bg-primary/10 text-primary border-primary/20">
                    {comp}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resume Output */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generated Resume
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
                  <TabsTrigger value="notes">Tailoring Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-card p-6 rounded-lg border">
                    <ReactMarkdown>{result.full_resume_markdown}</ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="markdown" className="mt-4">
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-x-auto">
                    {result.full_resume_markdown}
                  </pre>
                </TabsContent>
                <TabsContent value="notes" className="mt-4">
                  <p className="text-sm text-muted-foreground">{result.tailoring_notes}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
