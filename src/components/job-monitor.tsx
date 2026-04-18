"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecentLogs, getApplyStats, JobLogWithJob } from "@/lib/store";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  Bot,
  Mail,
  AlertCircle,
  Zap,
} from "lucide-react";

const ACTION_CONFIG: Record<string, { icon: typeof Send; color: string; label: string; bg: string }> = {
  apply_triggered: { icon: Send, color: "text-blue-500", label: "Sent to ThePopeBot", bg: "bg-blue-500" },
  apply_accepted: { icon: Bot, color: "text-cyan-500", label: "Agent Job Created", bg: "bg-cyan-500" },
  apply_success: { icon: CheckCircle2, color: "text-emerald-500", label: "Application Accepted", bg: "bg-emerald-500" },
  apply_confirmed: { icon: CheckCircle2, color: "text-emerald-500", label: "Application Confirmed", bg: "bg-emerald-600" },
  apply_failed: { icon: XCircle, color: "text-red-500", label: "Apply Failed", bg: "bg-red-500" },
  apply_rejected: { icon: XCircle, color: "text-red-500", label: "Application Rejected", bg: "bg-red-500" },
  apply_partial: { icon: AlertCircle, color: "text-amber-500", label: "Partial Application", bg: "bg-amber-500" },
  retry_triggered: { icon: RefreshCw, color: "text-amber-500", label: "Retry Triggered", bg: "bg-amber-500" },
  status_changed: { icon: ArrowRight, color: "text-zinc-400", label: "Status Changed", bg: "bg-zinc-500" },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || { icon: Activity, color: "text-zinc-400", label: action.replace(/_/g, " "), bg: "bg-zinc-500" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Pipeline step component
function PipelineStep({
  label,
  active,
  done,
  failed,
  count,
}: {
  label: string;
  active: boolean;
  done: boolean;
  failed?: boolean;
  count?: number;
}) {
  const dotColor = failed
    ? "bg-red-500"
    : done
    ? "bg-emerald-500"
    : active
    ? "bg-cyan-500 animate-pulse"
    : "bg-zinc-700";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-lg font-bold font-mono">{count}</span>
      )}
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex-1 h-px bg-border mt-1.5 min-w-[20px] max-w-[60px]" />
  );
}

export function JobMonitor() {
  const [logs, setLogs] = useState<JobLogWithJob[]>([]);
  const [stats, setStats] = useState({ applying: 0, applied: 0, failed: 0, queued: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refresh = useCallback(async () => {
    const [newLogs, newStats] = await Promise.all([getRecentLogs(100), getApplyStats()]);
    setLogs(newLogs);
    setStats(newStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Group logs by job for the pipeline view
  const activeJobs = logs.reduce((acc, log) => {
    if (!acc[log.job_id]) {
      acc[log.job_id] = {
        job_id: log.job_id,
        title: log.job_title || "Unknown Job",
        company: log.job_company || "",
        status: log.job_status || "",
        logs: [],
      };
    }
    acc[log.job_id].logs.push(log);
    return acc;
  }, {} as Record<string, { job_id: string; title: string; company: string; status: string; logs: JobLogWithJob[] }>);

  // Get jobs currently in pipeline (applying or recently actioned)
  const pipelineJobs = Object.values(activeJobs)
    .filter((j) => j.status === "applying" || j.logs[0]?.created_at > new Date(Date.now() - 3600000).toISOString())
    .sort((a, b) => new Date(b.logs[0].created_at).getTime() - new Date(a.logs[0].created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Pipeline Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Apply Pipeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs gap-1.5 ${autoRefresh ? "text-emerald-500" : "text-muted-foreground"}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
            <Button variant="ghost" size="sm" onClick={refresh} className="h-8 w-8 p-0">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-0 py-4">
            <PipelineStep label="Queued" active={false} done={false} count={stats.queued} />
            <PipelineArrow />
            <PipelineStep label="Sending" active={stats.applying > 0} done={false} count={0} />
            <PipelineArrow />
            <PipelineStep label="Agent Running" active={stats.applying > 0} done={false} count={stats.applying} />
            <PipelineArrow />
            <PipelineStep label="Callback" active={false} done={false} count={0} />
            <PipelineArrow />
            <PipelineStep label="Applied" active={false} done={true} count={stats.applied} />
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs in Pipeline */}
      {pipelineJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-500" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipelineJobs.map((job) => {
              const latestLog = job.logs[0];
              const latestConfig = getActionConfig(latestLog.action);
              const LatestIcon = latestConfig.icon;

              // Determine pipeline stage
              const hasTriggered = job.logs.some((l) => l.action === "apply_triggered");
              const hasAccepted = job.logs.some((l) => l.action === "apply_accepted");
              const hasResult = job.logs.some((l) =>
                ["apply_confirmed", "apply_rejected", "apply_failed", "apply_success"].includes(l.action)
              );
              const isSuccess = job.logs.some((l) =>
                ["apply_confirmed", "apply_success"].includes(l.action)
              );
              const isFailed = job.logs.some((l) =>
                ["apply_rejected", "apply_failed"].includes(l.action)
              );

              return (
                <div
                  key={job.job_id}
                  className="p-4 rounded-lg border border-border/50 space-y-3"
                >
                  {/* Job header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant="secondary" className={latestConfig.color}>
                      <LatestIcon className="w-3 h-3 mr-1" />
                      {latestConfig.label}
                    </Badge>
                  </div>

                  {/* Mini pipeline */}
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 flex-1 rounded-full ${hasTriggered ? "bg-blue-500" : "bg-zinc-800"}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${hasAccepted ? "bg-cyan-500" : "bg-zinc-800"} ${hasAccepted && !hasResult ? "animate-pulse" : ""}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${hasResult ? (isSuccess ? "bg-emerald-500" : "bg-red-500") : "bg-zinc-800"}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Sent</span>
                    <span>Agent Running</span>
                    <span>{isSuccess ? "Applied" : isFailed ? "Failed" : "Pending"}</span>
                  </div>

                  {/* Latest log detail */}
                  <p className="text-xs text-muted-foreground truncate">
                    {latestLog.details}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {timeAgo(latestLog.created_at)}
                    {latestLog.popebot_job_id && (
                      <span className="font-mono ml-2">Job: {latestLog.popebot_job_id.slice(0, 8)}...</span>
                    )}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Full Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Activity Log
            <span className="text-sm font-normal text-muted-foreground">
              ({logs.length} events)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No activity yet. Apply to a job to see the pipeline in action.
            </p>
          ) : (
            <div className="space-y-0">
              {logs.map((log, i) => {
                const config = getActionConfig(log.action);
                const Icon = config.icon;
                const isLast = i === logs.length - 1;

                return (
                  <div key={log.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${config.bg}/15`}>
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                    </div>

                    {/* Content */}
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.job_title && (
                          <span className="font-medium text-foreground">{log.job_title}</span>
                        )}
                        {log.job_company && (
                          <span> at {log.job_company}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {log.details}
                      </p>
                      {log.popebot_job_id && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Agent: {log.popebot_job_id}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
