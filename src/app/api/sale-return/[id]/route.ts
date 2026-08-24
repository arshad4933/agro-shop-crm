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
                    message: "Invalid sale return ID",
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

                    sale: {
                        include: {
                            customer: true,

                            items: {
                                include: {
                                    batch: {
                                        include: {
                                            product: {
                                                include: {
                                                    category: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    items: {
                        include: {
                            saleItem: {
                                include: {
                                    batch: {
                                        include: {
                                            product: true,
                                        },
                                    },
                                },
                            },

                            batch: {
                                include: {
                                    product: {
                                        include: {
                                            category: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        if (!saleReturn) {
            return NextResponse.json(
                {
                    message: "Sale return not found",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================
        // RETURN TOTALS
        // ======================================

        const totalReturnAmount =
            Number(
                saleReturn.totalAmount ?? 0
            );

        const cashReturned =
            Number(
                saleReturn.cashReturned ?? 0
            );

        const adjustedDue =
            Number(
                saleReturn.adjustedDue ?? 0
            );

        // ======================================
        // VERIFY RETURN ALLOCATION
        // ======================================

        const allocatedAmount =
            cashReturned +
            adjustedDue;

        return NextResponse.json({
            ...saleReturn,

            summary: {
                totalReturnAmount:
                    Number(
                        totalReturnAmount.toFixed(2)
                    ),

                cashReturned:
                    Number(
                        cashReturned.toFixed(2)
                    ),

                adjustedDue:
                    Number(
                        adjustedDue.toFixed(2)
                    ),

                allocatedAmount:
                    Number(
                        allocatedAmount.toFixed(2)
                    ),

                remainingAmount:
                    Number(
                        (
                            totalReturnAmount -
                            allocatedAmount
                        ).toFixed(2)
                    ),
            },

            // ======================================
            // ORIGINAL INVOICE INFORMATION
            // ======================================
            //
            // IMPORTANT:
            // Sale return must NOT overwrite the
            // original invoice amount.
            //
            // ======================================

            originalSale: {
                id: saleReturn.sale.id,

                invoiceNo:
                    saleReturn.sale.invoiceNo,

                saleDate:
                    saleReturn.sale.saleDate,

                totalAmount:
                    Number(
                        saleReturn.sale.totalAmount
                    ),

                paidAmount:
                    Number(
                        saleReturn.sale.paidAmount
                    ),

                dueAmount:
                    Number(
                        saleReturn.sale.dueAmount
                    ),
            },
        });
    } catch (error: unknown) {
        console.error(
            "Sale Return GET error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to fetch sale return",

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
                    message: "Invalid sale return ID",
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
                    // FIND RETURN
                    // ======================================

                    const saleReturn =
                        await tx.saleReturn.findUnique({
                            where: {
                                id: saleReturnId,
                            },

                            include: {
                                sale: true,

                                items: true,
                            },
                        });

                    if (!saleReturn) {
                        throw new Error(
                            "Sale return not found"
                        );
                    }

                    // ======================================
                    // RESTORE SALE STOCK
                    // ======================================

                    for (
                        const item of
                        saleReturn.items
                    ) {
                        await tx.productBatch.update({
                            where: {
                                id: item.batchId,
                            },

                            data: {
                                quantityRemaining: {
                                    decrement:
                                        item.quantity,
                                },
                            },
                        });
                    }

                    // ======================================
                    // RESTORE SALE FINANCIAL STATE
                    // ======================================
                    //
                    // When deleting a return:
                    //
                    // cash refund is added back to paid
                    // due adjustment is added back to due
                    //
                    // Original sale amount is NOT changed.
                    //
                    // ======================================

                    const restoredPaidAmount =
                        Number(
                            saleReturn.sale
                                .paidAmount
                        ) +
                        Number(
                            saleReturn.cashReturned
                        );

                    const restoredDueAmount =
                        Number(
                            saleReturn.sale
                                .dueAmount
                        ) +
                        Number(
                            saleReturn.adjustedDue
                        );

                    await tx.sale.update({
                        where: {
                            id:
                                saleReturn.saleId,
                        },

                        data: {
                            paidAmount:
                                restoredPaidAmount,

                            dueAmount:
                                restoredDueAmount,
                        },
                    });

                    // ======================================
                    // DELETE CASH BOOK ENTRY
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
                    // DELETE ACTIVITY LOG
                    // ======================================

                    await tx.activityLog.deleteMany({
                        where: {
                            module:
                                "Sale Return",

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
                    // DELETE RETURN
                    // ======================================

                    await tx.saleReturn.delete({
                        where: {
                            id:
                                saleReturn.id,
                        },
                    });

                    return {
                        message:
                            "Sale return deleted successfully",
                    };
                }
            );

        return NextResponse.json(
            result
        );
    } catch (error: unknown) {
        console.error(
            "Sale Return DELETE error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to delete sale return",

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