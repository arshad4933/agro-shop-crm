import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";

export async function POST(request: Request) {
    try {

        const body = await request.json();

        const {
            username,
            password,
        } = body;

        if (!username || !password) {
            return NextResponse.json(
                {
                    message: "Username and Password are required",
                },
                {
                    status: 400,
                }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                username,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    message: "Invalid username or password",
                },
                {
                    status: 401,
                }
            );
        }
        const isPasswordValid = await comparePassword(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    message: "Invalid username or password",
                },
                {
                    status: 401,
                }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    message: "User account is inactive",
                },
                {
                    status: 403,
                }
            );
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
        });

        return NextResponse.json({
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Login failed",
                error: error.message,
            },
            {
                status: 500,
            }
        );

    }
}