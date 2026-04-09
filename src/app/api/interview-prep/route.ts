import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert interview preparation coach. Given a company, role, and optional job description, generate comprehensive interview preparation materials.

## Output Format:
Respond with valid JSON:
{
  "company": "Company Name",
  "role": "Role Title",
  "overview": "Brief company/role context...",
  "rounds": [
    {
      "name": "Phone Screen",
      "format": "30-min call with recruiter",
      "tips": ["tip 1", "tip 2"],
      "likely_questions": ["question 1", "question 2", "question 3"]
    }
  ],
  "stories": [
    {
      "title": "Led Platform Migration",
      "situation": "The legacy system was...",
      "task": "I needed to...",
      "action": "I designed and implemented...",
      "result": "Reduced latency by 40% and...",
      "tags": ["leadership", "technical", "migration"]
    }
  ],
  "intel": "Key insights about the company's interview process, culture, what they look for...",
  "do_list": ["Research X", "Practice Y", "Prepare Z"],
  "dont_list": ["Don't mention X", "Avoid topic Y"]
}

Generate 3-5 interview rounds, 3-5 STAR stories relevant to the role, and actionable intel.`;

export async function POST(req: NextRequest) {
  try {
    const { company, role, jd_text, profile } = await req.json();

    if (!company || !role) {
      return Response.json({ error: "Company and role are required" }, { status: 400 });
    }

    let userPrompt = `Prepare interview materials for:\n- Company: ${company}\n- Role: ${role}`;

    if (jd_text) {
      userPrompt += `\n\n## Job Description\n${jd_text}`;
    }

    if (profile) {
      userPrompt += `\n\n## Candidate Profile\n- Name: ${profile.name}\n- Headline: ${profile.headline}\n- Superpowers: ${profile.superpowers?.join(", ")}`;
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
      return Response.json({ error: "Failed to parse interview prep" }, { status: 500 });
    }

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("Interview prep error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Interview prep failed" },
      { status: 500 }
    );
  }
}
