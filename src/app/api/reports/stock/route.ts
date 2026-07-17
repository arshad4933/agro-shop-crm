import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
                expiryDate: "asc",
            },
        });

        const today = new Date();

        let totalStockValue = 0;
        let totalSaleValue = 0;
        let expectedProfit = 0;

        let lowStockCount = 0;
        let outOfStockCount = 0;
        let expiredCount = 0;

        const report = batches.map((batch) => {

            const stockValue =
                Number(batch.purchasePrice) *
                batch.quantityRemaining;

            const saleValue =
                Number(batch.sellingPrice) *
                batch.quantityRemaining;

            const profit =
                (Number(batch.sellingPrice) -
                    Number(batch.purchasePrice)) *
                batch.quantityRemaining;

            totalStockValue += stockValue;
            totalSaleValue += saleValue;
            expectedProfit += profit;

            const isLowStock =
                batch.quantityRemaining <=
                batch.product.minimumStock;

            const isOutOfStock =
                batch.quantityRemaining <= 0;

            const isExpired =
                batch.expiryDate &&
                new Date(batch.expiryDate) < today;

            if (isLowStock) lowStockCount++;

            if (isOutOfStock) outOfStockCount++;

            if (isExpired) expiredCount++;

            return {

                batchId: batch.id,

                productId: batch.product.id,

                productName: batch.product.name,

                brand: batch.product.brand ?? "",

                category: batch.product.category.name,

                supplier: batch.supplier.name,

                purchasePrice: Number(batch.purchasePrice),

                sellingPrice: Number(batch.sellingPrice),

                quantity: batch.quantityRemaining,

                stockValue,

                saleValue,

                expectedProfit: profit,

                minimumStock:
                    batch.product.minimumStock,

                expiryDate: batch.expiryDate,

                isLowStock,

                isOutOfStock,

                isExpired,
            };
        });
        return NextResponse.json({

            summary: {

                totalProducts: report.length,

                totalStockValue,

                totalSaleValue,

                expectedProfit,

                lowStockCount,

                outOfStockCount,

                expiredCount,

            },

            report,

        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch stock report",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}