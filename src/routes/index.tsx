import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  NotebookPen,
  CalendarClock,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppState, timeAgo } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Track AI-assisted emails, meeting summaries, tasks and research from one professional productivity dashboard.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Write emails, summarise meetings, plan tasks and research faster with AI.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  { to: "/email", label: "Smart Email Generator", desc: "Draft professional emails in seconds.", icon: Mail },
  { to: "/meetings", label: "Meeting Notes Summarizer", desc: "Turn raw notes into clear minutes.", icon: NotebookPen },
  { to: "/planner", label: "AI Task Planner", desc: "Build a realistic daily schedule.", icon: CalendarClock },
  { to: "/research", label: "Research Assistant", desc: "Get structured briefings fast.", icon: Search },
  { to: "/chat", label: "AI Workplace Chatbot", desc: "Ask anything about your workday.", icon: MessageSquare },
] as const;

function Dashboard() {
  const s = useAppState();
  const open = s.tasks.filter((t) => !t.done);
  const done = s.tasks.length - open.length;
  const pct = s.tasks.length ? Math.round((done / s.tasks.length) * 100) : 0;

  const stats = [
    { label: "Emails generated", value: s.emailsGenerated, icon: Mail },
    { label: "Meetings summarised", value: s.meetingsSummarized, icon: NotebookPen },
    { label: "Research briefings", value: s.researchRuns, icon: Search },
    { label: "Open tasks", value: open.length, icon: CalendarClock },
  ];

  return (
    <>
      <PageHeader
        title="Good day, Alex"
        description="Here's what your AI assistant has been working on."
      />
      <AiDisclaimer />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-card">
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>AI tools</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ to, label, desc, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-brand hover:bg-brand-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="truncate">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Task progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {done} of {s.tasks.length} complete
                </span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <Progress value={pct} className="mt-2" />
            </div>
            <ul className="space-y-2">
              {open.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <Badge variant={t.priority === "High" ? "default" : "secondary"}>
                    {t.priority}
                  </Badge>
                </li>
              ))}
              {open.length === 0 && (
                <li className="text-sm text-muted-foreground">Everything is done. Nice work.</li>
              )}
            </ul>
            <Link
              to="/planner"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Open task planner <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {s.activity.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.tool}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
