import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAi, parseJson, SAFETY_CONSTRAINTS } from "./ai.server";

/* ---------------------------------- Email --------------------------------- */

const EmailInput = z.object({
  purpose: z.string().min(3),
  details: z.string().default(""),
  recipient: z.string().min(1),
  tone: z.string().min(1),
  length: z.string().min(1),
});

export type EmailResult = { subject: string; body: string };

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }): Promise<EmailResult> => {
    const system = `Role: You are a senior workplace communications specialist who writes clear business email.
Task: Write one complete professional email from the user's brief.
Instructions:
- Write a specific, informative subject line (max 12 words).
- Structure the body: greeting, purpose, supporting detail, clear next step, sign-off with "[Your Name]".
- Length guide: Short = under 90 words, Medium = 120-180 words, Long = 220-300 words.
- Never fabricate names, dates, numbers or commitments not implied by the brief; use [square brackets] placeholders instead.
Expected output format: strict JSON object {"subject": string, "body": string}. Use \\n for line breaks.
${SAFETY_CONSTRAINTS}`;

    const user = `Context:
- Recipient type: ${data.recipient}
- Tone: ${data.tone}
- Length: ${data.length}
- Purpose: ${data.purpose}
- Additional details: ${data.details || "none provided"}`;

    const raw = await callAi(system, user);
    const parsed = parseJson<EmailResult>(raw, { subject: "Generated email", body: raw });
    return { subject: parsed.subject || "Generated email", body: parsed.body || raw };
  });

/* ------------------------------ Meeting notes ------------------------------ */

export type MeetingResult = {
  summary: string;
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
};

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ notes: z.string().min(20) }).parse(d))
  .handler(async ({ data }): Promise<MeetingResult> => {
    const system = `Role: You are an experienced executive assistant who produces meeting minutes.
Task: Summarise raw meeting notes into structured minutes.
Instructions:
- Summary: 3-5 sentences covering purpose and outcome.
- Decisions: only decisions actually made.
- Action items: each with the task, the responsible person, and the deadline.
- If an owner or deadline is not stated, use "Unassigned" or "Not specified". Never guess.
Expected output format: strict JSON {"summary": string, "decisions": string[], "actionItems": [{"task": string, "owner": string, "deadline": string}]}.
Tone: neutral, factual, professional.
${SAFETY_CONSTRAINTS}`;

    const raw = await callAi(system, `Meeting notes:\n${data.notes}`);
    const parsed = parseJson<MeetingResult>(raw, {
      summary: raw,
      decisions: [],
      actionItems: [],
    });
    return {
      summary: parsed.summary || raw,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  });

/* --------------------------------- Planner -------------------------------- */

export type PlanResult = { schedule: { block: string; items: string[] }[]; advice: string[] };

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        horizon: z.string().default("daily"),
        tasks: z
          .array(
            z.object({
              name: z.string(),
              priority: z.string(),
              deadline: z.string().default(""),
              estimate: z.string().default(""),
            }),
          )
          .min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<PlanResult> => {
    const system = `Role: You are a productivity coach who builds realistic work schedules.
Task: Organise the user's tasks into a practical ${data.horizon} schedule.
Instructions:
- Respect priorities and deadlines; front-load high priority and deadline-driven work.
- Group work into time blocks (e.g. "09:00 - 10:30" for daily, or "Monday" for weekly).
- Include short breaks and buffer time; do not overload a block.
- Add 2-4 short practical tips under advice.
Expected output format: strict JSON {"schedule": [{"block": string, "items": string[]}], "advice": string[]}.
Tone: encouraging, concise, professional.
${SAFETY_CONSTRAINTS}`;

    const user = `Planning horizon: ${data.horizon}
Tasks:
${data.tasks
  .map(
    (t, i) =>
      `${i + 1}. ${t.name} | priority: ${t.priority} | deadline: ${t.deadline || "none"} | estimated time: ${t.estimate || "unknown"}`,
  )
  .join("\n")}`;

    const raw = await callAi(system, user);
    const parsed = parseJson<PlanResult>(raw, { schedule: [], advice: [] });
    return {
      schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
      advice: Array.isArray(parsed.advice) ? parsed.advice : [],
    };
  });

/* --------------------------------- Research -------------------------------- */

export type ResearchResult = {
  overview: string;
  sections: { heading: string; points: string[] }[];
  recommendations: string[];
  sources: string[];
};

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ topic: z.string().min(3), mode: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }): Promise<ResearchResult> => {
    const system = `Role: You are a workplace research analyst.
Task: Answer the user's research request in the requested depth: "${data.mode}".
Instructions:
- Quick summary: one tight paragraph plus 3 bullets. Detailed summary: 3-4 themed sections. Key insights: insight-led bullets with "so what" implications. Recommendations: prioritised practical actions.
- Base the answer on well-established general knowledge and state clearly where evidence is uncertain or may be out of date.
- Under sources list the TYPES of sources a reader should verify against (e.g. "Industry reports from Gartner or McKinsey"). Never fabricate URLs, titles or statistics presented as verified.
Expected output format: strict JSON {"overview": string, "sections": [{"heading": string, "points": string[]}], "recommendations": string[], "sources": string[]}.
Tone: analytical, objective, professional.
${SAFETY_CONSTRAINTS}`;

    const raw = await callAi(system, `Research request: ${data.topic}\nRequested output: ${data.mode}`);
    const parsed = parseJson<ResearchResult>(raw, {
      overview: raw,
      sections: [],
      recommendations: [],
      sources: [],
    });
    return {
      overview: parsed.overview || raw,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  });

/* ---------------------------------- Chat ---------------------------------- */

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        messages: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const system = `Role: You are Aria, an AI workplace productivity assistant inside a business SaaS app.
Task: Help the user with email writing, meeting notes, planning, prioritisation and workplace research.
Context: The user is a busy professional. They can also use dedicated tools in this app for email, meeting notes, task planning and research.
Instructions:
- Answer directly and practically. Use short paragraphs, bullet lists and bold headers where useful.
- Ask a clarifying question only when the request is genuinely ambiguous.
- Keep answers under roughly 250 words unless the user asks for more.
Tone: warm, professional, confident.
${SAFETY_CONSTRAINTS.replace("- Return ONLY the requested output format with no extra commentary.", "- Never claim access to the user's real inbox, calendar or files.")}`;

    const transcript = data.messages
      .slice(-12)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const reply = await callAi(system, `${transcript}\n\nAssistant:`);
    return { reply };
  });
