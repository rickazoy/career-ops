"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/score-badge";
import { getEvaluations, updateEvaluationStatus, deleteEvaluation } from "@/lib/store";
import { JobEvaluation, ApplicationStatus, STATUS_CONFIG } from "@/lib/types";
import { Kanban, List, Trash2, ExternalLink, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

const KANBAN_COLUMNS: ApplicationStatus[] = [
  "evaluated",
  "applied",
  "responded",
  "interview",
  "offer",
  "rejected",
];

export default function TrackerPage() {
  const [evaluations, setEvaluations] = useState<JobEvaluation[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    getEvaluations().then(setEvaluations);
  }, []);

  async function refresh() {
    setEvaluations(await getEvaluations());
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    await updateEvaluationStatus(id, status);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteEvaluation(id);
    await refresh();
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground mt-1">
            {evaluations.length} applications tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
            className="gap-1.5"
          >
            <Kanban className="w-4 h-4" />
            Board
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className="gap-1.5"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView
          evaluations={evaluations}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      ) : (
        <ListView
          evaluations={evaluations}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function KanbanView({
  evaluations,
  onStatusChange,
  onDelete,
}: {
  evaluations: JobEvaluation[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(status => {
        const items = evaluations.filter(e => e.status === status);
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className="min-w-[280px] w-[280px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Badge variant="secondary" className={config.color}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(evaluation => (
                <EvalCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  compact
                />
              ))}
              {items.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No items
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({
  evaluations,
  onStatusChange,
  onDelete,
}: {
  evaluations: JobEvaluation[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No applications tracked yet. Evaluate a job to get started.
          </CardContent>
        </Card>
      ) : (
        evaluations.map(evaluation => (
          <EvalCard
            key={evaluation.id}
            evaluation={evaluation}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

function EvalCard({
  evaluation,
  onStatusChange,
  onDelete,
  compact,
}: {
  evaluation: JobEvaluation;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors text-left">
          <CardContent className={compact ? "p-3" : "p-4"}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`font-medium truncate ${compact ? "text-sm" : ""}`}>
                  {evaluation.company}
                </p>
                <p className="text-xs text-muted-foreground truncate">{evaluation.role}</p>
                {!compact && (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <ScoreBadge score={evaluation.global_score} size="sm" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {evaluation.company} — {evaluation.role}
            <ScoreBadge score={evaluation.global_score} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={evaluation.status}
              onValueChange={(v) => onStatusChange(evaluation.id, v as ApplicationStatus)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map(s => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {evaluation.url && (
              <a
                href={evaluation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> View posting
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => onDelete(evaluation.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="report">
            <TabsList>
              <TabsTrigger value="report">Full Report</TabsTrigger>
              <TabsTrigger value="jd">Job Description</TabsTrigger>
            </TabsList>
            <TabsContent value="report" className="mt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{evaluation.report_markdown}</ReactMarkdown>
              </div>
            </TabsContent>
            <TabsContent value="jd" className="mt-4">
              <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {evaluation.jd_text}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
