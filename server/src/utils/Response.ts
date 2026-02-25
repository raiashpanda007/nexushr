class ApiResponse {
    public statusCode: number;
    public message: string;
    public data: any | null;
    public success: boolean;
    public errors: any[];
  
    constructor(statusCode: number, data: any | null = null, message = "Success", errors = []) {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
    this.errors = errors
  }
  }
  
  export default ApiResponse;