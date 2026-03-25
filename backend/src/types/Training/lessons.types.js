import { z as zod } from "zod";

const ObjectIdSchema = zod
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const ResourceNameSchema = zod
  .string()
  .min(2, "Name should be atleast of 2 letters")
  .max(50, "Name should be atmost 50 letters")
  .trim();

const ResourceUrlSchema = zod
  .string()
  .trim()
  .url("Please provide a valid URL");

const ChapterResourceWithUrlSchema = zod.object({
  name: ResourceNameSchema,
  url: ResourceUrlSchema,
});

const ChapterTextResourceSchema = zod.object({
  name: ResourceNameSchema,
  content: zod
    .string()
    .min(2, "Content should be atleast of 2 letters")
    .max(5000, "Content should be atmost 5000 letters")
    .trim(),
});

const ChapterLinkResourceSchema = zod.object({
  name: ResourceNameSchema,
  link: ResourceUrlSchema,
});

const ChapterAssessmentSchema = zod.object({
  assessmentId: ObjectIdSchema,
  status: zod.enum(["not_given", "in_progress", "completed"]).optional(),
});


const VideoVersionSchema = zod.union([
  zod.string().trim().url("Please provide a valid URL"),
  zod.object({
    quality: zod.string().trim(),
    url: zod.string().trim().url("Please provide a valid URL"),
  }),
]);

const VideoLectureSchema = zod
  .object({
    name: ResourceNameSchema,
    url: zod.string().trim().url("Please provide a valid URL").optional(),
    versions: zod.array(VideoVersionSchema).min(1).optional(),
    metadata: zod.string().trim().optional(),
  })
  .refine((val) => Boolean(val.url || (val.versions && val.versions.length)), {
    message: "Video URL is required",
    path: ["url"],
  });

const ChapterSchema = zod.object({
  name: ResourceNameSchema,
  description: zod
    .string()
    .min(2, "Description should be atleast of 2 letters")
    .max(1000, "Description should be atmost 1000 letters")
    .trim(),
  pdfResources: zod.array(ChapterResourceWithUrlSchema).optional().default([]),
  docxResources: zod.array(ChapterResourceWithUrlSchema).optional().default([]),
  textResources: zod.array(ChapterTextResourceSchema).optional().default([]),
  linkResources: zod.array(ChapterLinkResourceSchema).optional().default([]),
  videoLecture: VideoLectureSchema.optional().nullable(),
  assessments: zod.array(ChapterAssessmentSchema).optional().default([]),
});

export const CreateLessonValidationSchema = zod.object({
  name: zod
    .string()
    .min(2, "Name should be atleast of 2 letters")
    .max(50, "Name should be atmost 50 letters")
    .trim(),
  description: zod
    .string()
    .min(2, "Description should be atleast of 2 letters")
    .max(1000, "Description should be atmost 1000 letters")
    .trim(),
  chapters: zod.array(ChapterSchema).optional().default([]),
});

export const UpdateLessonValidationSchema = zod.object({
  name: zod
    .string()
    .min(2, "Name should be atleast of 2 letters")
    .max(50, "Name should be atmost 50 letters")
    .trim()
    .optional(),
  description: zod
    .string()
    .min(2, "Description should be atleast of 2 letters")
    .max(1000, "Description should be atmost 1000 letters")
    .trim()
    .optional(),
  chapters: zod.array(ChapterSchema).optional().default([]),
});

// Kept for backward compatibility with existing imports.
export const CreateAssesmentValidationSchema = CreateLessonValidationSchema;
export const UpdateAssesmentValidationSchema = UpdateLessonValidationSchema;
