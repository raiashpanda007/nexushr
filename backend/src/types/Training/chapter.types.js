import { z as zod } from "zod";

const ObjectIdSchema = zod
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const ResourceNameSchema = zod
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 50 characters")
  .trim();

const ResourceUrlSchema = zod.string().trim().url("Please provide a valid URL");

const ChapterResourceWithUrlSchema = zod.object({
  name: ResourceNameSchema,
  url: ResourceUrlSchema,
});

const ChapterTextResourceSchema = zod.object({
  name: ResourceNameSchema,
  content: zod
    .string()
    .min(2, "Content must be at least 2 characters")
    .max(5000, "Content must be at most 5000 characters")
    .trim(),
});

const ChapterLinkResourceSchema = zod.object({
  name: ResourceNameSchema,
  link: ResourceUrlSchema,
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

const AssessmentRefSchema = zod.object({
  assessmentId: ObjectIdSchema,
});

export const CreateChapterValidationSchema = zod.object({
  lessonId: ObjectIdSchema,
  name: zod
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  description: zod
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(1000, "Description must be at most 1000 characters")
    .trim(),
  rank: zod.number().int().min(1).optional(),
  pdfResources: zod.array(ChapterResourceWithUrlSchema).optional().default([]),
  docxResources: zod.array(ChapterResourceWithUrlSchema).optional().default([]),
  textResources: zod.array(ChapterTextResourceSchema).optional().default([]),
  linkResources: zod.array(ChapterLinkResourceSchema).optional().default([]),
  videoLecture: VideoLectureSchema.optional().nullable(),
  assessments: zod.array(AssessmentRefSchema).optional().default([]),
});

export const UpdateChapterValidationSchema = zod.object({
  name: zod
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  description: zod
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(1000, "Description must be at most 1000 characters")
    .trim()
    .optional(),
  pdfResources: zod.array(ChapterResourceWithUrlSchema).optional(),
  docxResources: zod.array(ChapterResourceWithUrlSchema).optional(),
  textResources: zod.array(ChapterTextResourceSchema).optional(),
  linkResources: zod.array(ChapterLinkResourceSchema).optional(),
  videoLecture: VideoLectureSchema.optional().nullable(),
  assessments: zod.array(AssessmentRefSchema).optional(),
});

export const MarkOpenedValidationSchema = zod.object({
  lessonId: ObjectIdSchema,
});
