import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const ok = user.email?.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase() || user.user_metadata?.role === "admin";
  return ok ? user : null;
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 400 });
  try {
    const body = await req.json();
    const type = String(body.type || "question_set");
    const category = String(body.category || "General AI");
    const level = String(body.level || "Hard");
    const topic = String(body.topic || category);
    const count = Math.min(20, Math.max(1, Number(body.count || 5)));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are Veyrin's senior curriculum editor. Create publication-ready but reviewable content for AI/ML/GenAI/Agentic AI/Python interview preparation.
Category: ${category}
Content type: ${type}
Difficulty: ${level}
Topic/source brief: ${topic}
Requested items: ${count}
Return ONLY valid JSON with this shape:
{
  "title":"...",
  "summary":"...",
  "body":"...",
  "learning_objectives":["..."],
  "sections":[{"heading":"...","content":"..."}],
  "questions":[{"question":"...","answer":"...","follow_up":"...","difficulty":"${level}","category":"${category}"}],
  "coding_questions":[{"title":"...","problem":"...","starter_code":"...","solution_code":"...","explanation":"...","complexity":"...","difficulty":"${level}","category":"${category}"}],
  "tags":["..."]
}
For ${type}, prioritize the matching array/content. Keep every answer technically precise. Python solutions must be executable Python 3 and avoid external packages unless explicitly requested. Do not include markdown fences inside code strings.`;
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-6-luna", input: prompt });
    let text = response.output_text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    let content: unknown;
    try { content = JSON.parse(text); } catch { return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 502 }); }
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI generation failed" }, { status: 500 });
  }
}
