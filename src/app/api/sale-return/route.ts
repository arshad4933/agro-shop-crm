import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL SALES RETURN
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
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch sales return",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// CREATE SALES RETURN
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
            !items ||
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

            const sale = await tx.sale.findUnique({
                where: {
                    id: Number(saleId),
                },
            });

            if (!sale) {
                throw new Error("Sale not found");
            }

            let totalReturnAmount = 0;
            let totalProfitReduced = 0;

            const returnItems: any[] = [];
            for (const item of items) {
                const saleItem = await tx.saleItem.findUnique({
                    where: {
                        id: Number(item.saleItemId),
                    },
                    include: {
                        batch: true,
                    },
                });

                if (!saleItem) {
                    throw new Error("Sale Item not found");
                }

                const qty = Number(item.quantity);
                if (qty > saleItem.quantity) {
                    throw new Error(
                        `Cannot return more than sold quantity. Sold: ${saleItem.quantity}`
                    );
                }

                if (qty <= 0) {
                    throw new Error("Invalid return quantity");
                }

                if (qty > saleItem.quantity) {
                    throw new Error("Return quantity exceeds sold quantity");
                }

                const totalPrice =
                    qty * Number(saleItem.sellPrice);

                const profitReduced =
                    qty *
                    (Number(saleItem.sellPrice) -
                        Number(saleItem.buyPrice));

                totalReturnAmount += totalPrice;
                totalProfitReduced += profitReduced;

                returnItems.push({
                    saleItemId: saleItem.id,
                    batchId: saleItem.batchId,
                    quantity: qty,
                    buyPrice: Number(saleItem.buyPrice),
                    sellPrice: Number(saleItem.sellPrice),
                    totalPrice,
                    profitReduced,
                });

                // Restore Stock
                await tx.productBatch.update({
                    where: {
                        id: saleItem.batchId,
                    },
                    data: {
                        quantityRemaining:
                            saleItem.batch.quantityRemaining + qty,
                    },
                });
            }

            const saleReturn = await tx.saleReturn.create({
                data: {
                    saleId: Number(saleId),
                    customerId: Number(customerId),
                    returnDate: new Date(returnDate),
                    totalAmount: totalReturnAmount,
                    cashReturned: Number(cashReturned || 0),
                    adjustedDue: Number(adjustedDue || 0),
                    reason,
                },
            });

            for (const item of returnItems) {
                await tx.saleReturnItem.create({
                    data: {
                        saleReturnId: saleReturn.id,
                        saleItemId: item.saleItemId,
                        batchId: item.batchId,
                        quantity: item.quantity,
                        buyPrice: item.buyPrice,
                        sellPrice: item.sellPrice,
                        totalPrice: item.totalPrice,
                        profitReduced: item.profitReduced,
                    },
                });
            }
            // Update Sale
            await tx.sale.update({
                where: {
                    id: Number(saleId),
                },
                data: {
                    totalAmount:
                        Number(sale.totalAmount) - totalReturnAmount,

                    dueAmount:
                        Number(sale.dueAmount) - Number(adjustedDue || 0),

                    paidAmount:
                        Number(sale.paidAmount) - Number(cashReturned || 0),
                },
            });

            // CashBook Entry
            if (Number(cashReturned || 0) > 0) {
                await tx.cashBook.create({
                    data: {
                        transactionDate: new Date(returnDate),
                        type: "Expense",
                        amount: Number(cashReturned),
                        description: `Sales Return Refund - Invoice ${sale.invoiceNo}`,
                        referenceType: "SaleReturn",
                        referenceId: saleReturn.id,
                    },
                });
            }

            // Activity Log
            await tx.activityLog.create({
                data: {
                    action: "CREATE",
                    module: "Sale Return",
                    referenceId: saleReturn.id,
                    description: `Sales Return #${saleReturn.id} created`,
                },
            });

            return saleReturn;
        });

        return NextResponse.json(result, {
            status: 201,
        });
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create sales return",
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