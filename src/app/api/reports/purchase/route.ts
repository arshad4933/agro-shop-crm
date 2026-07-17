import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const supplierId = searchParams.get("supplierId");

        const where: any = {};

        // ==========================
        // DATE FILTER
        // ==========================

        if (from && to) {
            where.purchaseDate = {
                gte: new Date(from),
                lte: new Date(to),
            };
        }

        // ==========================
        // SUPPLIER FILTER
        // ==========================

        if (supplierId) {
            where.supplierId = Number(supplierId);
        }

        // ==========================
        // PURCHASES
        // ==========================

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        batch: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                purchaseDate: "desc",
            },
        });

        // ==========================
        // SUMMARY
        // ==========================

        let totalPurchase = 0;
        let totalPaid = 0;
        let totalDue = 0;

        for (const purchase of purchases) {

            totalPurchase += Number(purchase.totalAmount);

            totalPaid += Number(purchase.paidAmount);

            totalDue += Number(purchase.dueAmount);
        }
        // ==========================
        // REPORT DATA
        // ==========================

        const report = purchases.map((purchase) => ({

            id: purchase.id,

            purchaseNo: purchase.purchaseNo,

            purchaseDate: purchase.purchaseDate,

            supplier: {
                id: purchase.supplier.id,
                name: purchase.supplier.name,
                company: purchase.supplier.company,
                phone: purchase.supplier.phone,
                address: purchase.supplier.address,
            },

            totalAmount: Number(purchase.totalAmount),

            paidAmount: Number(purchase.paidAmount),

            dueAmount: Number(purchase.dueAmount),

            note: purchase.note,

            items: purchase.items.map((item) => ({

                id: item.id,

                productId: item.batch.product.id,

                productName: item.batch.product.name,

                brand: item.batch.product.brand,

                unit: item.batch.product.unit,

                quantity: item.quantity,

                buyPrice: Number(item.buyPrice),

                totalPrice: Number(item.totalPrice),

            })),
        }));
        return NextResponse.json({

            summary: {
                totalPurchases: purchases.length,

                totalPurchase,

                totalPaid,

                totalDue,
            },

            report,

        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch purchase report",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}