import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET SALE RETURN BY ID
// ======================================

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const saleReturnId = Number(id);

        if (!Number.isInteger(saleReturnId)) {
            return NextResponse.json(
                {
                    message: "Invalid Sale Return ID",
                },
                {
                    status: 400,
                }
            );
        }

        const saleReturn =
            await prisma.saleReturn.findUnique({
                where: {
                    id: saleReturnId,
                },

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
            });

        if (!saleReturn) {
            return NextResponse.json(
                {
                    message: "Sale Return not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(saleReturn);
    } catch (error) {
        console.error("Sale Return GET BY ID error:", error);

        return NextResponse.json(
            {
                message: "Failed to fetch Sale Return",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// DELETE SALE RETURN
// ======================================

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const saleReturnId = Number(id);

        if (!Number.isInteger(saleReturnId)) {
            return NextResponse.json(
                {
                    message: "Invalid Sale Return ID",
                },
                {
                    status: 400,
                }
            );
        }

        const result = await prisma.$transaction(
            async (tx) => {
                // ======================================
                // FIND RETURN
                // ======================================

                const saleReturn =
                    await tx.saleReturn.findUnique({
                        where: {
                            id: saleReturnId,
                        },

                        include: {
                            items: true,
                            sale: true,
                        },
                    });

                if (!saleReturn) {
                    throw new Error(
                        "Sale Return not found"
                    );
                }

                // ======================================
                // FIND SALE
                // ======================================

                const sale = await tx.sale.findUnique({
                    where: {
                        id: saleReturn.saleId,
                    },
                });

                if (!sale) {
                    throw new Error(
                        "Original sale not found"
                    );
                }

                // ======================================
                // RESTORE SALE FINANCIAL VALUES
                // ======================================

                await tx.sale.update({
                    where: {
                        id: sale.id,
                    },

                    data: {
                        totalAmount:
                            Number(sale.totalAmount) +
                            Number(
                                saleReturn.totalAmount
                            ),

                        paidAmount:
                            Number(sale.paidAmount) +
                            Number(
                                saleReturn.cashReturned
                            ),

                        dueAmount:
                            Number(sale.dueAmount) +
                            Number(
                                saleReturn.adjustedDue
                            ),
                    },
                });

                // ======================================
                // REVERSE STOCK + PROFIT
                // ======================================

                for (const item of saleReturn.items) {
                    const batch =
                        await tx.productBatch.findUnique(
                            {
                                where: {
                                    id: item.batchId,
                                },
                            }
                        );

                    if (!batch) {
                        throw new Error(
                            `Batch ${item.batchId} not found`
                        );
                    }

                    // IMPORTANT:
                    // Sale Return originally increased stock.
                    // Deleting the return means taking that
                    // returned stock back out.
                    if (
                        batch.quantityRemaining <
                        item.quantity
                    ) {
                        throw new Error(
                            `Cannot delete Sale Return #${saleReturn.id}. Stock is no longer available to reverse this return.`
                        );
                    }

                    await tx.productBatch.update({
                        where: {
                            id: batch.id,
                        },

                        data: {
                            quantityRemaining: {
                                decrement:
                                    item.quantity,
                            },
                        },
                    });

                    const saleItem =
                        await tx.saleItem.findUnique({
                            where: {
                                id: item.saleItemId,
                            },
                        });

                    if (saleItem) {
                        await tx.saleItem.update({
                            where: {
                                id: saleItem.id,
                            },

                            data: {
                                profit:
                                    Number(
                                        saleItem.profit
                                    ) +
                                    Number(
                                        item.profitReduced
                                    ),
                            },
                        });
                    }
                }

                // ======================================
                // DELETE CASHBOOK ENTRY
                // ======================================

                await tx.cashBook.deleteMany({
                    where: {
                        referenceType:
                            "SaleReturn",

                        referenceId:
                            saleReturn.id,
                    },
                });

                // ======================================
                // DELETE RETURN ITEMS
                // ======================================

                await tx.saleReturnItem.deleteMany({
                    where: {
                        saleReturnId:
                            saleReturn.id,
                    },
                });

                // ======================================
                // DELETE SALE RETURN
                // ======================================

                await tx.saleReturn.delete({
                    where: {
                        id: saleReturn.id,
                    },
                });

                // ======================================
                // ACTIVITY LOG
                // ======================================

                await tx.activityLog.create({
                    data: {
                        action: "DELETE",

                        module: "Sale Return",

                        referenceId:
                            saleReturn.id,

                        description:
                            `Sale Return #${saleReturn.id} deleted from Invoice ${sale.invoiceNo}`,
                    },
                });

                return {
                    message:
                        "Sale Return deleted successfully",
                };
            }
        );

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error(
            "Sale Return DELETE error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to delete Sale Return",

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