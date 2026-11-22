// Supabase Edge Function (Deno): AI discussion generator for book clubs.
//
// Deploy:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy discussion-questions
//
// The Anthropic key lives only here, never in the mobile app. The function
// requires a signed-in Supabase user (verify_jwt is on by default).

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STAGES: Record<string, string> = {
  warmup:
    "Easy, welcoming opening questions that get everybody talking: first impressions, how the book found them, one-word summaries, where/when they read it. No spoilers.",
  rating:
    "Rating questions: stars out of 5, what pushed the rating up or down, who they would recommend it to, how it compares with other books they rated.",
  characters:
    "Questions about the characters: who they loved or hated, who changed, whom they would invite to dinner, motives that surprised them.",
  plot:
    "Questions about the plot and structure: the twists, pacing, the ending, scenes that stayed with them, what they would change.",
  themes:
    "Deeper questions about the themes, the author's message, what the book says about society or relationships, and what readers take from it into their own lives.",
  fun:
    "Playful, fun questions: casting the movie, would-you-rather, alternative endings, the book's soundtrack, which character they would swap lives with.",
  closing:
    "Closing questions: the one takeaway, who should read it next, and what the group should read next.",
};

const TONES: Record<string, string> = {
  cozy: "warm, friendly and easy to answer",
  deep: "thoughtful and probing, inviting longer answers",
  playful: "light, funny and a bit cheeky",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function ask(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!API_KEY) return json({ error: "ANTHROPIC_API_KEY is not set" }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const language = body.language === "nb" ? "Norwegian (Bokmål)" : "English";
  const title = clip(body.title, 200);
  const authors = clip(body.authors, 200);
  const description = clip(body.description, 1500);
  if (!title) return json({ error: "title_required" }, 400);

  const bookInfo =
    `Book: "${title}"${authors ? ` by ${authors}` : ""}.` +
    (description ? `\nDescription: ${description}` : "");

  try {
    if (body.mode === "summary") {
      const notes = Array.isArray(body.notes)
        ? body.notes.slice(0, 60).map((n: unknown) => `- ${clip(n, 600)}`).join("\n")
        : "";
      if (!notes) return json({ error: "notes_required" }, 400);
      const text = await ask(
        `You write concise, friendly summaries of book club meetings in ${language}. ` +
          `Use only what is in the notes; do not invent details. Reply with JSON only: {"summary": string}. ` +
          `The summary is 3-6 sentences, optionally followed by a short "Highlights:" list.`,
        `${bookInfo}\n\nMeeting notes from members:\n${notes}`,
      );
      return json({ summary: String(extractJson(text).summary ?? "").trim() });
    }

    const stage = typeof body.stage === "string" && STAGES[body.stage] ? body.stage : "warmup";
    const tone = typeof body.tone === "string" && TONES[body.tone] ? body.tone : "cozy";
    const spoilers = body.spoilers === true;
    const count = Math.min(Math.max(Number(body.count) || 3, 1), 6);
    const exclude = Array.isArray(body.exclude)
      ? body.exclude.slice(0, 30).map((q: unknown) => `- ${clip(q, 200)}`).join("\n")
      : "";

    const text = await ask(
      `You are the host of an in-person book club meeting. You write discussion questions in ${language}. ` +
        `Tone: ${TONES[tone]}. ` +
        (spoilers
          ? "Spoilers are fine (everyone has finished the book). "
          : "Do NOT reveal spoilers, twists or the ending. ") +
        `Each question must be a single sentence or two, answerable out loud in under a minute, and specific to this book rather than generic. ` +
        `Reply with JSON only: {"questions": string[]}.`,
      `${bookInfo}\n\nStage: ${stage}. ${STAGES[stage]}\nWrite ${count} questions.` +
        (exclude ? `\n\nDo not repeat or paraphrase these questions already asked:\n${exclude}` : ""),
    );
    const parsed = extractJson(text);
    const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .map((q: unknown) => String(q).trim())
      .filter(Boolean)
      .slice(0, count);
    return json({ questions });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 502);
  }
});
