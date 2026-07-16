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

        // =======================
        // CUSTOMER DUE
        // =======================

        const customerDue = await prisma.sale.aggregate({
            _sum: {
                dueAmount: true,
            },
        });

        // =======================
        // SUPPLIER DUE
        // =======================

        const supplierDue = await prisma.purchase.aggregate({
            _sum: {
                dueAmount: true,
            },
        });

        // =======================
        // TOTAL PRODUCTS
        // =======================

        const totalProducts = await prisma.product.count();

        // =======================
        // TOTAL CUSTOMERS
        // =======================

        const totalCustomers = await prisma.customer.count();

        // =======================
        // TOTAL SUPPLIERS
        // =======================

        const totalSuppliers = await prisma.supplier.count();

        // =======================
        // TOTAL STOCK
        // =======================

        const stock = await prisma.productBatch.aggregate({
            _sum: {
                quantityRemaining: true,
            },
        });

        // =======================
        // LOW STOCK PRODUCTS
        // =======================

        const lowStock = await prisma.productBatch.findMany({
            where: {
                quantityRemaining: {
                    lte: 20,
                },
            },
            include: {
                product: true,
            },
            orderBy: {
                quantityRemaining: "asc",
            },
        });

        // =======================
        // RECENT SALES
        // =======================

        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: {
                id: "desc",
            },
            include: {
                customer: true,
            },
        });

        // =======================
        // RECENT PURCHASES
        // =======================

        const recentPurchases = await prisma.purchase.findMany({
            take: 5,
            orderBy: {
                id: "desc",
            },
            include: {
                supplier: true,
            },
        });

        return NextResponse.json({
            // =======================
            // SUMMARY
            // =======================

            totalSales: Number(sales._sum.totalAmount || 0),
            totalPurchase: Number(purchases._sum.totalAmount || 0),
            totalExpense: Number(expenses._sum.amount || 0),

            // =======================
            // CASH FLOW
            // =======================

            totalCashIn: Number(cashIn._sum.amount || 0),
            totalCashOut: Number(cashOut._sum.amount || 0),

            // =======================
            // PROFIT
            // =======================

            totalProfit: Number(saleItems._sum.profit || 0),

            // =======================
            // DUE
            // =======================

            totalCustomerDue: Number(customerDue._sum.dueAmount || 0),
            totalSupplierDue: Number(supplierDue._sum.dueAmount || 0),

            // =======================
            // COUNTS
            // =======================

            totalProducts,
            totalCustomers,
            totalSuppliers,
            totalStock: Number(stock._sum.quantityRemaining || 0),

            // =======================
            // LISTS
            // =======================

            lowStock,
            recentSales,
            recentPurchases,
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