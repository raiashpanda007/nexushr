import mongoose from "mongoose";
import ApiError from "../utils/Error.js";
import ApiResponse from "../utils/Response.js";

const mongodbErrorHandler = (err) => {
  let error = err;

  // 1. Duplicate Key Error (E11000)
  // When trying to insert/update a document with a duplicate unique field
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return new ApiError(409, message, [
      { field, message, code: "DUPLICATE_KEY" }
    ]);
  }

  // 2. Validation Error
  // When fields don't match schema requirements
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
      code: "VALIDATION_FAILED"
    }));
    return new ApiError(400, "Validation failed", errors);
  }

  // 3. Cast Error
  // When ObjectId format is invalid
  if (err instanceof mongoose.Error.CastError) {
    const message = `Invalid ${err.kind} format for ${err.path}`;
    return new ApiError(400, message, [
      { field: err.path, message, code: "INVALID_ID" }
    ]);
  }

  // 4. Mongoose Strict Mode Error
  // When extra fields are passed in strict mode
  if (err.name === "StrictModeError") {
    const message = `Field "${err.path}" is not allowed in this model`;
    return new ApiError(400, message, [
      { field: err.path, message, code: "STRICT_MODE" }
    ]);
  }

  // 5. JSON Parse Error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return new ApiError(400, "Invalid JSON", [
      { message: "Request body contains invalid JSON", code: "INVALID_JSON" }
    ]);
  }

  // Generic MongoDB error
  if (err instanceof mongoose.Error) {
    return new ApiError(400, err.message, [], err.stack);
  }

  return error;
};

const errorHandler = (err, req, res, next) => {
  console.log("Error :: ", err);
  let error = err;

  // Check if it's a MongoDB/Mongoose error
  const isMongoError = 
    err.name === "MongoError" ||
    err.name === "MongoServerError" ||
    err instanceof mongoose.Error ||
    err.code === 11000 ||
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.name === "StrictModeError";

  if (isMongoError) {
    error = mongodbErrorHandler(err);
  }

  // Convert to ApiError if needed
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";

    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Build response
  const response = new ApiResponse(
    error.statusCode,
    null,
    error.message,
    error?.errors || []
  );

  // Add stack in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return res.status(error.statusCode).json(response);
};

export { errorHandler, mongodbErrorHandler };