import axios from "axios";
import { Cfg } from "../config/env.js";

class ZoomService {
  constructor() {
    this.clientId = Cfg.ZOOM_CLIENT_ID;
    this.clientSecret = Cfg.ZOOM_CLIENT_SECRET;
    this.accountId = Cfg.ZOOM_ACCOUNT_ID;
    this.token = Cfg.ZOOM_SECRET_TOKEN;
    this.apiBaseUrl = "https://api.zoom.us/v2";
    this.settings = {
      approval_type: 0,
      registration_type: 2, 
      join_before_host: true,
    };
  }
  async #getAccessToken() {
    try {
      const authToken = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString("base64");
      const response = await axios.post(
        "https://zoom.us/oauth/token",
        new URLSearchParams({
          grant_type: "account_credentials",
          account_id: this.accountId,
        }),
        {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      return response.data.access_token;
    } catch (error) {
      console.error(
        "Error fetching Zoom access token:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to authenticate with Zoom API");
    }
  }
  async UpdateMeeting(meetingId, { topic, startTime } = {}) {
    try {
      const token = await this.#getAccessToken();
      const payload = {};
      if (topic) payload.topic = topic;
      if (startTime) payload.start_time = new Date(startTime).toISOString();
      await axios.patch(
        `${this.apiBaseUrl}/meetings/${meetingId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error(
        "Error updating Zoom meeting:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to update Zoom meeting");
    }
  }

  async CreateMeeting(topic, startTime) {
    try {
      const token = await this.#getAccessToken();
      const response = await axios.post(
        `${this.apiBaseUrl}/users/me/meetings`,
        {
          topic,
          type: 2, // Scheduled meeting
          start_time: new Date(startTime).toISOString(),
          settings: {
            join_before_host: true,
            participant_video: true,
            host_video: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const meetingData = response.data;

      return {
        joinUrl: meetingData.join_url,
        meetingId: meetingData.id,
        topic: meetingData.topic,
        startTime: meetingData.start_time,
      };
    } catch (error) {
      console.error(
        "Error creating Zoom meeting:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to create Zoom meeting");
    }
  }
}

export default ZoomService;
