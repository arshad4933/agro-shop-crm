import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const where: any = {};

        // ==========================
        // DATE FILTER
        // ==========================

        if (from && to) {
            where.sale = {
                saleDate: {
                    gte: new Date(from),
                    lte: new Date(to),
                },
            };
        }

        // ==========================
        // SALE ITEMS
        // ==========================

        const saleItems = await prisma.saleItem.findMany({
            where,
            include: {
                sale: true,
                batch: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        // ==========================
        // SALE RETURNS
        // ==========================

        const saleReturns = await prisma.saleReturnItem.findMany({
            where: from && to
                ? {
                    saleReturn: {
                        returnDate: {
                            gte: new Date(from),
                            lte: new Date(to),
                        },
                    },
                }
                : {},
        });

        let grossProfit = 0;
        let profitReduced = 0;

        const productProfit: Record<
            number,
            {
                productId: number;
                productName: string;
                brand: string;
                totalSold: number;
                sales: number;
                profit: number;
            }
        > = {};

        for (const item of saleItems) {

            grossProfit += Number(item.profit);

            const productId = item.batch.product.id;

            if (!productProfit[productId]) {
                productProfit[productId] = {
                    productId,
                    productName: item.batch.product.name,
                    brand: item.batch.product.brand ?? "N/A",
                    totalSold: 0,
                    sales: 0,
                    profit: 0,
                };
            }

            productProfit[productId].totalSold += item.quantity;

            productProfit[productId].sales += Number(item.totalPrice);

            productProfit[productId].profit += Number(item.profit);
        }
        // ==========================
        // PROFIT REDUCED
        // ==========================

        for (const item of saleReturns) {
            profitReduced += Number(item.profitReduced);
        }

        const actualProfit = grossProfit - profitReduced;

        // ==========================
        // TOP PROFIT PRODUCTS
        // ==========================

        const topProducts = Object.values(productProfit)
            .sort((a, b) => b.profit - a.profit);

        // ==========================
        // RESPONSE
        // ==========================

        return NextResponse.json({

            summary: {

                grossProfit,

                profitReduced,

                actualProfit,

                totalProducts: topProducts.length,

            },

            topProducts,

        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch profit report",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}