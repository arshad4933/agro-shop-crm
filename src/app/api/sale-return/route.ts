import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL SALE RETURNS
// ======================================

export async function GET() {
    try {
        const returns = await prisma.saleReturn.findMany({
            include: {
                customer: true,
                sale: true,
                items: {
                    include: {
                        batch: {
                            include: {
                                product: true,
                            },
                        },
                        saleItem: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error("Sale Return GET error:", error);

        return NextResponse.json(
            {
                message: "Failed to fetch sale returns",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// CREATE SALE RETURN
// ======================================

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            saleId,
            customerId,
            returnDate,
            cashReturned,
            adjustedDue,
            reason,
            items,
        } = body;

        if (
            !saleId ||
            !customerId ||
            !returnDate ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return NextResponse.json(
                {
                    message:
                        "Sale, Customer, Return Date and Items are required",
                },
                {
                    status: 400,
                }
            );
        }

        const result = await prisma.$transaction(async (tx) => {

            // ======================================
            // FIND SALE
            // ======================================

            const sale = await tx.sale.findUnique({
                where: {
                    id: Number(saleId),
                },
            });

            if (!sale) {
                throw new Error("Sale not found");
            }

            // Customer validation
            if (sale.customerId !== Number(customerId)) {
                throw new Error(
                    "Selected customer does not belong to this sale"
                );
            }

            let totalReturnAmount = 0;

            const returnItems: {
                saleItemId: number;
                batchId: number;
                quantity: number;
                buyPrice: number;
                sellPrice: number;
                totalPrice: number;
                profitReduced: number;
            }[] = [];

            // ======================================
            // PROCESS RETURN ITEMS
            // ======================================

            for (const item of items) {

                const saleItemId = Number(item.saleItemId);
                const qty = Number(item.quantity);

                if (!Number.isInteger(saleItemId)) {
                    throw new Error("Invalid Sale Item ID");
                }

                if (!Number.isInteger(qty) || qty <= 0) {
                    throw new Error("Invalid return quantity");
                }

                const saleItem = await tx.saleItem.findUnique({
                    where: {
                        id: saleItemId,
                    },
                    include: {
                        batch: true,
                    },
                });

                if (!saleItem) {
                    throw new Error(
                        `Sale Item ${saleItemId} not found`
                    );
                }

                if (saleItem.saleId !== sale.id) {
                    throw new Error(
                        "Sale Item does not belong to this sale"
                    );
                }

                // ======================================
                // PREVIOUSLY RETURNED QUANTITY
                // ======================================

                const previousReturns =
                    await tx.saleReturnItem.aggregate({
                        where: {
                            saleItemId: saleItem.id,
                        },
                        _sum: {
                            quantity: true,
                        },
                    });

                const alreadyReturned =
                    Number(previousReturns._sum.quantity || 0);

                const availableToReturn =
                    saleItem.quantity - alreadyReturned;

                if (availableToReturn <= 0) {
                    throw new Error(
                        "All quantity for this item has already been returned"
                    );
                }

                if (qty > availableToReturn) {
                    throw new Error(
                        `Cannot return ${qty}. Only ${availableToReturn} remaining quantity can be returned`
                    );
                }

                const sellPrice = Number(saleItem.sellPrice);
                const buyPrice = Number(saleItem.buyPrice);

                const totalPrice = qty * sellPrice;

                const profitReduced =
                    qty * (sellPrice - buyPrice);

                totalReturnAmount += totalPrice;

                returnItems.push({
                    saleItemId: saleItem.id,
                    batchId: saleItem.batchId,
                    quantity: qty,
                    buyPrice,
                    sellPrice,
                    totalPrice,
                    profitReduced,
                });

                // ======================================
                // RESTORE STOCK
                // ======================================

                await tx.productBatch.update({
                    where: {
                        id: saleItem.batchId,
                    },
                    data: {
                        quantityRemaining: {
                            increment: qty,
                        },
                    },
                });
            }

            // ======================================
            // PAYMENT / DUE ADJUSTMENT
            // ======================================

            const cashRefund =
                Number(cashReturned || 0);

            const dueAdjustment =
                Number(adjustedDue || 0);

            if (cashRefund < 0 || dueAdjustment < 0) {
                throw new Error(
                    "Cash Returned and Adjusted Due cannot be negative"
                );
            }

            const returnAllocationTotal =
                cashRefund + dueAdjustment;

            if (
                Math.abs(
                    returnAllocationTotal -
                    totalReturnAmount
                ) > 0.01
            ) {
                throw new Error(
                    `Return amount ৳${totalReturnAmount.toFixed(
                        2
                    )} must equal Cash Returned + Adjusted Due`
                );
            }

            // ======================================
            // CHECK PREVIOUS RETURN ADJUSTMENTS
            // ======================================

            const previousSaleReturns =
                await tx.saleReturn.findMany({
                    where: {
                        saleId: sale.id,
                    },
                    select: {
                        cashReturned: true,
                        adjustedDue: true,
                    },
                });

            const previousCashRefund =
                previousSaleReturns.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.cashReturned || 0),
                    0
                );

            const previousDueAdjustment =
                previousSaleReturns.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.adjustedDue || 0),
                    0
                );

            // Current paid amount available for cash refund
            const availablePaidForRefund =
                Number(sale.paidAmount) -
                previousCashRefund;

            // Current due available for adjustment
            const availableDueForAdjustment =
                Number(sale.dueAmount) -
                previousDueAdjustment;

            if (
                cashRefund >
                availablePaidForRefund + 0.01
            ) {
                throw new Error(
                    `Cash refund cannot exceed available paid amount. Available: ৳${availablePaidForRefund.toFixed(
                        2
                    )}`
                );
            }

            if (
                dueAdjustment >
                availableDueForAdjustment + 0.01
            ) {
                throw new Error(
                    `Due adjustment cannot exceed current due amount. Available: ৳${availableDueForAdjustment.toFixed(
                        2
                    )}`
                );
            }

            // ======================================
            // CREATE SALE RETURN
            // ======================================

            const saleReturn =
                await tx.saleReturn.create({
                    data: {
                        saleId: sale.id,

                        customerId:
                            sale.customerId,

                        returnDate:
                            new Date(returnDate),

                        totalAmount:
                            totalReturnAmount,

                        cashReturned:
                            cashRefund,

                        adjustedDue:
                            dueAdjustment,

                        reason:
                            reason?.trim() || null,
                    },
                });

            // ======================================
            // CREATE SALE RETURN ITEMS
            // ======================================

            for (const item of returnItems) {

                await tx.saleReturnItem.create({
                    data: {
                        saleReturnId:
                            saleReturn.id,

                        saleItemId:
                            item.saleItemId,

                        batchId:
                            item.batchId,

                        quantity:
                            item.quantity,

                        buyPrice:
                            item.buyPrice,

                        sellPrice:
                            item.sellPrice,

                        totalPrice:
                            item.totalPrice,

                        profitReduced:
                            item.profitReduced,
                    },
                });
            }

            // ======================================
            // IMPORTANT
            // ======================================
            //
            // DO NOT UPDATE Sale.totalAmount
            // DO NOT UPDATE Sale.paidAmount
            // DO NOT UPDATE Sale.dueAmount
            //
            // কারণ Sale table-এ original invoice history
            // preserve করতে হবে।
            //
            // Example:
            //
            // Original Sale = 400
            // Paid = 300
            // Due = 100
            //
            // Return = 200
            //
            // Invoice-এ original sale 400-ই থাকবে।
            // Return history আলাদাভাবে থাকবে।
            //
            // ======================================

            // ======================================
            // CASH BOOK
            // ======================================

            if (cashRefund > 0) {

                await tx.cashBook.create({
                    data: {
                        transactionDate:
                            new Date(returnDate),

                        type: "Expense",

                        amount:
                            cashRefund,

                        description:
                            `Sales Return Cash Refund - Invoice ${sale.invoiceNo}`,

                        referenceType:
                            "SaleReturn",

                        referenceId:
                            saleReturn.id,
                    },
                });
            }

            // ======================================
            // ACTIVITY LOG
            // ======================================

            await tx.activityLog.create({
                data: {
                    action: "CREATE",

                    module: "Sale Return",

                    referenceId:
                        saleReturn.id,

                    description:
                        `Sale Return #${saleReturn.id} created for Invoice ${sale.invoiceNo}`,
                },
            });

            return saleReturn;
        });

        return NextResponse.json(
            result,
            {
                status: 201,
            }
        );

    } catch (error: unknown) {

        console.error(
            "Sale Return POST error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to create sale return",

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            }
        );
    }
}