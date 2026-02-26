import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import SysConf from "../../conf/config.js";
const Config = new SysConf().MustLoad();
const S3_CLIENT = new S3Client({
  region: Config.AWS_REGION || "ap-south-1",
  endpoint: Config.S3_ENDPOINT || "http://localhost:4566",
  forcePathStyle: true,
});

async function DonwloadImage(bucketName, objectKey, userId) {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const response = await S3_CLIENT.send(getObjectCommand);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(chunks);

    const fileName = objectKey.split("/").pop();
    const dirPath = path.join("./downloads", userId);
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, fileBuffer);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

async function ImageProcessor(UserID, Bucket, ObjectKey, DbConnection) {
  console.log(
    `Processing image for UserID: ${UserID}, Bucket: ${Bucket}, ObjectKey: ${ObjectKey}`,
  );
  const userDetails = await DbConnection.findUserById(UserID);
  if (!userDetails) {
    console.error(`User with ID ${UserID} not found.`);
    return;
  }

  await DonwloadImage(Bucket, ObjectKey, UserID);
}

export default ImageProcessor;
