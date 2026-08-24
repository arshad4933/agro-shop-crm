import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL SALE RETURNS
// ======================================

export async function GET() {
    try {
        const returns =
            await prisma.saleReturn.findMany({
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

        return NextResponse.json(
            returns
        );
    } catch (error) {
        console.error(
            "Sale Return GET error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to fetch sale returns",

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

// ======================================
// CREATE SALE RETURN
// ======================================

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        const {
            saleId,
            customerId,
            returnDate,
            cashReturned,
            adjustedDue,
            reason,
            items,
        } = body;

        // ======================================
        // VALIDATION
        // ======================================

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

        const result =
            await prisma.$transaction(
                async (tx) => {
                    // ======================================
                    // FIND SALE
                    // ======================================

                    const sale =
                        await tx.sale.findUnique({
                            where: {
                                id: Number(saleId),
                            },

                            include: {
                                items: true,

                                saleReturns: {
                                    include: {
                                        items: true,
                                    },
                                },
                            },
                        });

                    if (!sale) {
                        throw new Error(
                            "Sale not found"
                        );
                    }

                    // ======================================
                    // CUSTOMER VALIDATION
                    // ======================================

                    if (
                        sale.customerId !==
                        Number(customerId)
                    ) {
                        throw new Error(
                            "Selected customer does not belong to this sale"
                        );
                    }

                    // ======================================
                    // RETURN VARIABLES
                    // ======================================

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

                    for (
                        const item of items
                    ) {
                        const saleItemId =
                            Number(
                                item.saleItemId
                            );

                        const qty =
                            Number(
                                item.quantity
                            );

                        // ====================================
                        // VALIDATE SALE ITEM ID
                        // ====================================

                        if (
                            !Number.isInteger(
                                saleItemId
                            )
                        ) {
                            throw new Error(
                                "Invalid Sale Item ID"
                            );
                        }

                        // ====================================
                        // VALIDATE QUANTITY
                        // ====================================

                        if (
                            !Number.isInteger(
                                qty
                            ) ||
                            qty <= 0
                        ) {
                            throw new Error(
                                "Invalid return quantity"
                            );
                        }

                        // ====================================
                        // FIND SALE ITEM
                        // ====================================

                        const saleItem =
                            await tx.saleItem.findUnique(
                                {
                                    where: {
                                        id: saleItemId,
                                    },

                                    include: {
                                        batch: true,
                                    },
                                }
                            );

                        if (!saleItem) {
                            throw new Error(
                                `Sale Item ${saleItemId} not found`
                            );
                        }

                        // ====================================
                        // SALE OWNERSHIP CHECK
                        // ====================================

                        if (
                            saleItem.saleId !==
                            sale.id
                        ) {
                            throw new Error(
                                "Sale Item does not belong to this sale"
                            );
                        }

                        // ====================================
                        // PREVIOUS RETURN QUANTITY
                        // ====================================

                        const previousReturns =
                            await tx.saleReturnItem.aggregate(
                                {
                                    where: {
                                        saleItemId:
                                            saleItem.id,
                                    },

                                    _sum: {
                                        quantity: true,
                                    },
                                }
                            );

                        const alreadyReturned =
                            Number(
                                previousReturns
                                    ._sum.quantity ??
                                0
                            );

                        // ====================================
                        // AVAILABLE RETURN QUANTITY
                        // ====================================

                        const availableToReturn =
                            Number(
                                saleItem.quantity
                            ) -
                            alreadyReturned;

                        if (
                            availableToReturn <=
                            0
                        ) {
                            throw new Error(
                                `All quantity for this item has already been returned`
                            );
                        }

                        if (
                            qty >
                            availableToReturn
                        ) {
                            throw new Error(
                                `Cannot return ${qty}. Only ${availableToReturn} remaining quantity can be returned`
                            );
                        }

                        // ====================================
                        // PRICE CALCULATION
                        // ====================================

                        const sellPrice =
                            Number(
                                saleItem.sellPrice
                            );

                        const buyPrice =
                            Number(
                                saleItem.buyPrice
                            );

                        const totalPrice =
                            qty *
                            sellPrice;

                        const profitReduced =
                            qty *
                            (sellPrice -
                                buyPrice);

                        totalReturnAmount +=
                            totalPrice;

                        // ====================================
                        // STORE RETURN ITEM
                        // ====================================

                        returnItems.push({
                            saleItemId:
                                saleItem.id,

                            batchId:
                                saleItem.batchId,

                            quantity:
                                qty,

                            buyPrice,

                            sellPrice,

                            totalPrice,

                            profitReduced,
                        });

                        // ====================================
                        // RESTORE STOCK
                        // ====================================

                        await tx.productBatch.update(
                            {
                                where: {
                                    id:
                                        saleItem.batchId,
                                },

                                data: {
                                    quantityRemaining: {
                                        increment:
                                            qty,
                                    },
                                },
                            }
                        );
                    }

                    // ======================================
                    // CASH / DUE
                    // ======================================

                    const cashRefund =
                        Number(
                            cashReturned ?? 0
                        );

                    const dueAdjustment =
                        Number(
                            adjustedDue ?? 0
                        );

                    // ======================================
                    // NEGATIVE VALIDATION
                    // ======================================

                    if (
                        cashRefund < 0 ||
                        dueAdjustment < 0
                    ) {
                        throw new Error(
                            "Cash Returned and Adjusted Due cannot be negative"
                        );
                    }

                    // ======================================
                    // RETURN AMOUNT MUST BE FULLY ALLOCATED
                    // ======================================

                    const allocationTotal =
                        cashRefund +
                        dueAdjustment;

                    if (
                        Math.abs(
                            allocationTotal -
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
                    // CURRENT PAYMENT STATE
                    // ======================================
                    //
                    // We use current paid/due only for
                    // validation.
                    //
                    // Historical payment records are NOT
                    // modified.
                    //
                    // ======================================

                    const currentPaidAmount =
                        Number(
                            sale.paidAmount ?? 0
                        );

                    const currentDueAmount =
                        Number(
                            sale.dueAmount ?? 0
                        );

                    // ======================================
                    // CASH REFUND VALIDATION
                    // ======================================

                    if (
                        cashRefund >
                        currentPaidAmount +
                        0.01
                    ) {
                        throw new Error(
                            "Cash returned cannot be greater than the current paid amount"
                        );
                    }

                    // ======================================
                    // DUE ADJUSTMENT VALIDATION
                    // ======================================

                    if (
                        dueAdjustment >
                        currentDueAmount +
                        0.01
                    ) {
                        throw new Error(
                            "Adjusted due cannot be greater than the current due amount"
                        );
                    }

                    // ======================================
                    // CREATE SALE RETURN
                    // ======================================

                    const saleReturn =
                        await tx.saleReturn.create(
                            {
                                data: {
                                    saleId:
                                        sale.id,

                                    customerId:
                                        sale.customerId,

                                    returnDate:
                                        new Date(
                                            returnDate
                                        ),

                                    totalAmount:
                                        totalReturnAmount,

                                    cashReturned:
                                        cashRefund,

                                    adjustedDue:
                                        dueAdjustment,

                                    reason:
                                        reason?.trim() ||
                                        null,
                                },
                            }
                        );

                    // ======================================
                    // CREATE RETURN ITEMS
                    // ======================================

                    for (
                        const item of
                        returnItems
                    ) {
                        await tx.saleReturnItem.create(
                            {
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
                            }
                        );
                    }

                    // ======================================
                    // UPDATE SALE BALANCE
                    // ======================================
                    //
                    // IMPORTANT:
                    //
                    // totalAmount NEVER decreases.
                    //
                    // Original invoice remains unchanged.
                    //
                    // Example:
                    //
                    // Original Sale = ৳400
                    // Return        = ৳200
                    //
                    // Sale.totalAmount remains ৳400.
                    //
                    // Only the current financial balance changes.
                    //
                    // ======================================

                    const newPaidAmount =
                        currentPaidAmount -
                        cashRefund;

                    const newDueAmount =
                        currentDueAmount -
                        dueAdjustment;

                    if (
                        newPaidAmount <
                        -0.01
                    ) {
                        throw new Error(
                            "Paid amount cannot become negative"
                        );
                    }

                    if (
                        newDueAmount <
                        -0.01
                    ) {
                        throw new Error(
                            "Due amount cannot become negative"
                        );
                    }

                    await tx.sale.update({
                        where: {
                            id: sale.id,
                        },

                        data: {
                            // ==================================
                            // ORIGINAL INVOICE TOTAL
                            // REMAINS UNCHANGED
                            // ==================================

                            totalAmount:
                                sale.totalAmount,

                            // ==================================
                            // CURRENT PAID BALANCE
                            // ==================================

                            paidAmount:
                                Math.max(
                                    0,
                                    newPaidAmount
                                ),

                            // ==================================
                            // CURRENT DUE BALANCE
                            // ==================================

                            dueAmount:
                                Math.max(
                                    0,
                                    newDueAmount
                                ),
                        },
                    });

                    // ======================================
                    // CASH BOOK
                    // ======================================

                    if (
                        cashRefund > 0
                    ) {
                        await tx.cashBook.create({
                            data: {
                                transactionDate:
                                    new Date(
                                        returnDate
                                    ),

                                type:
                                    "Expense",

                                amount:
                                    cashRefund,

                                description:
                                    `Sales Return Refund - Invoice ${sale.invoiceNo}`,

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
                            action:
                                "CREATE",

                            module:
                                "Sale Return",

                            referenceId:
                                saleReturn.id,

                            description:
                                `Sale Return #${saleReturn.id} created for Invoice ${sale.invoiceNo}`,
                        },
                    });

                    // ======================================
                    // RETURN RESULT
                    // ======================================

                    return saleReturn;
                }
            );

        // ======================================
        // SUCCESS RESPONSE
        // ======================================

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