import axios from "axios";
import fs from "fs";
import path from "path";

async function DownloadFile(fileUrl, UserId, OpeningId) {
  try {
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

    if (!fs.existsSync("./resumes")) {
      fs.mkdirSync("./resumes");
    }

    let extension = "";

    const contentType = response.headers["content-type"];
    if (contentType) {
      extension = contentType.split("/")[1];
    }

    if (!extension) {
      extension = path.extname(fileUrl).replace(".", "");
    }

    const filePath = `./resumes/${UserId}_${OpeningId}.${extension}`;

    fs.writeFileSync(filePath, response.data);

    console.log(`File downloaded successfully to ${filePath}`);

    return filePath;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

export default DownloadFile;
