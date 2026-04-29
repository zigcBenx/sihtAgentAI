import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth-utils";
import { generateProfileSchema } from "@/lib/validations/agent";
import { z } from "zod/v4";

const client = new Anthropic();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = generateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    const { workType, experienceLevel, additionalContext, agentType } =
      parsed.data;

    const agentTypeLabel =
      agentType === "job_search"
        ? "searching job boards"
        : "monitoring company career pages";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping set up a job search profile for someone in Slovenia who will be ${agentTypeLabel}.

Based on their answers, generate:
1. "profileSummary" — a concise 1-2 sentence description of what this person is looking for. Write it in third person (e.g. "Looking for senior frontend developer positions..."). Include their field, experience level, and any preferences they mentioned.
2. "searchTerms" — an array of 6-10 search terms optimized for Slovenian job boards. Include:
   - The original role/field in English
   - Slovenian translations where applicable (e.g. "razvijalec", "programer", "inženir")
   - Related job titles and synonyms (e.g. for "Frontend Developer" also include "UI Developer", "Web Developer", "React Developer")
   - Both specific and broader terms
   - If they mentioned specific technologies, include those combined with role words

User's answers:
- Kind of work: "${workType}"
- Experience level: "${experienceLevel}"
- Additional context: "${additionalContext || "None provided"}"

Return ONLY a JSON object: { "profileSummary": "...", "searchTerms": ["...", ...] }`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to generate profile" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]) as {
      profileSummary: string;
      searchTerms: string[];
    };

    return NextResponse.json({
      profileSummary: result.profileSummary || "",
      searchTerms: result.searchTerms || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 }
    );
  }
}
