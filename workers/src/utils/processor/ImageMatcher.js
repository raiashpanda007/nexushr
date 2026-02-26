import faceapi from "@vladmandic/face-api";
import canvas from "canvas";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
 const modelPath = path.join(__dirname, "models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  modelsLoaded = true;
  console.log(" Models loaded");
}

async function getDescriptor(imagePath) {
  const img = await canvas.loadImage(imagePath);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) throw new Error(`No face detected in: ${imagePath}`);
  return detection.descriptor;
}

async function MatchFaces(registeredImagePath, punchImagePath) {
  await loadModels();

  const [registeredDescriptor, punchDescriptor] = await Promise.all([
    getDescriptor(registeredImagePath),
    getDescriptor(punchImagePath),
  ]);

  const distance = faceapi.euclideanDistance(registeredDescriptor, punchDescriptor);

  return {
    match: distance < 0.6,
    status: distance < 0.6 ? true : false,
    distance: parseFloat(distance.toFixed(4)),
  };
}


export default MatchFaces;