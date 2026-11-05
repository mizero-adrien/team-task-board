import { z } from "zod";
import { isValidDateString, todayString } from "../utils/dates";

export const breakdownSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(3, "Describe your goal in at least 3 characters")
    .max(500, "The goal must be at most 500 characters"),
  deadline: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => value === undefined || isValidDateString(value),
      "Deadline must be a real date in YYYY-MM-DD format"
    )
    .refine(
      (value) => value === undefined || value >= todayString(),
      "Deadline cannot be in the past"
    ),
});

export type BreakdownBody = z.infer<typeof breakdownSchema>;
