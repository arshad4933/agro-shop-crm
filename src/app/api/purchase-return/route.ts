import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL PURCHASE RETURNS
// ======================================

export async function GET() {
    try {
        const returns = await prisma.purchaseReturn.findMany({
            include: {
                supplier: true,
                purchase: true,
                items: {
                    include: {
                        batch: {
                            include: {
                                product: true,
                            },
                        },
                        purchaseItem: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch purchase returns",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// CREATE PURCHASE RETURN
// ======================================

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            purchaseId,
            supplierId,
            returnDate,
            cashReceived,
            adjustedDue,
            reason,
            items,
        } = body;

        if (
            !purchaseId ||
            !supplierId ||
            !returnDate ||
            !items ||
            items.length === 0
        ) {
            return NextResponse.json(
                {
                    message:
                        "Purchase, Supplier, Return Date and Items are required",
                },
                {
                    status: 400,
                }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: {
                    id: Number(purchaseId),
                },
            });

            if (!purchase) {
                throw new Error("Purchase not found");
            }

            let totalReturnAmount = 0;

            const returnItems: any[] = [];

            for (const item of items) {
                const purchaseItem = await tx.purchaseItem.findUnique({
                    where: {
                        id: Number(item.purchaseItemId),
                    },
                    include: {
                        batch: true,
                    },
                });

                if (!purchaseItem) {
                    throw new Error("Purchase Item not found");
                }

                const qty = Number(item.quantity);

                if (qty <= 0) {
                    throw new Error("Invalid quantity");
                }

                if (qty > purchaseItem.quantity) {
                    throw new Error(
                        `Cannot return more than purchased quantity (${purchaseItem.quantity})`
                    );
                }

                const totalPrice =
                    qty * Number(purchaseItem.buyPrice);

                totalReturnAmount += totalPrice;

                returnItems.push({
                    purchaseItemId: purchaseItem.id,
                    batchId: purchaseItem.batchId,
                    quantity: qty,
                    buyPrice: Number(purchaseItem.buyPrice),
                    totalPrice,
                });

                await tx.productBatch.update({
                    where: {
                        id: purchaseItem.batchId,
                    },
                    data: {
                        quantityRemaining: {
                            decrement: qty,
                        },
                    },
                });
            }
            // ==========================
            // Create Purchase Return
            // ==========================

            const purchaseReturn = await tx.purchaseReturn.create({
                data: {
                    purchaseId: Number(purchaseId),
                    supplierId: Number(supplierId),
                    returnDate: new Date(returnDate),
                    totalAmount: totalReturnAmount,
                    cashReceived: Number(cashReceived || 0),
                    adjustedDue: Number(adjustedDue || 0),
                    reason,
                },
            });

            // ==========================
            // Create Return Items
            // ==========================

            for (const item of returnItems) {
                await tx.purchaseReturnItem.create({
                    data: {
                        purchaseReturnId: purchaseReturn.id,
                        purchaseItemId: item.purchaseItemId,
                        batchId: item.batchId,
                        quantity: item.quantity,
                        buyPrice: item.buyPrice,
                        totalPrice: item.totalPrice,
                    },
                });
            }

            // ==========================
            // Update Purchase
            // ==========================

            await tx.purchase.update({
                where: {
                    id: Number(purchaseId),
                },
                data: {
                    totalAmount:
                        Number(purchase.totalAmount) - totalReturnAmount,

                    dueAmount:
                        Number(purchase.dueAmount) -
                        Number(adjustedDue || 0),

                    paidAmount:
                        Number(purchase.paidAmount) -
                        Number(cashReceived || 0),
                },
            });

            // ==========================
            // CashBook
            // ==========================

            if (Number(cashReceived || 0) > 0) {
                await tx.cashBook.create({
                    data: {
                        transactionDate: new Date(returnDate),
                        type: "Income",
                        amount: Number(cashReceived),
                        description: `Purchase Return Refund - ${purchase.purchaseNo}`,
                        referenceType: "PurchaseReturn",
                        referenceId: purchaseReturn.id,
                    },
                });
            }

            // ==========================
            // Activity Log
            // ==========================

            await tx.activityLog.create({
                data: {
                    action: "CREATE",
                    module: "Purchase Return",
                    referenceId: purchaseReturn.id,
                    description: `Purchase Return #${purchaseReturn.id} created`,
                },
            });

            return purchaseReturn;
        });

        return NextResponse.json(result, {
            status: 201,
        });

    } catch (error: any) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create purchase return",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}