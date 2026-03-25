import mongoose from "mongoose";


const VideoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      require: true
    },
    versions: [
      {
        "240p": {
          type: String
        },
        "360p": {
          type: String
        },
        "720p": {
          type: String
        },
        "1080p": {
          type: String
        },
        "default": {
          type: String
        }
      }
    ],
    metadata: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true
  }
)


const VideosModel = mongoose.model("Videos", VideoSchema);

export default VideosModel;
