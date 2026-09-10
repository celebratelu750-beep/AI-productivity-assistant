import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Mail,
  NotebookPen,
  CalendarClock,
  Search,
  MessageSquare,
  Settings,
  Menu,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Smart Email", icon: Mail },
  { to: "/meetings", label: "Meeting Notes", icon: NotebookPen },
  { to: "/planner", label: "Task Planner", icon: CalendarClock },
  { to: "/research", label: "Research", icon: Search },
  { to: "/chat", label: "AI Chatbot", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "bg-brand text-brand-foreground hover:bg-brand" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
        <Bot className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold leading-tight">
          Workplace AI
        </span>
        <span className="block truncate text-xs text-muted-foreground">Productivity Assistant</span>
      </span>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function AiDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-brand-soft px-3 py-2.5 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <p>
        <span className="font-semibold text-foreground">Responsible AI:</span> content is generated
        by AI and may be inaccurate. Always review before sending, sharing or acting on it.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-7 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="pt-4 text-[11px] leading-relaxed text-muted-foreground">
          AI outputs are suggestions, not professional advice.
        </p>
      </aside>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="mt-6">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <Brand />
        </div>

        <main className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8")}>
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
