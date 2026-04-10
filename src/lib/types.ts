export interface Profile {
  name: string;
  email: string;
  phone?: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
  headline: string;
  exit_story: string;
  superpowers: string[];
  target_roles: string[];
  archetypes: Archetype[];
  compensation: {
    target_range: string;
    currency: string;
    minimum: number;
  };
}

export interface Archetype {
  name: string;
  level: string;
  fit: 'primary' | 'secondary' | 'adjacent';
}

export interface JobEvaluation {
  id: string;
  created_at: string;
  company: string;
  role: string;
  url?: string;
  jd_text: string;
  scores: EvaluationScores;
  global_score: number;
  blocks: EvaluationBlocks;
  verdict: 'strong_match' | 'good_match' | 'decent' | 'pass';
  status: ApplicationStatus;
  report_markdown: string;
  pdf_generated: boolean;
}

export interface EvaluationScores {
  cv_match: number;
  north_star: number;
  compensation: number;
  cultural_signals: number;
  red_flags: number;
  growth_trajectory: number;
  remote_quality: number;
  tech_stack: number;
  company_reputation: number;
  speed_to_offer: number;
}

export interface EvaluationBlocks {
  a_company: string;    // Company overview
  b_role: string;       // Role analysis
  c_match: string;      // CV match analysis
  d_signals: string;    // Cultural & red flag signals
  e_comp: string;       // Compensation analysis
  f_verdict: string;    // Final verdict & action items
}

export type ApplicationStatus =
  | 'evaluated'
  | 'applied'
  | 'responded'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'discarded'
  | 'skip';

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; emoji: string }> = {
  evaluated: { label: 'Evaluated', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', emoji: '🔍' },
  applied: { label: 'Applied', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400', emoji: '📨' },
  responded: { label: 'Responded', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400', emoji: '💬' },
  interview: { label: 'Interview', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', emoji: '🎯' },
  offer: { label: 'Offer', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', emoji: '🎉' },
  rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-700 dark:text-red-400', emoji: '❌' },
  discarded: { label: 'Discarded', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400', emoji: '🗑️' },
  skip: { label: 'Skip', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400', emoji: '⏭️' },
};

export const SCORING_DIMENSIONS = [
  { key: 'cv_match', label: 'CV Match', weight: 0.15, description: 'Skills, experience, proof points alignment' },
  { key: 'north_star', label: 'North Star', weight: 0.25, description: 'How well role fits target archetypes' },
  { key: 'compensation', label: 'Compensation', weight: 0.10, description: 'Salary vs market rate' },
  { key: 'cultural_signals', label: 'Culture', weight: 0.05, description: 'Culture, growth, stability, remote' },
  { key: 'red_flags', label: 'Red Flags', weight: 0.05, description: 'Blockers and warnings (negative)' },
  { key: 'growth_trajectory', label: 'Growth', weight: 0.10, description: 'Career trajectory potential' },
  { key: 'remote_quality', label: 'Remote', weight: 0.05, description: 'Remote work quality' },
  { key: 'tech_stack', label: 'Tech Stack', weight: 0.05, description: 'Technology modernity' },
  { key: 'company_reputation', label: 'Reputation', weight: 0.05, description: 'Company brand & standing' },
  { key: 'speed_to_offer', label: 'Speed', weight: 0.05, description: 'Expected time to offer' },
] as const;

export interface InterviewPrep {
  id: string;
  evaluation_id: string;
  company: string;
  role: string;
  rounds: InterviewRound[];
  stories: STARStory[];
  intel: string;
}

export interface InterviewRound {
  name: string;
  format: string;
  tips: string[];
  likely_questions: string[];
}

export interface STARStory {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
}

export interface PortalCompany {
  name: string;
  careers_url: string;
  category: string;
  greenhouse_id?: string;
}

// ============================================================================
// Jobs Feed (populated by ThePopeBot, consumed by Career Ops)
// ============================================================================

export interface Job {
  id: string;
  created_at: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: JobSource;
  description: string;
  salary_range?: string;
  job_type?: string;
  remote_type?: 'remote' | 'hybrid' | 'onsite';
  posted_at?: string;
  match_score?: number;
  status: JobStatus;
  notes?: string;
  applied_at?: string;
  evaluation_id?: string;
  retry_count?: number;
  last_error?: string;
  last_attempt_at?: string;
}

export type JobSource = 'linkedin' | 'indeed' | 'glassdoor' | 'ziprecruiter' | 'other';

export type JobStatus =
  | 'new'
  | 'reviewed'
  | 'queued'
  | 'applying'
  | 'applied'
  | 'rejected'
  | 'skipped';

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  reviewed: { label: 'Reviewed', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  queued: { label: 'Queued', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  applying: { label: 'Applying', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
  applied: { label: 'Applied', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  skipped: { label: 'Skipped', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400' },
};

export const JOB_SOURCE_CONFIG: Record<JobSource, { label: string; color: string }> = {
  linkedin: { label: 'LinkedIn', color: 'bg-blue-600/15 text-blue-700 dark:text-blue-400' },
  indeed: { label: 'Indeed', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' },
  glassdoor: { label: 'Glassdoor', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  ziprecruiter: { label: 'ZipRecruiter', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  other: { label: 'Other', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400' },
};
