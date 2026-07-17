import { NextResponse } from "next/server";
import {
    getUserFromRequest,
    JwtPayload,
} from "@/lib/auth/jwt";

// ================================
// Require Authentication
// ================================

export async function requireAuth(
    request: Request
): Promise<JwtPayload> {

    const user = getUserFromRequest(request);

    if (!user) {
        throw new Error("UNAUTHORIZED");
    }

    return user;
}
// ================================
// Require Role
// ================================

export function requireRole(
    user: JwtPayload,
    allowedRoles: string[]
): void {

    if (!allowedRoles.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }

}
// ================================
// Handle Authentication Errors
// ================================

export function handleAuthError(error: any) {

    if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
            {
                message: "Unauthorized",
            },
            {
                status: 401,
            }
        );
    }

    if (error.message === "FORBIDDEN") {
        return NextResponse.json(
            {
                message: "Forbidden",
            },
            {
                status: 403,
            }
        );
    }

    return NextResponse.json(
        {
            message: "Internal Server Error",
            error: error.message,
        },
        {
            status: 500,
        }
    );

}
// ================================
// Permission Map
// ================================

export const PERMISSIONS = {
    Admin: ["*"],

    Manager: [
        "dashboard",
        "reports",

        "category",

        "product",

        "supplier",

        "customer",

        "purchase",

        "sale",

        "supplier-payment",

        "customer-payment",

        "expense",

        "cashbook",

        "purchase-return",

        "sale-return",
    ],

    Staff: [
        "dashboard",

        "sale",

        "customer",

        "product",

        "reports",
    ],
} as const;

export type RoleName = keyof typeof PERMISSIONS;
// ================================
// Require Permission
// ================================

export function requirePermission(
    user: JwtPayload,
    permission: string
): void {

    const role = user.role as RoleName;

    const permissions = PERMISSIONS[role] as readonly string[];

    if (!permissions) {
        throw new Error("FORBIDDEN");
    }

    // Admin has all permissions
    if (permissions.includes("*")) {
        return;
    }

    // Check permission
    if (!permissions.includes(permission)) {
        throw new Error("FORBIDDEN");
    }

}
// ================================
// Authorize (Auth + Permission)
// ================================

export async function authorize(
    request: Request,
    permission: string
): Promise<JwtPayload> {

    const user = await requireAuth(request);

    requirePermission(user, permission);

    return user;

}