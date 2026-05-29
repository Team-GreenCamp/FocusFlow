import { z } from "zod";

export const taskStepOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimateMinutes: z.number().int().min(1),
});

export const roadmapOutputSchema = z.object({
  steps: z.array(taskStepOutputSchema).min(3).max(8),
});

export const breakdownOutputSchema = z.object({
  steps: z.array(taskStepOutputSchema).min(2).max(6),
});

export const reflectionOutputSchema = z.object({
  markdown: z.string().min(20),
});

export type TaskStepOutput = z.infer<typeof taskStepOutputSchema>;
export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;
export type BreakdownOutput = z.infer<typeof breakdownOutputSchema>;

export type TaskStatus = "LOCKED" | "ACTIVE" | "DONE";

export type RoadmapStep = {
  id: string;
  goalId: string;
  parentStepId: string | null;
  order: number;
  title: string;
  description: string;
  status: TaskStatus;
  completedAt: string | null;
  memo: string | null;
  googleEventId: string | null;
};

export type RoadmapGoal = {
  id: string;
  title: string;
  description: string | null;
  googleEventId: string | null;
  steps: RoadmapStep[];
};

export type ReflectionSummary = {
  id: string;
  goalId: string | null;
  goalTitle: string | null;
  date: string;
  memo: string;
  markdown: string;
  createdAt: string;
};
