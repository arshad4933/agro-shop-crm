import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // =======================
        // SALES
        // =======================
        const sales = await prisma.sale.aggregate({
            _sum: {
                totalAmount: true,
            },
        });

        // =======================
        // PURCHASE
        // =======================
        const purchases = await prisma.purchase.aggregate({
            _sum: {
                totalAmount: true,
            },
        });

        // =======================
        // EXPENSE
        // =======================
        const expenses = await prisma.expense.aggregate({
            _sum: {
                amount: true,
            },
        });

        // =======================
        // CUSTOMER PAYMENT
        // =======================
        const cashIn = await prisma.customerPayment.aggregate({
            _sum: {
                amount: true,
            },
        });

        // =======================
        // SUPPLIER PAYMENT
        // =======================
        const cashOut = await prisma.supplierPayment.aggregate({
            _sum: {
                amount: true,
            },
        });

        // =======================
        // TOTAL PROFIT
        // =======================
        const saleItems = await prisma.saleItem.aggregate({
            _sum: {
                profit: true,
            },
        });

        return NextResponse.json({
            totalSales: Number(sales._sum.totalAmount || 0),
            totalPurchase: Number(purchases._sum.totalAmount || 0),
            totalExpense: Number(expenses._sum.amount || 0),

            totalCashIn: Number(cashIn._sum.amount || 0),
            totalCashOut: Number(cashOut._sum.amount || 0),

            totalProfit: Number(saleItems._sum.profit || 0),
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch dashboard",
            },
            {
                status: 500,
            }
        );
    }
}