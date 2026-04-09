"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getProfile } from "@/lib/store";
import {
  Loader2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  BookOpen,
  Lightbulb,
  Users,
} from "lucide-react";

interface InterviewResult {
  company: string;
  role: string;
  overview: string;
  rounds: {
    name: string;
    format: string;
    tips: string[];
    likely_questions: string[];
  }[];
  stories: {
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    tags: string[];
  }[];
  intel: string;
  do_list: string[];
  dont_list: string[];
}

export default function InterviewPage() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!company.trim() || !role.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const profile = await getProfile();
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, jd_text: jdText, profile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Interview prep failed");
      }

      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Prep</h1>
        <p className="text-muted-foreground mt-1">
          Generate company-specific interview intelligence and STAR stories
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Company</label>
              <Input
                placeholder="e.g., Anthropic"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Job Description (optional, improves accuracy)
            </label>
            <Textarea
              placeholder="Paste the job description for more targeted prep..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={loading || !company.trim() || !role.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Generate Prep
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

      {result && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold">{result.company} — {result.role}</h2>
              <p className="text-muted-foreground mt-2">{result.overview}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="rounds">
            <TabsList>
              <TabsTrigger value="rounds" className="gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Interview Rounds
              </TabsTrigger>
              <TabsTrigger value="stories" className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                STAR Stories
              </TabsTrigger>
              <TabsTrigger value="intel" className="gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Intel & Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rounds" className="mt-4 space-y-4">
              {result.rounds.map((round, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {round.name}
                      <Badge variant="secondary">{round.format}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tips</h4>
                      <ul className="space-y-1.5">
                        {round.tips.map((tip, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Likely Questions</h4>
                      <ul className="space-y-1.5">
                        {round.likely_questions.map((q, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex gap-2">
                            <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="stories" className="mt-4 space-y-4">
              {result.stories.map((story, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <div className="flex gap-1.5">
                      {story.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-primary">S — Situation:</span>
                      <p className="text-muted-foreground mt-0.5">{story.situation}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-primary">T — Task:</span>
                      <p className="text-muted-foreground mt-0.5">{story.task}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-primary">A — Action:</span>
                      <p className="text-muted-foreground mt-0.5">{story.action}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-primary">R — Result:</span>
                      <p className="text-muted-foreground mt-0.5">{story.result}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="intel" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Intel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.intel}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Do
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.do_list.map((item, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Don&apos;t
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.dont_list.map((item, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
