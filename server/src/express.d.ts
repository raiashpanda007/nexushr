import "express"; 

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      }
      files?: {
        [fieldname: string]: Express.Multer.File[]; // Handle multiple file fields
      };
    }
  }
}
