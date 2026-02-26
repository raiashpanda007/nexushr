import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import SysConf from "../../../conf/config.js";
import ImageMatcher from "../ImageMatcher.js";



const Config = new SysConf().MustLoad();
const S3_CLIENT = new S3Client({
  region: Config.AWS_REGION || "ap-south-1",
  endpoint: Config.S3_ENDPOINT || "http://localhost:4566",
  forcePathStyle: true,
});

async function DownloadImage(bucketName, objectKey, userId, baseDir) {
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
    const userDir = path.join(baseDir, userId);
    const filePath = path.join(userDir, fileName);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    fs.writeFileSync(filePath, fileBuffer);
    console.log(`File downloaded successfully to ${filePath}`);
    return filePath;
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

  console.log("User profile photo", userDetails.profilePhoto);

  
  const ProfilePhotoBucket = Config.AWS_PROFILE_PHOTO_BUCKET || "register-photos";
  let ProfilePhotoKey;
  if (userDetails.profilePhoto) {
    try {
      const url = new URL(userDetails.profilePhoto);
      
      const parts = url.pathname.split("/").filter(Boolean);
      ProfilePhotoKey = parts.slice(1).join("/"); 
    } catch {
      ProfilePhotoKey = userDetails.profilePhoto;
    }
  }

  let registeredPhotoPath = null;
  let punchPhotoPath = null;


  if (ProfilePhotoKey) {
    registeredPhotoPath = await DownloadImage(ProfilePhotoBucket, ProfilePhotoKey, UserID, "./registered");
  } else {
    console.warn(`No profile photo found for user ${UserID}, skipping registered photo download.`);
  }

  
  punchPhotoPath = await DownloadImage(Bucket, ObjectKey, UserID, "./punched");

  const matchResult = await ImageMatcher(registeredPhotoPath, punchPhotoPath);

  // Clean up downloaded images after processing
  for (const filePath of [registeredPhotoPath, punchPhotoPath]) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted processed image: ${filePath}`);
    }
  }

  return { matchResult };
}

export default ImageProcessor;
