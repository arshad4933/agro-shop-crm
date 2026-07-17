import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth/jwt";

export async function GET(request: Request) {
    try {

        const payload = getUserFromRequest(request);

        if (!payload) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: payload.id,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    message: "User not found",
                },
                {
                    status: 404,
                }
            );
        }
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch user",
                error: error.message,
            },
            {
                status: 500,
            }
        );

    }
}