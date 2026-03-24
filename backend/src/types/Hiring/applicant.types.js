import {z as zod}   from "zod";

export const CreateApplicantValidationSchema = zod.object({
    name: zod.string().min(1, "Please provide a name").trim(),
    email: zod.string().email("Please provide a valid email").trim(),
    phone: zod.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits with no spaces or special characters").trim(),
    openingId: zod.string().trim(),
    resumeUrl: zod.string().url("Please provide a valid URL").optional(),
    questions: zod.array(
        zod.object({
            questionId: zod.string().trim(),
            answer: zod.string().trim().optional(),
        })
    ).optional(),
});

export const UpdateApplicantValidationSchema = zod.object({
    status: zod.enum(["APPLIED", "INTERVIEWING", "OFFERED", "REJECTED"]).optional(),
    note: zod.string().trim().optional(),
    currentRound: zod.string().trim().optional(),
});

export const SendOfferValidationSchema = zod.object({
    subject: zod.string().trim().min(1, "Please provide a subject").optional(),
    message: zod.string().trim().min(1, "Please provide a message"),
    attachmentUrl: zod.string().url("Invalid attachment URL").optional(),
});