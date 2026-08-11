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
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await params;

        const paymentId =
            Number(id);

        const payment =
            await prisma.supplierPayment.findUnique(
                {
                    where: {
                        id: paymentId,
                    },

                    include: {
                        supplier: true,

                        allocations: {
                            include: {
                                purchase: true,
                            },

                            orderBy: {
                                createdAt:
                                    "asc",
                            },
                        },
                    },
                }
            );

        if (!payment) {
            return NextResponse.json(
                {
                    message:
                        "Supplier payment not found",
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
                message:
                    "Failed to fetch supplier payment",
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
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await params;

        const paymentId =
            Number(id);

        const body =
            await request.json();

        const {
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        const newAmount =
            Number(amount);

        // ======================================
        // VALIDATION
        // ======================================

        if (
            !newAmount ||
            newAmount <= 0
        ) {
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
                    message:
                        "Payment method is required",
                },
                {
                    status: 400,
                }
            );
        }

        if (!paymentDate) {
            return NextResponse.json(
                {
                    message:
                        "Payment date is required",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================
        // TRANSACTION
        // ======================================

        const result =
            await prisma.$transaction(
                async (tx) => {
                    // ======================================
                    // FIND OLD PAYMENT
                    // ======================================

                    const oldPayment =
                        await tx.supplierPayment.findUnique(
                            {
                                where: {
                                    id: paymentId,
                                },

                                include: {
                                    allocations: true,
                                },
                            }
                        );

                    if (!oldPayment) {
                        throw new Error(
                            "Supplier payment not found"
                        );
                    }

                    const supplierId =
                        oldPayment.supplierId;

                    // ======================================
                    // FIND SUPPLIER
                    // ======================================

                    const supplier =
                        await tx.supplier.findUnique(
                            {
                                where: {
                                    id: supplierId,
                                },
                            }
                        );

                    if (!supplier) {
                        throw new Error(
                            "Supplier not found"
                        );
                    }

                    // ======================================
                    // REVERSE OLD ALLOCATIONS
                    //
                    // IMPORTANT:
                    //
                    // We ONLY restore dueAmount.
                    //
                    // paidAmount is NEVER touched.
                    // ======================================

                    let purchaseAllocatedTotal =
                        0;

                    for (
                        const allocation of
                        oldPayment.allocations
                    ) {
                        const purchase =
                            await tx.purchase.findUnique(
                                {
                                    where: {
                                        id: allocation.purchaseId,
                                    },
                                }
                            );

                        if (!purchase) {
                            throw new Error(
                                `Purchase #${allocation.purchaseId} not found`
                            );
                        }

                        const allocationAmount =
                            Number(
                                allocation.amount
                            );

                        // ======================================
                        // RESTORE ONLY DUE
                        // ======================================

                        await tx.purchase.update(
                            {
                                where: {
                                    id: purchase.id,
                                },

                                data: {
                                    dueAmount:
                                        Number(
                                            purchase.dueAmount
                                        ) +
                                        allocationAmount,
                                },
                            }
                        );

                        purchaseAllocatedTotal +=
                            allocationAmount;
                    }

                    // ======================================
                    // REVERSE OPENING DUE PORTION
                    //
                    // Payment amount - purchase allocation
                    // = amount originally used against
                    // opening due.
                    // ======================================

                    const oldOpeningDuePayment =
                        Math.max(
                            0,
                            Number(
                                oldPayment.amount
                            ) -
                            purchaseAllocatedTotal
                        );

                    if (
                        oldOpeningDuePayment >
                        0
                    ) {
                        await tx.supplier.update(
                            {
                                where: {
                                    id: supplierId,
                                },

                                data: {
                                    openingDue:
                                        Number(
                                            supplier.openingDue
                                        ) +
                                        oldOpeningDuePayment,
                                },
                            }
                        );
                    }

                    // ======================================
                    // DELETE OLD ALLOCATIONS
                    // ======================================

                    await tx.supplierPaymentAllocation.deleteMany(
                        {
                            where: {
                                supplierPaymentId:
                                    paymentId,
                            },
                        }
                    );

                    // ======================================
                    // GET FRESH SUPPLIER
                    // ======================================

                    const freshSupplier =
                        await tx.supplier.findUnique(
                            {
                                where: {
                                    id: supplierId,
                                },
                            }
                        );

                    if (!freshSupplier) {
                        throw new Error(
                            "Supplier not found"
                        );
                    }

                    // ======================================
                    // GET FRESH PURCHASES
                    // ======================================

                    const purchases =
                        await tx.purchase.findMany(
                            {
                                where: {
                                    supplierId,
                                },

                                orderBy: [
                                    {
                                        purchaseDate:
                                            "asc",
                                    },
                                    {
                                        id: "asc",
                                    },
                                ],
                            }
                        );

                    // ======================================
                    // CURRENT PURCHASE DUE
                    // ======================================

                    const purchaseDue =
                        purchases.reduce(
                            (
                                sum,
                                purchase
                            ) =>
                                sum +
                                Number(
                                    purchase.dueAmount
                                ),
                            0
                        );

                    // ======================================
                    // CURRENT OPENING DUE
                    // ======================================

                    const currentOpeningDue =
                        Number(
                            freshSupplier.openingDue
                        );

                    // ======================================
                    // TOTAL CURRENT DUE
                    // ======================================

                    const totalDue =
                        currentOpeningDue +
                        purchaseDue;

                    if (
                        newAmount >
                        totalDue
                    ) {
                        throw new Error(
                            `Payment cannot be greater than current due. Current due: ${totalDue.toFixed(
                                2
                            )}`
                        );
                    }

                    let remainingPayment =
                        newAmount;

                    // ======================================
                    // 1. APPLY TO OPENING DUE
                    // ======================================

                    if (
                        currentOpeningDue >
                        0 &&
                        remainingPayment >
                        0
                    ) {
                        const openingPayment =
                            Math.min(
                                currentOpeningDue,
                                remainingPayment
                            );

                        await tx.supplier.update(
                            {
                                where: {
                                    id: supplierId,
                                },

                                data: {
                                    openingDue:
                                        currentOpeningDue -
                                        openingPayment,
                                },
                            }
                        );

                        remainingPayment -=
                            openingPayment;
                    }

                    // ======================================
                    // 2. APPLY TO PURCHASE DUES
                    //
                    // IMPORTANT:
                    //
                    // ONLY dueAmount changes.
                    //
                    // paidAmount remains the
                    // original purchase-time payment.
                    // ======================================

                    for (
                        const purchase of purchases
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

                        // ======================================
                        // UPDATE ONLY DUE
                        // ======================================

                        await tx.purchase.update(
                            {
                                where: {
                                    id: purchase.id,
                                },

                                data: {
                                    dueAmount:
                                        due - pay,
                                },
                            }
                        );

                        // ======================================
                        // CREATE NEW ALLOCATION
                        // ======================================

                        await tx.supplierPaymentAllocation.create(
                            {
                                data: {
                                    supplierPaymentId:
                                        paymentId,

                                    purchaseId:
                                        purchase.id,

                                    amount: pay,
                                },
                            }
                        );

                        remainingPayment -=
                            pay;
                    }

                    // ======================================
                    // SAFETY CHECK
                    // ======================================

                    if (
                        remainingPayment >
                        0.000001
                    ) {
                        throw new Error(
                            "Payment allocation failed"
                        );
                    }

                    // ======================================
                    // UPDATE PAYMENT RECORD
                    // ======================================

                    const updatedPayment =
                        await tx.supplierPayment.update(
                            {
                                where: {
                                    id: paymentId,
                                },

                                data: {
                                    amount:
                                        newAmount,

                                    paymentMethod,

                                    paymentDate:
                                        new Date(
                                            paymentDate
                                        ),

                                    note:
                                        note ||
                                        null,
                                },

                                include: {
                                    supplier: true,

                                    allocations: {
                                        include: {
                                            purchase: true,
                                        },

                                        orderBy: {
                                            createdAt:
                                                "asc",
                                        },
                                    },
                                },
                            }
                        );

                    // ======================================
                    // UPDATE CASH BOOK
                    // ======================================

                    const cashBook =
                        await tx.cashBook.findFirst(
                            {
                                where: {
                                    referenceType:
                                        "SupplierPayment",

                                    referenceId:
                                        paymentId,
                                },
                            }
                        );

                    if (cashBook) {
                        await tx.cashBook.update(
                            {
                                where: {
                                    id: cashBook.id,
                                },

                                data: {
                                    transactionDate:
                                        new Date(
                                            paymentDate
                                        ),

                                    amount:
                                        newAmount,

                                    description:
                                        note ||
                                        `Supplier Payment - ${supplier.name}`,
                                },
                            }
                        );
                    } else {
                        await tx.cashBook.create({
                            data: {
                                transactionDate:
                                    new Date(
                                        paymentDate
                                    ),

                                type: "Expense",

                                amount:
                                    newAmount,

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
                            action:
                                "UPDATE",

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
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await params;

        const paymentId =
            Number(id);

        const result =
            await prisma.$transaction(
                async (tx) => {
                    // ======================================
                    // GET PAYMENT
                    // ======================================

                    const payment =
                        await tx.supplierPayment.findUnique(
                            {
                                where: {
                                    id: paymentId,
                                },

                                include: {
                                    allocations: true,
                                },
                            }
                        );

                    if (!payment) {
                        throw new Error(
                            "Supplier payment not found"
                        );
                    }

                    const supplierId =
                        payment.supplierId;

                    // ======================================
                    // FIND SUPPLIER
                    // ======================================

                    const supplier =
                        await tx.supplier.findUnique(
                            {
                                where: {
                                    id: supplierId,
                                },
                            }
                        );

                    if (!supplier) {
                        throw new Error(
                            "Supplier not found"
                        );
                    }

                    // ======================================
                    // REVERSE PURCHASE ALLOCATIONS
                    //
                    // IMPORTANT:
                    //
                    // ONLY restore dueAmount.
                    //
                    // paidAmount NEVER changes.
                    // ======================================

                    let purchaseAllocatedTotal =
                        0;

                    for (
                        const allocation of
                        payment.allocations
                    ) {
                        const purchase =
                            await tx.purchase.findUnique(
                                {
                                    where: {
                                        id: allocation.purchaseId,
                                    },
                                }
                            );

                        if (!purchase) {
                            throw new Error(
                                `Purchase #${allocation.purchaseId} not found`
                            );
                        }

                        const allocationAmount =
                            Number(
                                allocation.amount
                            );

                        // ======================================
                        // RESTORE ONLY DUE
                        // ======================================

                        await tx.purchase.update(
                            {
                                where: {
                                    id: purchase.id,
                                },

                                data: {
                                    dueAmount:
                                        Number(
                                            purchase.dueAmount
                                        ) +
                                        allocationAmount,
                                },
                            }
                        );

                        purchaseAllocatedTotal +=
                            allocationAmount;
                    }

                    // ======================================
                    // REVERSE OPENING DUE PAYMENT
                    // ======================================

                    const openingDuePayment =
                        Math.max(
                            0,
                            Number(
                                payment.amount
                            ) -
                            purchaseAllocatedTotal
                        );

                    if (
                        openingDuePayment >
                        0
                    ) {
                        await tx.supplier.update(
                            {
                                where: {
                                    id: supplierId,
                                },

                                data: {
                                    openingDue:
                                        Number(
                                            supplier.openingDue
                                        ) +
                                        openingDuePayment,
                                },
                            }
                        );
                    }

                    // ======================================
                    // DELETE CASH BOOK
                    // ======================================

                    await tx.cashBook.deleteMany({
                        where: {
                            referenceType:
                                "SupplierPayment",

                            referenceId:
                                paymentId,
                        },
                    });

                    // ======================================
                    // ACTIVITY LOG
                    // ======================================

                    await tx.activityLog.create({
                        data: {
                            action:
                                "DELETE",

                            module:
                                "Supplier Payment",

                            referenceId:
                                paymentId,

                            description:
                                `Supplier payment #${paymentId} deleted`,
                        },
                    });

                    // ======================================
                    // DELETE PAYMENT
                    //
                    // Allocation rows are deleted
                    // automatically by Cascade.
                    // ======================================

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