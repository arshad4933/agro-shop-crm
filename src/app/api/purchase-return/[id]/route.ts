import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET SINGLE PURCHASE RETURN
// ======================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const purchaseReturn = await prisma.purchaseReturn.findUnique({
            where: {
                id: Number(id),
            },
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
        });

        if (!purchaseReturn) {
            return NextResponse.json(
                {
                    message: "Purchase Return not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(purchaseReturn);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch purchase return",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// DELETE PURCHASE RETURN
// ======================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const purchaseReturn = await prisma.purchaseReturn.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                items: true,
            },
        });

        if (!purchaseReturn) {
            return NextResponse.json(
                {
                    message: "Purchase Return not found",
                },
                {
                    status: 404,
                }
            );
        }

        await prisma.$transaction(async (tx) => {
            // Restore Stock
            for (const item of purchaseReturn.items) {
                await tx.productBatch.update({
                    where: {
                        id: item.batchId,
                    },
                    data: {
                        quantityRemaining: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            // Restore Purchase
            const purchase = await tx.purchase.findUnique({
                where: {
                    id: purchaseReturn.purchaseId,
                },
            });

            if (purchase) {
                await tx.purchase.update({
                    where: {
                        id: purchase.id,
                    },
                    data: {
                        totalAmount:
                            Number(purchase.totalAmount) +
                            Number(purchaseReturn.totalAmount),

                        paidAmount:
                            Number(purchase.paidAmount) +
                            Number(purchaseReturn.cashReceived),

                        dueAmount:
                            Number(purchase.dueAmount) +
                            Number(purchaseReturn.adjustedDue),
                    },
                });
            }

            // Delete CashBook
            await tx.cashBook.deleteMany({
                where: {
                    referenceType: "PurchaseReturn",
                    referenceId: purchaseReturn.id,
                },
            });

            // Delete Activity Log
            await tx.activityLog.deleteMany({
                where: {
                    module: "Purchase Return",
                    referenceId: purchaseReturn.id,
                },
            });

            // Delete Return Items
            await tx.purchaseReturnItem.deleteMany({
                where: {
                    purchaseReturnId: purchaseReturn.id,
                },
            });

            // Delete Return
            await tx.purchaseReturn.delete({
                where: {
                    id: purchaseReturn.id,
                },
            });
        });

        return NextResponse.json({
            message: "Purchase Return deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to delete purchase return",
            },
            {
                status: 500,
            }
        );
    }
}