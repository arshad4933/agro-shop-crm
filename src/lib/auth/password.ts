import bcrypt from "bcryptjs";

// ================================
// Hash Password
// ================================

const SALT_ROUNDS = 10;

export async function hashPassword(
    password: string
): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

// ================================
// Compare Password
// ================================

export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}