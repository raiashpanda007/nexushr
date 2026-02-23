import { z as zod } from "zod";

export const OfflineQueueValidationSchema = zod.array(
    zod.object({
        id: zod.string().min(1).trim(),
        type: zod.enum(["IN", "OUT"]),
        createdAt: zod.coerce.date()
    })
)