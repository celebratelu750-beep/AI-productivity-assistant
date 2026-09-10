import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Review how your workspace data is stored and reset your AI Workplace Productivity Assistant workspace.",
      },
      { property: "og:title", content: "Workspace settings" },
      { property: "og:description", content: "Manage your workspace data and AI usage guidance." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useAppState();

  return (
    <>
      <PageHeader title="Settings" description="Your workspace, data and responsible AI guidance." />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Workspace summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Emails generated", s.emailsGenerated],
              ["Meetings summarised", s.meetingsSummarized],
              ["Research briefings", s.researchRuns],
              ["Tasks tracked", s.tasks.length],
              ["Chat messages", s.chat.length],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
            <Separator />
            <p className="text-muted-foreground">
              Everything is saved privately in this browser only. Nothing is uploaded to an account.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                actions.resetAll();
                toast.success("Workspace reset to sample data");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Reset workspace
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" />
              Responsible AI use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This assistant produces suggestions, not verified facts. Review every draft before you
              send, share or act on it.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Do not paste confidential client data, passwords or personal records.</li>
              <li>Check names, dates, figures and commitments against your own records.</li>
              <li>Treat research output as a starting point and verify against real sources.</li>
              <li>Keep a human decision-maker responsible for anything sent externally.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
