import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const customerId = searchParams.get("customerId");

        const where: any = {};

        // ==========================
        // DATE FILTER
        // ==========================

        if (from && to) {
            where.saleDate = {
                gte: new Date(from),
                lte: new Date(to),
            };
        }

        // ==========================
        // CUSTOMER FILTER
        // ==========================

        if (customerId) {
            where.customerId = Number(customerId);
        }

        // ==========================
        // SALES
        // ==========================

        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: true,
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
                saleDate: "desc",
            },
        });

        // ==========================
        // SUMMARY
        // ==========================

        let totalSales = 0;
        let totalDiscount = 0;
        let totalPaid = 0;
        let totalDue = 0;
        let totalProfit = 0;

        for (const sale of sales) {

            totalSales += Number(sale.totalAmount);
            totalDiscount += Number(sale.discount);
            totalPaid += Number(sale.paidAmount);
            totalDue += Number(sale.dueAmount);

            for (const item of sale.items) {
                totalProfit += Number(item.profit);
            }
        }
        // ==========================
        // REPORT DATA
        // ==========================

        const report = sales.map((sale) => ({

            id: sale.id,

            invoiceNo: sale.invoiceNo,

            saleDate: sale.saleDate,

            customer: {
                id: sale.customer.id,
                name: sale.customer.name,
                phone: sale.customer.phone,
                address: sale.customer.address,
            },

            totalAmount: Number(sale.totalAmount),

            discount: Number(sale.discount),

            paidAmount: Number(sale.paidAmount),

            dueAmount: Number(sale.dueAmount),

            note: sale.note,

            items: sale.items.map((item) => ({

                id: item.id,

                productId: item.batch.product.id,

                productName: item.batch.product.name,

                brand: item.batch.product.brand,

                unit: item.batch.product.unit,

                quantity: item.quantity,

                buyPrice: Number(item.buyPrice),

                sellPrice: Number(item.sellPrice),

                totalPrice: Number(item.totalPrice),

                profit: Number(item.profit),

            })),
        }));
        return NextResponse.json({

            summary: {
                totalInvoices: sales.length,

                totalSales,

                totalDiscount,

                totalPaid,

                totalDue,

                totalProfit,
            },

            report,

        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch sales report",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}