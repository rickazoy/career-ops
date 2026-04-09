"use client";

import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { JobEvaluation, Profile, InterviewPrep, STARStory, ApplicationStatus } from './types';

function db() {
  return getSupabaseClient()!;
}

// ============================================================================
// Evaluations
// ============================================================================

export async function getEvaluations(): Promise<JobEvaluation[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await db()
    .from('co_evaluations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch evaluations:', error);
    return [];
  }

  return (data || []).map(mapEvaluation);
}

export async function saveEvaluation(evaluation: JobEvaluation): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db()
    .from('co_evaluations')
    .upsert({
      id: evaluation.id,
      created_at: evaluation.created_at,
      company: evaluation.company,
      role: evaluation.role,
      url: evaluation.url || null,
      jd_text: evaluation.jd_text,
      scores: evaluation.scores,
      global_score: evaluation.global_score,
      blocks: evaluation.blocks,
      verdict: evaluation.verdict,
      status: evaluation.status,
      report_markdown: evaluation.report_markdown,
      pdf_generated: evaluation.pdf_generated,
    });

  if (error) console.error('Failed to save evaluation:', error);
}

export async function updateEvaluationStatus(id: string, status: ApplicationStatus): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db()
    .from('co_evaluations')
    .update({ status })
    .eq('id', id);

  if (error) console.error('Failed to update status:', error);
}

export async function deleteEvaluation(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db()
    .from('co_evaluations')
    .delete()
    .eq('id', id);

  if (error) console.error('Failed to delete evaluation:', error);
}

// ============================================================================
// Profile (singleton — first row)
// ============================================================================

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await db()
    .from('co_profiles')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    linkedin: data.linkedin,
    portfolio: data.portfolio,
    github: data.github,
    headline: data.headline,
    exit_story: data.exit_story,
    superpowers: data.superpowers || [],
    target_roles: data.target_roles || [],
    archetypes: data.archetypes || [],
    compensation: data.compensation || { target_range: '', currency: 'USD', minimum: 0 },
  };
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { data: existing } = await db()
    .from('co_profiles')
    .select('id')
    .limit(1)
    .single();

  const row = {
    name: profile.name,
    email: profile.email,
    phone: profile.phone || null,
    location: profile.location,
    linkedin: profile.linkedin || null,
    portfolio: profile.portfolio || null,
    github: profile.github || null,
    headline: profile.headline,
    exit_story: profile.exit_story,
    superpowers: profile.superpowers,
    target_roles: profile.target_roles,
    archetypes: profile.archetypes,
    compensation: profile.compensation,
  };

  if (existing?.id) {
    const { error } = await db()
      .from('co_profiles')
      .update(row)
      .eq('id', existing.id);
    if (error) console.error('Failed to update profile:', error);
  } else {
    const { error } = await db()
      .from('co_profiles')
      .insert(row);
    if (error) console.error('Failed to insert profile:', error);
  }
}

// ============================================================================
// Interview Prep
// ============================================================================

export async function getInterviewPreps(): Promise<InterviewPrep[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await db()
    .from('co_interview_preps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch interview preps:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    evaluation_id: row.evaluation_id || '',
    company: row.company,
    role: row.role,
    rounds: row.rounds || [],
    stories: row.stories || [],
    intel: row.intel,
  }));
}

export async function saveInterviewPrep(prep: InterviewPrep): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db()
    .from('co_interview_preps')
    .upsert({
      id: prep.id,
      evaluation_id: prep.evaluation_id || null,
      company: prep.company,
      role: prep.role,
      rounds: prep.rounds,
      stories: prep.stories,
      intel: prep.intel,
    });

  if (error) console.error('Failed to save interview prep:', error);
}

// ============================================================================
// Story Bank
// ============================================================================

export async function getStories(): Promise<STARStory[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await db()
    .from('co_stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch stories:', error);
    return [];
  }

  return (data || []).map(row => ({
    title: row.title,
    situation: row.situation,
    task: row.task,
    action: row.action,
    result: row.result,
    tags: row.tags || [],
  }));
}

export async function saveStory(story: STARStory): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await db()
    .from('co_stories')
    .insert({
      title: story.title,
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      tags: story.tags,
    });

  if (error) console.error('Failed to save story:', error);
}

// ============================================================================
// Helpers
// ============================================================================

function mapEvaluation(row: Record<string, unknown>): JobEvaluation {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    company: row.company as string,
    role: row.role as string,
    url: (row.url as string) || undefined,
    jd_text: row.jd_text as string,
    scores: row.scores as JobEvaluation['scores'],
    global_score: Number(row.global_score),
    blocks: row.blocks as JobEvaluation['blocks'],
    verdict: row.verdict as JobEvaluation['verdict'],
    status: row.status as ApplicationStatus,
    report_markdown: row.report_markdown as string,
    pdf_generated: row.pdf_generated as boolean,
  };
}
