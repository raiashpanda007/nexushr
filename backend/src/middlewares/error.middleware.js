import mongoose from "mongoose";
import ApiError from "../utils/Error.js";
import ApiResponse from "../utils/Response.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode =
            error.statusCode || (error instanceof mongoose.Error ? 400 : 500);

        const message = error.message || "Something went wrong";


        error = new ApiError(
            statusCode,
            message,
            error?.errors || [],
            err.stack
        );
    }

    const response = new ApiResponse(
        error.statusCode,
        null,
        error.message,
        error?.errors || []
    );

    if (process.env.NODE_ENV === "development") {
        response.stack = error.stack;
    }
    return res.status(error.statusCode).json(response);
};

export { errorHandler };
