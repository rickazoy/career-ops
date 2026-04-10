"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/score-badge";
import { getJobs, updateJobStatus, bulkUpdateJobStatus } from "@/lib/store";
import {
  Job,
  JobStatus,
  JOB_STATUS_CONFIG,
  JOB_SOURCE_CONFIG,
  JobSource,
} from "@/lib/types";
import {
  Search,
  Send,
  CheckCheck,
  X,
  ExternalLink,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Wifi,
  Filter,
  Inbox,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Briefcase,
} from "lucide-react";

const STATUS_TABS: { value: JobStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "queued", label: "Queued" },
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "skipped", label: "Skipped" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<JobStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<JobSource | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applying, setApplying] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const filters: Parameters<typeof getJobs>[0] = {};
    if (activeTab !== "all") filters.status = [activeTab];
    if (sourceFilter !== "all") filters.source = sourceFilter;
    if (search.trim()) filters.search = search.trim();
    const data = await getJobs(filters);
    setJobs(data);
    setLoading(false);
  }, [activeTab, sourceFilter, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((j) => j.id)));
    }
  }

  async function handleBulkAction(status: JobStatus) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    if (status === "queued") {
      // Trigger apply for each selected job
      for (const id of ids) {
        await triggerApply(id);
      }
    } else {
      await bulkUpdateJobStatus(ids, status);
    }
    setSelected(new Set());
    fetchJobs();
  }

  async function triggerApply(jobId: string) {
    setApplying((prev) => new Set(prev).add(jobId));
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) {
        console.error("Apply failed:", await res.text());
      }
    } catch (err) {
      console.error("Apply error:", err);
    } finally {
      setApplying((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      fetchJobs();
    }
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    if (status === "queued") {
      await triggerApply(id);
    } else {
      await updateJobStatus(id, status);
      fetchJobs();
    }
  }

  const statusCounts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {jobs.length} jobs found{" "}
            {statusCounts["new"] ? `\u00b7 ${statusCounts["new"]} new` : ""}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchJobs}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as JobSource | "all")}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="glassdoor">Glassdoor</option>
            <option value="ziprecruiter">ZipRecruiter</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && statusCounts[tab.value] ? (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {statusCounts[tab.value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => handleBulkAction("queued")}
            >
              <Send className="w-3.5 h-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => handleBulkAction("skipped")}
            >
              <X className="w-3.5 h-3.5" />
              Skip
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-medium text-lg mb-2">No jobs yet</h3>
          <p className="text-sm text-muted-foreground">
            ThePopeBot will push jobs here as they match your search preferences.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={selected.size === jobs.length && jobs.length > 0}
              onChange={selectAll}
              className="rounded border-border"
            />
            <span className="flex-1">
              <button onClick={selectAll} className="hover:text-foreground">
                {selected.size === jobs.length ? "Deselect all" : "Select all"}
              </button>
            </span>
            <span className="w-20 text-right">Score</span>
            <span className="w-24 text-right">Status</span>
            <span className="w-28 text-right">Actions</span>
          </div>

          {jobs.map((job) => {
            const isExpanded = expandedId === job.id;
            const isApplying = applying.has(job.id);

            return (
              <Card
                key={job.id}
                className={`transition-all ${
                  selected.has(job.id)
                    ? "ring-2 ring-primary/30 bg-primary/[0.02]"
                    : ""
                } ${job.status === "new" ? "border-l-2 border-l-blue-500" : ""}`}
              >
                <CardContent className="p-0">
                  {/* Main Row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="rounded border-border shrink-0"
                    />

                    {/* Job Info */}
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : job.id)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {job.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            JOB_SOURCE_CONFIG[job.source]?.color || ""
                          }
                        >
                          {JOB_SOURCE_CONFIG[job.source]?.label || job.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {job.location}
                        </span>
                        {job.remote_type && (
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5" />
                            {job.remote_type}
                          </span>
                        )}
                        {job.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {timeAgo(job.created_at)}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Score */}
                    <div className="w-20 text-right shrink-0">
                      {job.match_score != null ? (
                        <ScoreBadge score={job.match_score} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="w-24 text-right shrink-0">
                      <Badge
                        variant="secondary"
                        className={JOB_STATUS_CONFIG[job.status].color}
                      >
                        {JOB_STATUS_CONFIG[job.status].label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="w-28 flex justify-end gap-1 shrink-0">
                      {job.status !== "applied" &&
                        job.status !== "applying" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStatusChange(job.id, "queued")}
                            disabled={isApplying}
                            title="Apply"
                          >
                            {isApplying ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handleStatusChange(
                            job.id,
                            job.status === "skipped" ? "new" : "skipped"
                          )
                        }
                        title={job.status === "skipped" ? "Restore" : "Skip"}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent"
                        title="Open listing"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
                        <div className="lg:col-span-2 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-1">
                              Description
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                              {job.description || "No description available."}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {job.salary_range && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span>{job.salary_range}</span>
                            </div>
                          )}
                          {job.job_type && (
                            <div className="flex items-center gap-2 text-sm">
                              <Briefcase className="w-4 h-4 text-muted-foreground" />
                              <span>{job.job_type}</span>
                            </div>
                          )}
                          {job.posted_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                Posted{" "}
                                {new Date(job.posted_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 flex flex-col gap-2">
                            {job.status !== "applied" &&
                              job.status !== "applying" && (
                                <Button
                                  className="w-full gap-2"
                                  onClick={() =>
                                    handleStatusChange(job.id, "queued")
                                  }
                                  disabled={isApplying}
                                >
                                  {isApplying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                  Apply via ThePopeBot
                                </Button>
                              )}
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Original
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
