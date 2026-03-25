import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "ap-south-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
  requestChecksumCalculation: "when_required",
  responseChecksumValidation: "when_required",
});