import { z as zod } from "zod";

export const UpdateInterviewSchema = zod.object({
  reviewers: zod.array(zod.string()).optional(),
  feedback: zod.string().optional(),
  reviewDate: zod.string().optional(),
  grades: zod
    .array(
      zod.object({
        skillId: zod.string(),
        score: zod.number().min(1).max(5),
      }),
    )
    .optional(),
  result: zod.enum(["PASSED", "FAILED", "PENDING"]).optional(),
});

export const CreateInterviewSchema = zod.object({
  applicantId: zod.string(),
  roundId: zod.string(),
  reviewers: zod.array(zod.string()),
  feedback: zod.string().optional(),
  status: zod.enum(["SCHEDULED", "COMPLETED", "CANCELED"]).optional(),
  reviewDate: zod.string(),
  grades: zod
    .array(
      zod.object({
        skillId: zod.string(),
        score: zod.number().min(1).max(5),
      }),
    )
    .optional(),
  result: zod.enum(["PASSED", "FAILED", "PENDING"]).optional(),
});
