import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, RefreshCw, Send, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAssistant } from "@/lib/ai.functions";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chatbot | Workplace AI" },
      {
        name: "description",
        content:
          "Chat with Aria, your AI workplace assistant, about emails, meetings, priorities and workplace questions.",
      },
      { property: "og:title", content: "AI Workplace Chatbot" },
      { property: "og:description", content: "Ask Aria anything about your working day." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Help me say no to a meeting politely",
  "How should I prioritise a day with three deadlines?",
  "Draft talking points for a project delay update",
];

const uid = () => Math.random().toString(36).slice(2, 10);

function ChatPage() {
  const s = useAppState();
  const run = useServerFn(chatWithAssistant);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [s.chat, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  async function send(text: string, history = s.chat) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...history, { id: uid(), role: "user" as const, content: trimmed }];
    actions.setChat(next);
    setInput("");
    setLoading(true);
    try {
      const res = await run({
        data: { messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      actions.setChat([...next, { id: uid(), role: "assistant" as const, content: res.reply }]);
    } catch (e) {
      actions.setChat(next);
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function regenerate() {
    const lastUser = [...s.chat].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const idx = s.chat.findIndex((m) => m.id === lastUser.id);
    void send(lastUser.content, s.chat.slice(0, idx));
  }

  return (
    <>
      <PageHeader
        title="AI Workplace Chatbot"
        description="Aria helps with writing, planning and workplace questions."
        action={
          s.chat.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => actions.setChat([])}>
              <Trash2 className="h-4 w-4" />
              Clear chat
            </Button>
          ) : undefined
        }
      />
      <AiDisclaimer />

      <Card className="flex h-[70vh] flex-col overflow-hidden shadow-card">
        <div ref={boxRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {s.chat.length === 0 && !loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-brand-foreground">
                <Bot className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-lg font-bold">Hi, I'm Aria</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ask me to draft something, unpack a decision, or plan your day.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((q) => (
                  <Button key={q} variant="outline" size="sm" onClick={() => void send(q)}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {s.chat.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      m.role === "user"
                        ? "bg-muted text-muted-foreground"
                        : "bg-brand text-brand-foreground"
                    }`}
                  >
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {m.role === "user" ? "You" : "Aria"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    {m.role === "assistant" && (
                      <div className="mt-2 flex gap-2">
                        <CopyButton text={m.content} />
                        <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading}>
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
                    <Bot className="h-4 w-4" />
                  </span>
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Aria is thinking...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <CardContent className="border-t border-border p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask Aria anything about your work..."
              className="max-h-40 min-h-11 resize-none"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
