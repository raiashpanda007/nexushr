import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Cfg } from "../config";
import { ApiError, AsyncHandler } from "../utils";
import Types from "../types";

interface VerifiedTokenPayload {
	id: string;
	email: string;
	role: string;
}

const isVerifiedTokenPayload = (value: unknown): value is VerifiedTokenPayload => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const payload = value as Record<string, unknown>;

	return (
		typeof payload.id === "string" &&
		typeof payload.email === "string" &&
		typeof payload.role === "string"
	);
};

const VerifyMiddleware = AsyncHandler(
	async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		const bearerToken = req.headers.authorization?.startsWith("Bearer ")
			? req.headers.authorization.split(" ")[1]
			: undefined;

		const token = req.cookies.accessToken ?? bearerToken;

		if (!token) {
			throw new ApiError(Types.StatusCodes.Unauthorized, "Unauthorized");
		}

		let decodedToken: string | jwt.JwtPayload;

		try {
			decodedToken = jwt.verify(token, Cfg.ACCESS_TOKEN_SECRET);
		} catch (error: unknown) {
			if (error instanceof TokenExpiredError) {
				throw new ApiError(Types.StatusCodes.Unauthorized, "jwt expired");
			}

			if (error instanceof JsonWebTokenError) {
				throw new ApiError(Types.StatusCodes.Unauthorized, "Unauthorized");
			}

			throw error;
		}

		if (!isVerifiedTokenPayload(decodedToken)) {
			throw new ApiError(Types.StatusCodes.Unauthorized, "Unauthorized");
		}

		req.user = {
			id: decodedToken.id,
			email: decodedToken.email,
			role: decodedToken.role,
		};

		next();
	}
);

export default VerifyMiddleware;
