import { z as zod } from "zod";

const ObjectIdSchema = zod
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const QuestionSchema = zod
  .object({
    question: zod
      .string()
      .min(2, "Question must be at least 2 characters")
      .max(500, "Question must be at most 500 characters")
      .trim(),
    type: zod.enum(["MCQ", "TEXT"]).default("MCQ"),
    options: zod.array(zod.string().trim().min(1)).optional().default([]),
    correctAnswer: zod.string().trim().optional(),
    marks: zod.number().min(1).default(1),
  })
  .superRefine((q, ctx) => {
    if (q.type === "MCQ") {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "MCQ questions must have at least 2 options",
          path: ["options"],
        });
      }
      if (!q.correctAnswer) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "MCQ questions must have a correctAnswer",
          path: ["correctAnswer"],
        });
      } else if (q.options && !q.options.includes(q.correctAnswer)) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "correctAnswer must be one of the provided options",
          path: ["correctAnswer"],
        });
      }
    }
  });

export const CreateAssessmentValidationSchema = zod.object({
  name: zod
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  questions: zod.array(QuestionSchema).min(1, "At least one question is required"),
  passingScore: zod.number().min(0).max(100).default(70),
  reviewer: ObjectIdSchema.optional().nullable(),
});

export const UpdateAssessmentValidationSchema = zod.object({
  name: zod
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  questions: zod.array(QuestionSchema).min(1).optional(),
  passingScore: zod.number().min(0).max(100).optional(),
  reviewer: ObjectIdSchema.optional().nullable(),
});
