class ApiError extends Error {
  private statusCode: number;
  private data: any;
  override message: string
  private success: boolean
  private errors: any[]
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors = [],
    stack: string = ""
  ) {
    super(message)
    this.statusCode = statusCode;
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors


    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}



export default ApiError;
