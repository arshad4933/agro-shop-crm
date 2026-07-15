import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ACTIVITY LOG
// =======================

export async function GET() {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch activity log",
            },
            {
                status: 500,
            }
        );
    }
}