import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL PRODUCT BATCHES
// =======================

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const productId = searchParams.get("productId");
        const batches = await prisma.productBatch.findMany({

            where: {

                quantityRemaining: {

                    gt: 0,

                },

                ...(productId && {

                    productId: Number(productId),

                }),

            },

            include: {

                product: {

                    include: {

                        category: true,

                    },

                },

                supplier: true,

            },

            orderBy: {

                purchaseDate: "asc",

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