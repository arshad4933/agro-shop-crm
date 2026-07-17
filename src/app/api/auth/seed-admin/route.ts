import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function POST() {
    try {

        const existingUser = await prisma.user.findUnique({
            where: {
                username: "admin",
            },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    message: "Admin already exists",
                },
                {
                    status: 400,
                }
            );
        }

        const hashedPassword = await hashPassword("123456");
        const user = await prisma.user.create({
            data: {
                name: "System Administrator",
                username: "admin",
                password: hashedPassword,
                role: "Admin",
                isActive: true,
            },
        });

        return NextResponse.json(
            {
                message: "Admin user created successfully",
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                },
            },
            {
                status: 201,
            }
        );

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create admin user",
                error: error.message,
            },
            {
                status: 500,
            }
        );

    }
}