import { useEffect, useSyncExternalStore } from "react";

export type Priority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  name: string;
  priority: Priority;
  deadline: string;
  estimate: string;
  done: boolean;
};

export type Activity = {
  id: string;
  tool: string;
  title: string;
  at: number;
};

export type AppState = {
  emailsGenerated: number;
  meetingsSummarized: number;
  researchRuns: number;
  tasks: Task[];
  activity: Activity[];
  chat: { id: string; role: "user" | "assistant"; content: string }[];
};

const KEY = "awpa-state-v1";
const now = Date.now();
const hour = 3600_000;

const seed: AppState = {
  emailsGenerated: 24,
  meetingsSummarized: 11,
  researchRuns: 8,
  tasks: [
    {
      id: "t1",
      name: "Finalise Q3 client proposal",
      priority: "High",
      deadline: "2026-09-10",
      estimate: "2h",
      done: false,
    },
    {
      id: "t2",
      name: "Review onboarding survey results",
      priority: "Medium",
      deadline: "2026-09-11",
      estimate: "45m",
      done: false,
    },
    {
      id: "t3",
      name: "Prepare board meeting agenda",
      priority: "High",
      deadline: "2026-09-09",
      estimate: "1h",
      done: false,
    },
    {
      id: "t4",
      name: "Update team wiki documentation",
      priority: "Low",
      deadline: "2026-09-15",
      estimate: "30m",
      done: false,
    },
    {
      id: "t5",
      name: "Send weekly status report",
      priority: "Medium",
      deadline: "2026-09-08",
      estimate: "20m",
      done: true,
    },
  ],
  activity: [
    { id: "a1", tool: "Smart Email", title: "Follow-up email to Acme Corp", at: now - hour },
    { id: "a2", tool: "Meeting Notes", title: "Q3 planning stand-up summarised", at: now - 4 * hour },
    { id: "a3", tool: "Task Planner", title: "Daily schedule generated", at: now - 26 * hour },
    { id: "a4", tool: "Research Assistant", title: "Hybrid work productivity trends", at: now - 30 * hour },
  ],
  chat: [],
};

let state: AppState = seed;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...seed, ...(JSON.parse(raw) as AppState) };
  } catch {
    /* ignore */
  }
  emit();
}

function set(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

export function useAppState(): AppState {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => seed,
  );
  useEffect(() => hydrateStore(), []);
  return value;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const actions = {
  logActivity(tool: string, title: string) {
    set((s) => ({
      ...s,
      activity: [{ id: uid(), tool, title, at: Date.now() }, ...s.activity].slice(0, 20),
    }));
  },
  countEmail() {
    set((s) => ({ ...s, emailsGenerated: s.emailsGenerated + 1 }));
  },
  countMeeting() {
    set((s) => ({ ...s, meetingsSummarized: s.meetingsSummarized + 1 }));
  },
  countResearch() {
    set((s) => ({ ...s, researchRuns: s.researchRuns + 1 }));
  },
  addTask(task: Omit<Task, "id" | "done">) {
    set((s) => ({ ...s, tasks: [...s.tasks, { ...task, id: uid(), done: false }] }));
  },
  toggleTask(id: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  },
  removeTask(id: string) {
    set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  setChat(chat: AppState["chat"]) {
    set((s) => ({ ...s, chat }));
  },
  resetAll() {
    set(() => ({ ...seed, chat: [] }));
  },
};

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
