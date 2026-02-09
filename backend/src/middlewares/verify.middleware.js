import { AsyncHandler } from "../utils/index.js"
import { Cfg } from "../config/env.js"
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/index.js";
const VerifyMiddleware = AsyncHandler((req, res, next) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }
    const decodedToken = jwt.verify(token, Cfg.ACCESS_TOKEN_SECRET);
    if (!decodedToken) {
        throw new ApiError(401, "Unauthorized");
    }
    req.user = decodedToken;
    next();
})

export default VerifyMiddleware;