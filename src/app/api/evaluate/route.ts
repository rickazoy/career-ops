import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert career advisor and job evaluation AI. You evaluate job opportunities against a candidate's profile using a rigorous 10-dimension scoring framework.

## Evaluation Framework

For each job, produce a structured evaluation with 6 blocks (A-F) and scores across 10 dimensions.

### Blocks:
- **A — Company Overview**: Company size, stage, funding, reputation, culture signals, remote policy, tech stack
- **B — Role Analysis**: Seniority, scope, team structure, growth potential, reporting line, key responsibilities
- **C — CV Match**: Skills alignment, experience match, proof points, gaps, keyword overlap percentage
- **D — Signals & Red Flags**: Cultural signals (positive/negative), red flags, deal-breakers, growth indicators
- **E — Compensation Analysis**: Market positioning, equity potential, benefits, total comp estimate
- **F — Verdict & Actions**: Final verdict, recommended next steps, application priority, tailoring suggestions

### Scoring Dimensions (1-5 scale):
1. **CV Match** (15%): Skills, experience, proof points alignment
2. **North Star Alignment** (25%): How well role fits target archetypes and career direction
3. **Compensation** (10%): Salary vs market (5=top quartile)
4. **Cultural Signals** (5%): Culture, growth, stability, remote quality
5. **Red Flags** (5%): Blockers/warnings (5=none, 1=critical blockers)
6. **Growth Trajectory** (10%): Career advancement potential
7. **Remote Quality** (5%): Remote work setup quality
8. **Tech Stack** (5%): Technology modernity and relevance
9. **Company Reputation** (5%): Brand and industry standing
10. **Speed to Offer** (5%): Expected hiring velocity

### Score Interpretation:
- 4.5+ = Strong match, apply immediately
- 4.0-4.4 = Good match, worth applying
- 3.5-3.9 = Decent, only if specific reason
- Below 3.5 = Recommend against

## Output Format

You MUST respond with valid JSON matching this exact structure:
{
  "company": "Company Name",
  "role": "Role Title",
  "scores": {
    "cv_match": 4.2,
    "north_star": 4.5,
    "compensation": 3.8,
    "cultural_signals": 4.0,
    "red_flags": 4.5,
    "growth_trajectory": 4.3,
    "remote_quality": 3.5,
    "tech_stack": 4.0,
    "company_reputation": 4.2,
    "speed_to_offer": 3.5
  },
  "global_score": 4.2,
  "verdict": "strong_match",
  "blocks": {
    "a_company": "markdown content...",
    "b_role": "markdown content...",
    "c_match": "markdown content...",
    "d_signals": "markdown content...",
    "e_comp": "markdown content...",
    "f_verdict": "markdown content..."
  }
}

The global_score should be the weighted average of all dimensions. The verdict should be one of: "strong_match" (>=4.5), "good_match" (>=4.0), "decent" (>=3.5), or "pass" (<3.5).

Each block should be 2-4 paragraphs of rich, specific analysis in markdown format. Be honest and direct — don't inflate scores. Quality over quantity.`;

export async function POST(req: NextRequest) {
  try {
    const { jd_text, profile } = await req.json();

    if (!jd_text) {
      return Response.json({ error: "Job description is required" }, { status: 400 });
    }

    let userPrompt = `Evaluate this job opportunity:\n\n${jd_text}`;

    if (profile) {
      userPrompt += `\n\n---\n\nCandidate Profile:\n- Name: ${profile.name}\n- Headline: ${profile.headline}\n- Target Roles: ${profile.target_roles?.join(", ")}\n- Superpowers: ${profile.superpowers?.join(", ")}\n- Location: ${profile.location}\n- Compensation Target: ${profile.compensation?.target_range} ${profile.compensation?.currency}`;

      if (profile.archetypes?.length > 0) {
        userPrompt += `\n- Archetypes: ${profile.archetypes.map((a: { name: string; fit: string }) => `${a.name} (${a.fit})`).join(", ")}`;
      }
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: SYSTEM_PROMPT,
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Failed to parse evaluation" }, { status: 500 });
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return Response.json(evaluation);
  } catch (error) {
    console.error("Evaluation error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
