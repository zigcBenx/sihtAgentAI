import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth-utils";

const client = new Anthropic();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Use Claude to extract CV details
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: file.type as "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Extract the key details from this CV/resume that would help find relevant job positions. Return a concise summary in 2-4 sentences covering:
- Key skills and technologies
- Years of experience and seniority level
- Industries or domains worked in
- Any notable preferences (remote, specific locations, etc.)
- Languages spoken

Write it as a natural-language description, NOT as a list. Example: "Experienced Python and React developer with 5+ years in fintech. Strong background in data pipelines and REST APIs. Fluent in Slovenian and English, prefers remote or Ljubljana-based positions."

Return ONLY the summary text, nothing else.`,
            },
          ],
        },
      ],
    });

    const extracted =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (!extracted) {
      return NextResponse.json(
        { error: "Could not extract details from the CV" },
        { status: 500 }
      );
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("[parse-cv] Error:", err);
    return NextResponse.json(
      { error: "Failed to parse CV" },
      { status: 500 }
    );
  }
}
