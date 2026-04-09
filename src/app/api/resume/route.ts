import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-optimized, tailored resumes. Given a candidate's profile/CV and a job description, generate a tailored resume.

## Process:
1. Extract 15-20 keywords from the JD
2. Identify the archetype (engineering, product, leadership, etc.)
3. Rewrite the Professional Summary with JD keywords + candidate's narrative
4. Select top 3-4 most relevant projects/experiences
5. Reorder experience bullets by JD relevance
6. Build a competency grid (6-8 keyword phrases)
7. Inject keywords into existing achievements (NEVER fabricate)

## Rules:
- Never fabricate experience, skills, or metrics
- Maintain truthfulness while optimizing presentation
- Use strong action verbs and quantified achievements
- Keep to 1-2 pages
- ATS-friendly formatting (no tables, columns, or graphics)

## Output Format:
Respond with valid JSON:
{
  "summary": "Tailored professional summary...",
  "keywords": ["keyword1", "keyword2", ...],
  "keyword_coverage": 85,
  "competencies": ["Competency 1", "Competency 2", ...],
  "experience_bullets": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "period": "2022-2024",
      "bullets": ["Achievement 1...", "Achievement 2..."]
    }
  ],
  "tailoring_notes": "Brief notes on what was adapted and why...",
  "full_resume_markdown": "Complete resume in markdown format..."
}`;

export async function POST(req: NextRequest) {
  try {
    const { cv_text, jd_text, profile } = await req.json();

    if (!jd_text) {
      return Response.json({ error: "Job description is required" }, { status: 400 });
    }

    let userPrompt = `## Job Description\n${jd_text}`;

    if (cv_text) {
      userPrompt += `\n\n## Current CV/Resume\n${cv_text}`;
    }

    if (profile) {
      userPrompt += `\n\n## Profile\n- Name: ${profile.name}\n- Headline: ${profile.headline}\n- Target Roles: ${profile.target_roles?.join(", ")}\n- Superpowers: ${profile.superpowers?.join(", ")}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: SYSTEM_PROMPT,
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Failed to parse resume" }, { status: 500 });
    }

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Resume error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Resume generation failed" },
      { status: 500 }
    );
  }
}
