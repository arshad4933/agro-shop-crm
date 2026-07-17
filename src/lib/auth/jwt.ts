import jwt from "jsonwebtoken";

const JWT_SECRET =
    process.env.JWT_SECRET || "super-secret-key-change-this";

const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
    id: number;
    username: string;
    role: string;
}

export function generateToken(payload: JwtPayload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}
// ================================
// Extract Token From Header
// ================================

export function getTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.replace("Bearer ", "");
}

// ================================
// Get Logged User
// ================================

export function getUserFromRequest(request: Request): JwtPayload | null {
    const token = getTokenFromRequest(request);

    if (!token) {
        return null;
    }

    return verifyToken(token);
}