import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET CASHBOOK
// =======================

export async function GET() {
    try {
        const cashbook = await prisma.cashBook.findMany({
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(cashbook);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch cashbook",
            },
            {
                status: 500,
            }
        );
    }
}