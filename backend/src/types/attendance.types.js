import { z as zod } from "zod";

export const CreateAttendanceValidationSchema = zod.object({
    userId: zod.string().min(1, "User ID is required"),
    type: zod.enum(["IN", "OUT"]),
});

