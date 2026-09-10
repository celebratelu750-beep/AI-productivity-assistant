import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, RefreshCw, Search, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runResearch, type ResearchResult } from "@/lib/ai.functions";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Workplace AI" },
      {
        name: "description",
        content:
          "Ask a work question and get a structured briefing with themes, insights and recommended actions.",
      },
      { property: "og:title", content: "AI Research Assistant" },
      { property: "og:description", content: "Structured workplace research briefings in seconds." },
    ],
  }),
  component: ResearchPage,
});

const MODES = ["Quick summary", "Detailed summary", "Key insights", "Recommendations"];

function ResearchPage() {
  const run = useServerFn(runResearch);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<string>("Detailed summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);

  async function go() {
    if (topic.trim().length < 3) {
      toast.error("Type a research question first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { topic, mode } });
      setResult(res);
      actions.countResearch();
      actions.logActivity("Research Assistant", topic.slice(0, 60));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const copyText = result
    ? [
        result.overview,
        ...result.sections.map((s) => `\n${s.heading}\n${s.points.map((p) => `- ${p}`).join("\n")}`),
        result.recommendations.length
          ? `\nRecommendations\n${result.recommendations.map((r) => `- ${r}`).join("\n")}`
          : "",
        result.sources.length ? `\nVerify against\n${result.sources.map((s) => `- ${s}`).join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <>
      <PageHeader
        title="AI Research Assistant"
        description="Get a structured briefing on any workplace topic."
      />
      <AiDisclaimer />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Research request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">What do you want to know?</Label>
            <Textarea
              id="topic"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="How are mid-sized companies measuring hybrid work productivity?"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-2">
              <Label>Output style</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={go} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkle className="h-4 w-4" />}
              {loading ? "Researching..." : "Run research"}
            </Button>
            {result && !loading && (
              <Button variant="outline" onClick={go}>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Briefing</CardTitle>
          {result && <CopyButton text={copyText} label="Copy briefing" />}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : result ? (
            <div className="space-y-5 text-sm">
              <p className="leading-relaxed">{result.overview}</p>
              {result.sections.map((s, i) => (
                <section key={i}>
                  <h3 className="mb-1.5 font-semibold text-brand">{s.heading}</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {s.points.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </section>
              ))}
              {result.recommendations.length > 0 && (
                <section className="rounded-lg bg-brand-soft p-3">
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Recommendations
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {result.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              )}
              {result.sources.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Verify against
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {result.sources.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Your briefing will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
