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

        const saleReturn = await prisma.saleReturn.findUnique({
            where: {
                id: Number(id),
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
        console.error(error);

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

        const result = await prisma.$transaction(async (tx) => {
            const saleReturn = await tx.saleReturn.findUnique({
                where: {
                    id: Number(id),
                },
                include: {
                    items: true,
                },
            });

            if (!saleReturn) {
                throw new Error("Sale Return not found");
            }

            // Restore Sale
            const sale = await tx.sale.findUnique({
                where: {
                    id: saleReturn.saleId,
                },
            });

            if (sale) {
                await tx.sale.update({
                    where: {
                        id: sale.id,
                    },
                    data: {
                        totalAmount:
                            Number(sale.totalAmount) + Number(saleReturn.totalAmount),

                        paidAmount:
                            Number(sale.paidAmount) + Number(saleReturn.cashReturned),

                        dueAmount:
                            Number(sale.dueAmount) + Number(saleReturn.adjustedDue),
                    },
                });
            }

            // Reverse stock & profit
            for (const item of saleReturn.items) {
                const batch = await tx.productBatch.findUnique({
                    where: {
                        id: item.batchId,
                    },
                });

                if (batch) {
                    await tx.productBatch.update({
                        where: {
                            id: batch.id,
                        },
                        data: {
                            quantityRemaining:
                                batch.quantityRemaining - item.quantity,
                        },
                    });
                }

                const saleItem = await tx.saleItem.findUnique({
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
                                Number(saleItem.profit) +
                                Number(item.profitReduced),
                        },
                    });
                }
            }

            await tx.saleReturnItem.deleteMany({
                where: {
                    saleReturnId: saleReturn.id,
                },
            });

            await tx.saleReturn.delete({
                where: {
                    id: saleReturn.id,
                },
            });

            return {
                message: "Sale Return deleted successfully",
            };
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to delete Sale Return",
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