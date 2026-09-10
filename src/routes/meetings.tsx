import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, NotebookPen, RefreshCw, Sparkle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { summarizeMeeting, type MeetingResult } from "@/lib/ai.functions";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Workplace AI" },
      {
        name: "description",
        content:
          "Paste raw meeting notes and get a clear summary, the decisions made and assigned action items.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      { property: "og:description", content: "Turn messy meeting notes into clear minutes." },
    ],
  }),
  component: MeetingsPage,
});

const SAMPLE = `Q3 planning stand-up, 40 mins, product + marketing.
Dana said onboarding drop-off is at 38%, worst on step 3.
We agreed to rebuild step 3 before the launch.
Marketing wants the launch pushed to 15 Oct - agreed.
Sam to run 5 user interviews by next Friday.
Priya will draft the new pricing page copy, no date set yet.
Open question: do we keep the free trial at 14 days?`;

function MeetingsPage() {
  const run = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingResult | null>(null);

  async function summarize() {
    if (notes.trim().length < 20) {
      toast.error("Paste at least a couple of lines of meeting notes.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { notes } });
      setResult(res);
      actions.countMeeting();
      actions.logActivity("Meeting Notes", res.summary.slice(0, 60));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const copyText = result
    ? [
        `Summary\n${result.summary}`,
        `\nDecisions\n${result.decisions.map((d) => `- ${d}`).join("\n") || "- None recorded"}`,
        `\nAction items\n${
          result.actionItems.map((a) => `- ${a.task} (${a.owner}, ${a.deadline})`).join("\n") ||
          "- None recorded"
        }`,
      ].join("\n")
    : "";

  return (
    <>
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Turn messy notes into structured minutes with owners and deadlines."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Raw notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setNotes(SAMPLE)}>
              Use sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={14}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste everything that was said, in any order..."
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={summarize} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkle className="h-4 w-4" />
                )}
                {loading ? "Summarising..." : "Summarise notes"}
              </Button>
              {result && !loading && (
                <Button variant="outline" onClick={summarize}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
              {(notes || result) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNotes("");
                    setResult(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Minutes</CardTitle>
            {result && <CopyButton text={copyText} label="Copy minutes" />}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : result ? (
              <div className="space-y-5 text-sm">
                <section>
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </h3>
                  <p className="leading-relaxed">{result.summary}</p>
                </section>
                <section>
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Decisions
                  </h3>
                  {result.decisions.length ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {result.decisions.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No decisions recorded.</p>
                  )}
                </section>
                <section>
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Action items
                  </h3>
                  {result.actionItems.length ? (
                    <ul className="space-y-2">
                      {result.actionItems.map((a, i) => (
                        <li key={i} className="rounded-lg border border-border p-3">
                          <p className="font-medium">{a.task}</p>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <Badge variant="secondary">{a.owner}</Badge>
                            <Badge variant="outline">{a.deadline}</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No action items recorded.</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <NotebookPen className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your structured minutes will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
