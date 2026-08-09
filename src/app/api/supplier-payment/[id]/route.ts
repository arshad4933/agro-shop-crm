import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET PAYMENT BY ID
// ======================================

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    try {

        const { id } = await params;

        const paymentId = Number(id);

        const payment =
            await prisma.supplierPayment.findUnique({
                where: {
                    id: paymentId,
                },
                include: {
                    supplier: true,
                },
            });

        if (!payment) {
            return NextResponse.json(
                {
                    message: "Supplier payment not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(payment);

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch supplier payment",
            },
            {
                status: 500,
            }
        );
    }
}

// ======================================
// UPDATE SUPPLIER PAYMENT
// ======================================

export async function PUT(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    try {

        const { id } = await params;

        const paymentId = Number(id);

        const body = await request.json();

        const {
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        const newAmount = Number(amount);

        if (!newAmount || newAmount <= 0) {
            return NextResponse.json(
                {
                    message:
                        "Payment amount must be greater than zero",
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

        const result = await prisma.$transaction(
            async (tx) => {

                // ======================================
                // FIND OLD PAYMENT
                // ======================================

                const oldPayment =
                    await tx.supplierPayment.findUnique({
                        where: {
                            id: paymentId,
                        },
                    });

                if (!oldPayment) {
                    throw new Error(
                        "Supplier payment not found"
                    );
                }

                const supplierId =
                    oldPayment.supplierId;

                // ======================================
                // GET SUPPLIER
                // ======================================

                const supplier =
                    await tx.supplier.findUnique({
                        where: {
                            id: supplierId,
                        },
                    });

                if (!supplier) {
                    throw new Error(
                        "Supplier not found"
                    );
                }

                // ======================================
                // REVERSE OLD PAYMENT
                // ======================================

                const purchases =
                    await tx.purchase.findMany({
                        where: {
                            supplierId,
                        },
                        orderBy: {
                            purchaseDate: "asc",
                        },
                    });

                let amountToRestore =
                    Number(oldPayment.amount);

                // Restore purchase dues in reverse FIFO
                for (
                    let i = purchases.length - 1;
                    i >= 0;
                    i--
                ) {

                    if (amountToRestore <= 0) {
                        break;
                    }

                    const purchase =
                        purchases[i];

                    const originalPaid =
                        Number(purchase.paidAmount);

                    if (originalPaid <= 0) {
                        continue;
                    }

                    const restore =
                        Math.min(
                            originalPaid,
                            amountToRestore
                        );

                    await tx.purchase.update({
                        where: {
                            id: purchase.id,
                        },
                        data: {
                            paidAmount:
                                originalPaid -
                                restore,

                            dueAmount:
                                Number(
                                    purchase.dueAmount
                                ) + restore,
                        },
                    });

                    amountToRestore -= restore;
                }

                // Restore opening due if required
                if (amountToRestore > 0) {

                    await tx.supplier.update({
                        where: {
                            id: supplierId,
                        },
                        data: {
                            openingDue:
                                Number(
                                    supplier.openingDue
                                ) - amountToRestore,
                        },
                    });
                }

                // ======================================
                // CHECK NEW PAYMENT
                // ======================================

                const freshSupplier =
                    await tx.supplier.findUnique({
                        where: {
                            id: supplierId,
                        },
                    });

                if (!freshSupplier) {
                    throw new Error(
                        "Supplier not found"
                    );
                }

                const freshPurchases =
                    await tx.purchase.findMany({
                        where: {
                            supplierId,
                        },
                        orderBy: {
                            purchaseDate: "asc",
                        },
                    });

                const purchaseDue =
                    freshPurchases.reduce(
                        (sum, purchase) =>
                            sum +
                            Number(
                                purchase.dueAmount
                            ),
                        0
                    );

                const totalDue =
                    Number(
                        freshSupplier.openingDue
                    ) + purchaseDue;

                if (newAmount > totalDue) {
                    throw new Error(
                        `Payment cannot be greater than current due. Current due: ${totalDue.toFixed(
                            2
                        )}`
                    );
                }

                // ======================================
                // APPLY NEW PAYMENT
                // ======================================

                let remainingPayment =
                    newAmount;

                const currentOpeningDue =
                    Number(
                        freshSupplier.openingDue
                    );

                if (
                    currentOpeningDue >
                    0
                ) {

                    const openingPayment =
                        Math.min(
                            currentOpeningDue,
                            remainingPayment
                        );

                    await tx.supplier.update({
                        where: {
                            id: supplierId,
                        },
                        data: {
                            openingDue:
                                currentOpeningDue -
                                openingPayment,
                        },
                    });

                    remainingPayment -=
                        openingPayment;
                }

                // FIFO
                for (
                    const purchase of freshPurchases
                ) {

                    if (
                        remainingPayment <=
                        0
                    ) {
                        break;
                    }

                    const due =
                        Number(
                            purchase.dueAmount
                        );

                    if (due <= 0) {
                        continue;
                    }

                    const pay =
                        Math.min(
                            due,
                            remainingPayment
                        );

                    await tx.purchase.update({
                        where: {
                            id: purchase.id,
                        },
                        data: {
                            paidAmount:
                                Number(
                                    purchase.paidAmount
                                ) + pay,

                            dueAmount:
                                due - pay,
                        },
                    });

                    remainingPayment -=
                        pay;
                }

                // ======================================
                // UPDATE PAYMENT
                // ======================================

                const updatedPayment =
                    await tx.supplierPayment.update({
                        where: {
                            id: paymentId,
                        },
                        data: {
                            amount: newAmount,
                            paymentMethod,
                            paymentDate:
                                new Date(paymentDate),
                            note:
                                note || null,
                        },
                    });

                // ======================================
                // UPDATE CASHBOOK
                // ======================================

                const cashBook =
                    await tx.cashBook.findFirst({
                        where: {
                            referenceType:
                                "SupplierPayment",
                            referenceId:
                                paymentId,
                        },
                    });

                if (cashBook) {

                    await tx.cashBook.update({
                        where: {
                            id: cashBook.id,
                        },
                        data: {
                            transactionDate:
                                new Date(
                                    paymentDate
                                ),

                            amount: newAmount,

                            description:
                                note ||
                                `Supplier Payment - ${supplier.name}`,
                        },
                    });

                } else {

                    await tx.cashBook.create({
                        data: {
                            transactionDate:
                                new Date(
                                    paymentDate
                                ),

                            type: "Expense",

                            amount: newAmount,

                            description:
                                note ||
                                `Supplier Payment - ${supplier.name}`,

                            referenceType:
                                "SupplierPayment",

                            referenceId:
                                paymentId,
                        },
                    });
                }

                // ======================================
                // ACTIVITY LOG
                // ======================================

                await tx.activityLog.create({
                    data: {
                        action: "UPDATE",
                        module:
                            "Supplier Payment",
                        referenceId:
                            paymentId,
                        description:
                            `Supplier payment #${paymentId} updated`,
                    },
                });

                return updatedPayment;
            }
        );

        return NextResponse.json({
            message:
                "Supplier payment updated successfully",
            payment: result,
        });

    } catch (error: unknown) {

        console.error(error);

        return NextResponse.json(
            {
                message:
                    "Failed to update supplier payment",
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
// DELETE SUPPLIER PAYMENT
// ======================================

export async function DELETE(
    request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string }>;
    }
) {
    try {

        const { id } = await params;

        const paymentId = Number(id);

        const result = await prisma.$transaction(
            async (tx) => {

                const payment =
                    await tx.supplierPayment.findUnique({
                        where: {
                            id: paymentId,
                        },
                    });

                if (!payment) {
                    throw new Error(
                        "Supplier payment not found"
                    );
                }

                const supplierId =
                    payment.supplierId;

                const supplier =
                    await tx.supplier.findUnique({
                        where: {
                            id: supplierId,
                        },
                    });

                if (!supplier) {
                    throw new Error(
                        "Supplier not found"
                    );
                }

                const purchases =
                    await tx.purchase.findMany({
                        where: {
                            supplierId,
                        },
                        orderBy: {
                            purchaseDate: "asc",
                        },
                    });

                let amountToRestore =
                    Number(payment.amount);

                // Restore purchase due
                for (
                    let i = purchases.length - 1;
                    i >= 0;
                    i--
                ) {

                    if (amountToRestore <= 0) {
                        break;
                    }

                    const purchase =
                        purchases[i];

                    const paid =
                        Number(
                            purchase.paidAmount
                        );

                    if (paid <= 0) {
                        continue;
                    }

                    const restore =
                        Math.min(
                            paid,
                            amountToRestore
                        );

                    await tx.purchase.update({
                        where: {
                            id: purchase.id,
                        },
                        data: {
                            paidAmount:
                                paid - restore,

                            dueAmount:
                                Number(
                                    purchase.dueAmount
                                ) + restore,
                        },
                    });

                    amountToRestore -=
                        restore;
                }

                // Restore opening due
                if (amountToRestore > 0) {

                    await tx.supplier.update({
                        where: {
                            id: supplierId,
                        },
                        data: {
                            openingDue:
                                Number(
                                    supplier.openingDue
                                ) - amountToRestore,
                        },
                    });
                }

                // Delete CashBook
                await tx.cashBook.deleteMany({
                    where: {
                        referenceType:
                            "SupplierPayment",
                        referenceId:
                            paymentId,
                    },
                });

                // Delete Activity Log
                await tx.activityLog.create({
                    data: {
                        action: "DELETE",
                        module:
                            "Supplier Payment",
                        referenceId:
                            paymentId,
                        description:
                            `Supplier payment #${paymentId} deleted`,
                    },
                });

                // Delete Payment
                await tx.supplierPayment.delete({
                    where: {
                        id: paymentId,
                    },
                });

                return {
                    message:
                        "Supplier payment deleted successfully",
                };
            }
        );

        return NextResponse.json(result);

    } catch (error: unknown) {

        console.error(error);

        return NextResponse.json(
            {
                message:
                    "Failed to delete supplier payment",
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