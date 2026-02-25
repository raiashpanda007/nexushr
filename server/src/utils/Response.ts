class Response<T> {
    public statusCode: number;
    public message: string;
    public data: T | null;
    public success: boolean;
  
    constructor(statusCode: number, message: string = "Success", data: T | null = null) {
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
      this.success = statusCode < 400;
    }
  }
  
  export default Response;