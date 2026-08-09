import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL SUPPLIER PAYMENTS
// ======================================

export async function GET() {
    try {
        const payments = await prisma.supplierPayment.findMany({
            include: {
                supplier: true,
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch supplier payments",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// CREATE SUPPLIER PAYMENT
// ======================================

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            supplierId,
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        const supplierIdNumber = Number(supplierId);
        const paymentAmount = Number(amount);

        // ======================================
        // VALIDATION
        // ======================================

        if (!supplierIdNumber) {
            return NextResponse.json(
                {
                    message: "Supplier is required",
                },
                {
                    status: 400,
                }
            );
        }

        if (!paymentAmount || paymentAmount <= 0) {
            return NextResponse.json(
                {
                    message: "Payment amount must be greater than zero",
                },
                {
                    status: 400,
                }
            );
        }

        if (!paymentMethod) {
            return NextResponse.json(
                {
                    message: "Payment method is required",
                },
                {
                    status: 400,
                }
            );
        }

        if (!paymentDate) {
            return NextResponse.json(
                {
                    message: "Payment date is required",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================
        // TRANSACTION
        // ======================================

        const result = await prisma.$transaction(async (tx) => {

            const supplier = await tx.supplier.findUnique({
                where: {
                    id: supplierIdNumber,
                },
            });

            if (!supplier) {
                throw new Error("Supplier not found");
            }

            // --------------------------------------
            // Current outstanding amount
            // --------------------------------------

            const purchases = await tx.purchase.findMany({
                where: {
                    supplierId: supplierIdNumber,
                },
                orderBy: {
                    purchaseDate: "asc",
                },
            });

            const totalPurchaseDue = purchases.reduce(
                (sum, purchase) =>
                    sum + Number(purchase.dueAmount),
                0
            );

            const openingDue = Number(supplier.openingDue);

            const totalDue =
                openingDue + totalPurchaseDue;

            if (paymentAmount > totalDue) {
                throw new Error(
                    `Payment cannot be greater than total due. Current due: ${totalDue.toFixed(
                        2
                    )}`
                );
            }

            // --------------------------------------
            // Create payment first
            // --------------------------------------

            const payment = await tx.supplierPayment.create({
                data: {
                    supplierId: supplierIdNumber,
                    amount: paymentAmount,
                    paymentMethod,
                    paymentDate: new Date(paymentDate),
                    note: note || null,
                },
            });

            // --------------------------------------
            // 1. First adjust opening due
            // --------------------------------------

            let remainingPayment = paymentAmount;

            if (openingDue > 0) {
                const openingPayment = Math.min(
                    openingDue,
                    remainingPayment
                );

                await tx.supplier.update({
                    where: {
                        id: supplierIdNumber,
                    },
                    data: {
                        openingDue:
                            openingDue - openingPayment,
                    },
                });

                remainingPayment -= openingPayment;
            }

            // --------------------------------------
            // 2. FIFO purchase due payment
            // --------------------------------------

            for (const purchase of purchases) {

                if (remainingPayment <= 0) {
                    break;
                }

                const due = Number(purchase.dueAmount);

                if (due <= 0) {
                    continue;
                }

                const pay = Math.min(
                    due,
                    remainingPayment
                );

                await tx.purchase.update({
                    where: {
                        id: purchase.id,
                    },
                    data: {
                        paidAmount:
                            Number(purchase.paidAmount) +
                            pay,

                        dueAmount:
                            due - pay,
                    },
                });

                remainingPayment -= pay;
            }

            // --------------------------------------
            // CashBook
            // --------------------------------------

            await tx.cashBook.create({
                data: {
                    transactionDate: new Date(paymentDate),
                    type: "Expense",
                    amount: paymentAmount,

                    description:
                        note ||
                        `Supplier Payment - ${supplier.name}`,

                    referenceType: "SupplierPayment",
                    referenceId: payment.id,
                },
            });

            // --------------------------------------
            // Activity Log
            // --------------------------------------

            await tx.activityLog.create({
                data: {
                    action: "CREATE",
                    module: "Supplier Payment",
                    referenceId: payment.id,
                    description:
                        `Supplier payment of ${paymentAmount} created for ${supplier.name}`,
                },
            });

            return payment;
        });

        return NextResponse.json(
            {
                message: "Supplier payment created successfully",
                payment: result,
            },
            {
                status: 201,
            }
        );

    } catch (error: unknown) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create supplier payment",
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