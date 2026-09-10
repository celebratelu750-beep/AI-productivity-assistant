import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Mail, RefreshCw, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, PageHeader } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { generateEmail, type EmailResult } from "@/lib/ai.functions";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Workplace AI" },
      {
        name: "description",
        content:
          "Generate polished, professional work emails with the right tone and length in seconds.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      { property: "og:description", content: "Write professional work emails with AI." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive", "Apologetic", "Direct"];
const LENGTHS = ["Short", "Medium", "Long"];
const RECIPIENTS = ["Manager", "Client", "Team member", "Vendor", "New contact"];

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [details, setDetails] = useState("");
  const [recipient, setRecipient] = useState("Client");
  const [tone, setTone] = useState("Formal");
  const [length, setLength] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);

  async function generate() {
    if (purpose.trim().length < 3) {
      toast.error("Tell the assistant what the email is about first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { purpose, details, recipient, tone, length } });
      setResult(res);
      actions.countEmail();
      actions.logActivity("Smart Email", res.subject);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const full = result ? `Subject: ${result.subject}\n\n${result.body}` : "";

  return (
    <>
      <PageHeader
        title="Smart Email Generator"
        description="Describe the email you need and get a polished draft."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Email brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">What is the email about?</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Follow up on the Q3 proposal we sent last week"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Extra details (optional)</Label>
              <Textarea
                id="details"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mention the revised pricing and ask for a call on Thursday."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Recipient" value={recipient} onChange={setRecipient} options={RECIPIENTS} />
              <Field label="Tone" value={tone} onChange={setTone} options={TONES} />
              <Field label="Length" value={length} onChange={setLength} options={LENGTHS} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkle className="h-4 w-4" />
                )}
                {loading ? "Writing..." : "Generate email"}
              </Button>
              {result && !loading && (
                <Button variant="outline" onClick={generate}>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Draft</CardTitle>
            {result && <CopyButton text={full} label="Copy email" />}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : result ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold">
                  {result.subject}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.body}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Mail className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your generated email will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
