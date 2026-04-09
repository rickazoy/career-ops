"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/score-badge";
import { getEvaluations } from "@/lib/store";
import { JobEvaluation, STATUS_CONFIG, ApplicationStatus } from "@/lib/types";
import {
  Search,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Briefcase,
  FileCheck,
  MessageSquare,
  Star,
} from "lucide-react";

function cx(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const [evaluations, setEvaluations] = useState<JobEvaluation[]>([]);

  useEffect(() => {
    getEvaluations().then(setEvaluations);
  }, []);

  const stats = {
    total: evaluations.length,
    applied: evaluations.filter(e => ['applied', 'responded', 'interview', 'offer'].includes(e.status)).length,
    interviews: evaluations.filter(e => e.status === 'interview').length,
    offers: evaluations.filter(e => e.status === 'offer').length,
    avgScore: evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.global_score, 0) / evaluations.length
      : 0,
    strongMatches: evaluations.filter(e => e.global_score >= 4.5).length,
  };

  const statusCounts = evaluations.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentEvals = evaluations.slice(0, 5);
  const topScored = [...evaluations].sort((a, b) => b.global_score - a.global_score).slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your job search command center</p>
        </div>
        <Link href="/evaluate">
          <Button className="gap-2">
            <Search className="w-4 h-4" />
            Evaluate New Job
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Evaluated"
          value={stats.total}
          subtitle={`${stats.strongMatches} strong matches`}
          icon={<Target className="w-5 h-5" />}
          color="text-primary"
        />
        <StatsCard
          title="Applied"
          value={stats.applied}
          subtitle={`${stats.total > 0 ? ((stats.applied / stats.total) * 100).toFixed(0) : 0}% application rate`}
          icon={<FileCheck className="w-5 h-5" />}
          color="text-cyan-600 dark:text-cyan-400"
        />
        <StatsCard
          title="Interviews"
          value={stats.interviews}
          subtitle={`${stats.applied > 0 ? ((stats.interviews / stats.applied) * 100).toFixed(0) : 0}% conversion`}
          icon={<MessageSquare className="w-5 h-5" />}
          color="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Avg Score"
          value={stats.avgScore.toFixed(1)}
          subtitle="across all evaluations"
          icon={<Star className="w-5 h-5" />}
          color="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Funnel + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No evaluations yet. Start by evaluating a job posting.
              </p>
            ) : (
              (Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(status => {
                const count = statusCounts[status] || 0;
                if (count === 0) return null;
                const config = STATUS_CONFIG[status];
                return (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="secondary" className={config.color}>
                      {config.label}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Recent Evaluations
            </CardTitle>
            {evaluations.length > 0 && (
              <Link href="/tracker" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentEvals.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-medium text-lg mb-2">No evaluations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Paste a job description or URL to get started
                </p>
                <Link href="/evaluate">
                  <Button variant="outline" className="gap-2">
                    <Search className="w-4 h-4" />
                    Evaluate Your First Job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvals.map(evaluation => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{evaluation.company}</span>
                        <Badge variant="secondary" className={STATUS_CONFIG[evaluation.status].color}>
                          {STATUS_CONFIG[evaluation.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{evaluation.role}</p>
                    </div>
                    <ScoreBadge score={evaluation.global_score} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Scored */}
      {topScored.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Top Scored Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {topScored.map((evaluation, i) => (
                <div
                  key={evaluation.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">#{i + 1}</span>
                    <ScoreBadge score={evaluation.global_score} size="sm" />
                  </div>
                  <p className="font-medium text-sm leading-tight">{evaluation.company}</p>
                  <p className="text-xs text-muted-foreground truncate">{evaluation.role}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={cx(color, "p-2.5 rounded-lg bg-muted/50")}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
