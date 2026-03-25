import { z as zod } from "zod";

const ObjectIdSchema = zod
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const SubmitAssessmentValidationSchema = zod.object({
  lessonId:     ObjectIdSchema,
  chapterId:    ObjectIdSchema,
  assessmentId: ObjectIdSchema,
  answers: zod
    .array(
      zod.object({
        questionId: ObjectIdSchema,
        answer: zod.string().trim().min(1, "Answer cannot be empty"),
      })
    )
    .min(1, "At least one answer is required"),
});

export const ReviewTextAnswersValidationSchema = zod.object({
  userId:    ObjectIdSchema,
  lessonId:  ObjectIdSchema,
  chapterId: ObjectIdSchema,
  textScores: zod
    .array(
      zod.object({
        questionId: ObjectIdSchema,
        score: zod.number().int().min(0, "Score cannot be negative"),
      })
    )
    .min(1, "At least one text score is required"),
  note: zod.string().trim().max(500).optional(),
});
