import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {

        // ==========================
        // SALES
        // ==========================

        const sales = await prisma.sale.aggregate({
            _sum: {
                totalAmount: true,
                paidAmount: true,
                dueAmount: true,
            },
        });

        // ==========================
        // PURCHASE
        // ==========================

        const purchases = await prisma.purchase.aggregate({
            _sum: {
                totalAmount: true,
                paidAmount: true,
                dueAmount: true,
            },
        });

        // ==========================
        // EXPENSE
        // ==========================

        const expenses = await prisma.expense.aggregate({
            _sum: {
                amount: true,
            },
        });

        // ==========================
        // CUSTOMER PAYMENT
        // ==========================

        const customerPayments =
            await prisma.customerPayment.aggregate({
                _sum: {
                    amount: true,
                },
            });

        // ==========================
        // SUPPLIER PAYMENT
        // ==========================

        const supplierPayments =
            await prisma.supplierPayment.aggregate({
                _sum: {
                    amount: true,
                },
            });

        // ==========================
        // SALE RETURN
        // ==========================

        const saleReturns =
            await prisma.saleReturn.aggregate({
                _sum: {
                    totalAmount: true,
                    cashReturned: true,
                },
            });

        // ==========================
        // PURCHASE RETURN
        // ==========================

        const purchaseReturns =
            await prisma.purchaseReturn.aggregate({
                _sum: {
                    totalAmount: true,
                    cashReceived: true,
                },
            });

        // ==========================
        // PROFIT
        // ==========================

        const profits =
            await prisma.saleItem.aggregate({
                _sum: {
                    profit: true,
                },
            });
        // ==========================
        // RETURN PROFIT REDUCTION
        // ==========================

        const profitReduced =
            await prisma.saleReturnItem.aggregate({
                _sum: {
                    profitReduced: true,
                },
            });

        const actualProfit =
            Number(profits._sum.profit || 0) -
            Number(profitReduced._sum.profitReduced || 0);

        // ==========================
        // TOTAL COUNTS
        // ==========================

        const totalProducts =
            await prisma.product.count();

        const totalCustomers =
            await prisma.customer.count();

        const totalSuppliers =
            await prisma.supplier.count();

        // ==========================
        // STOCK
        // ==========================

        const stock =
            await prisma.productBatch.aggregate({
                _sum: {
                    quantityRemaining: true,
                },
            });

        // ==========================
        // LOW STOCK
        // ==========================

        const lowStock =
            await prisma.productBatch.findMany({
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
                take: 10,
            });

        // ==========================
        // TOP SELLING PRODUCTS
        // ==========================

        // ==========================
        // TOP SELLING PRODUCTS
        // ==========================

        const topProductsData =
            await prisma.saleItem.groupBy({
                by: ["batchId"],
                _sum: {
                    quantity: true,
                    totalPrice: true,
                    profit: true,
                },
                orderBy: {
                    _sum: {
                        quantity: "desc",
                    },
                },
                take: 5,
            });

        const topProducts = await Promise.all(
            topProductsData.map(async (item) => {

                const batch = await prisma.productBatch.findUnique({
                    where: {
                        id: item.batchId,
                    },
                    include: {
                        product: true,
                    },
                });

                return {
                    batchId: item.batchId,
                    productName: batch?.product.name,
                    brand: batch?.product.brand,
                    unit: batch?.product.unit,
                    totalSold: Number(item._sum.quantity || 0),
                    totalSales: Number(item._sum.totalPrice || 0),
                    profit: Number(item._sum.profit || 0),
                };
            })
        );

        // ==========================
        // RECENT SALES
        // ==========================

        const recentSales =
            await prisma.sale.findMany({
                take: 5,
                orderBy: {
                    id: "desc",
                },
                include: {
                    customer: true,
                },
            });

        // ==========================
        // RECENT PURCHASES
        // ==========================

        const recentPurchases =
            await prisma.purchase.findMany({
                take: 5,
                orderBy: {
                    id: "desc",
                },
                include: {
                    supplier: true,
                },
            });
        return NextResponse.json({

            // ==========================
            // SALES
            // ==========================

            totalSales: Number(sales._sum.totalAmount || 0),
            totalSalesPaid: Number(sales._sum.paidAmount || 0),
            totalSalesDue: Number(sales._sum.dueAmount || 0),

            // ==========================
            // PURCHASE
            // ==========================

            totalPurchase: Number(purchases._sum.totalAmount || 0),
            totalPurchasePaid: Number(purchases._sum.paidAmount || 0),
            totalPurchaseDue: Number(purchases._sum.dueAmount || 0),

            // ==========================
            // EXPENSE
            // ==========================

            totalExpense: Number(expenses._sum.amount || 0),

            // ==========================
            // CASH FLOW
            // ==========================

            customerPayment:
                Number(customerPayments._sum.amount || 0),

            supplierPayment:
                Number(supplierPayments._sum.amount || 0),

            // ==========================
            // RETURNS
            // ==========================

            totalSaleReturn:
                Number(saleReturns._sum.totalAmount || 0),

            totalPurchaseReturn:
                Number(purchaseReturns._sum.totalAmount || 0),

            saleReturnCash:
                Number(saleReturns._sum.cashReturned || 0),

            purchaseReturnCash:
                Number(purchaseReturns._sum.cashReceived || 0),

            // ==========================
            // PROFIT
            // ==========================

            grossProfit:
                Number(profits._sum.profit || 0),

            profitReduced:
                Number(profitReduced._sum.profitReduced || 0),

            actualProfit,

            // ==========================
            // COUNTS
            // ==========================

            totalProducts,
            totalCustomers,
            totalSuppliers,

            totalStock:
                Number(stock._sum.quantityRemaining || 0),

            // ==========================
            // DATA
            // ==========================

            lowStock,
            topProducts,
            recentSales,
            recentPurchases,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch dashboard analytics",
            },
            {
                status: 500,
            }
        );
    }
}