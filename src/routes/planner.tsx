import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Loader2, Plus, RefreshCw, Sparkle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planTasks, type PlanResult } from "@/lib/ai.functions";
import { actions, useAppState, type Priority } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | Workplace AI" },
      {
        name: "description",
        content:
          "Add your tasks, priorities and deadlines and let AI build a realistic daily or weekly schedule.",
      },
      { property: "og:title", content: "AI Task Planner" },
      { property: "og:description", content: "Turn your task list into a realistic schedule." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const s = useAppState();
  const run = useServerFn(planTasks);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [deadline, setDeadline] = useState("");
  const [estimate, setEstimate] = useState("");
  const [horizon, setHorizon] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);

  function add() {
    if (!name.trim()) {
      toast.error("Give the task a name first.");
      return;
    }
    actions.addTask({ name: name.trim(), priority, deadline, estimate });
    setName("");
    setDeadline("");
    setEstimate("");
    toast.success("Task added");
  }

  async function generate() {
    const open = s.tasks.filter((t) => !t.done);
    if (!open.length) {
      toast.error("Add at least one open task before generating a schedule.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({
        data: {
          horizon,
          tasks: open.map((t) => ({
            name: t.name,
            priority: t.priority,
            deadline: t.deadline,
            estimate: t.estimate,
          })),
        },
      });
      setPlan(res);
      actions.logActivity("Task Planner", `${horizon === "daily" ? "Daily" : "Weekly"} schedule generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const copyText = plan
    ? plan.schedule
        .map((b) => `${b.block}\n${b.items.map((i) => `- ${i}`).join("\n")}`)
        .join("\n\n") + (plan.advice.length ? `\n\nTips\n${plan.advice.map((a) => `- ${a}`).join("\n")}` : "")
    : "";

  return (
    <>
      <PageHeader
        title="AI Task Planner"
        description="Capture your work, then let AI turn it into a realistic schedule."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="task">Task</Label>
                <Input
                  id="task"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="Draft the client onboarding deck"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["High", "Medium", "Low"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="estimate">Estimated time</Label>
                <Input
                  id="estimate"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="1h 30m"
                />
              </div>
            </div>
            <Button variant="outline" onClick={add} className="w-full">
              <Plus className="h-4 w-4" />
              Add task
            </Button>

            <ul className="divide-y divide-border">
              {s.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <Checkbox
                    checked={t.done}
                    onCheckedChange={() => actions.toggleTask(t.id)}
                    aria-label={`Mark ${t.name} as done`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        t.done ? "truncate text-sm text-muted-foreground line-through" : "truncate text-sm font-medium"
                      }
                    >
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.deadline || "No deadline"} · {t.estimate || "No estimate"}
                    </p>
                  </div>
                  <Badge variant={t.priority === "High" ? "default" : "secondary"} className="shrink-0">
                    {t.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove task"
                    onClick={() => actions.removeTask(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
              {!s.tasks.length && (
                <li className="py-6 text-center text-sm text-muted-foreground">No tasks yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Schedule</CardTitle>
            {plan && <CopyButton text={copyText} label="Copy plan" />}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1 space-y-2">
                <Label>Plan for</Label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Today</SelectItem>
                    <SelectItem value="weekly">This week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkle className="h-4 w-4" />}
                {loading ? "Planning..." : "Generate schedule"}
              </Button>
              {plan && !loading && (
                <Button variant="outline" onClick={generate}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : plan ? (
              <div className="space-y-4 text-sm">
                {plan.schedule.map((b, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <p className="font-semibold text-brand">{b.block}</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5">
                      {b.items.map((it, j) => (
                        <li key={j}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {plan.advice.length > 0 && (
                  <div className="rounded-lg bg-brand-soft p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Tips
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5">
                      {plan.advice.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Generate a schedule to see your day laid out.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
