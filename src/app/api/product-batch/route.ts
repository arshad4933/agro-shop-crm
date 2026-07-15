import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL PRODUCT BATCHES
// =======================

export async function GET() {
    try {
        const batches = await prisma.productBatch.findMany({
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
                supplier: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch product batches",
            },
            {
                status: 500,
            }
        );
    }
}