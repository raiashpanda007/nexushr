import { Cfg } from "../../config/env.js"


import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const ACCESS_SECRET = Cfg.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = Cfg.REFRESH_TOKEN;

const SALT_ROUNDS = 12;

export const GenerateRefreshToken = function (payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
};

export const GenerateAccessToken = function (email, id, firstName, lastName, role) {
  return jwt.sign(
    { email, id, firstName, lastName, role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const HashPassword = async function (password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const HashRefreshToken = async function (refreshToken) {
  return await bcrypt.hash(refreshToken, SALT_ROUNDS);
};


export const VerifyRefreshToken = function (refreshToken) {
  return jwt.verify(refreshToken, REFRESH_SECRET);
};
