const MODEL = "google/gemini-3.8-flash";

export async function callAi(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet. Please try again later.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 429)
      throw new Error("Too many requests right now. Please wait a moment and try again.");
    if (res.status === 402)
      throw new Error("The AI workspace has run out of credits. Please top up to continue.");
    if (res.status === 403)
      throw new Error("AI access is currently blocked for this workspace.");
    const text = await res.text().catch(() => "");
    throw new Error(`The AI service returned an error. ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI returned an empty response. Please try again.");
  return content;
}

export function parseJson<T>(raw: string, fallback: T): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(slice) as T;
  } catch {
    return fallback;
  }
}

export const SAFETY_CONSTRAINTS = `Constraints:
- Never invent confidential facts, private data, or fake citations presented as verified truth.
- If information is uncertain, say so explicitly.
- Keep content professional, inclusive and workplace-appropriate.
- Return ONLY the requested output format with no extra commentary.`;
