import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL SUPPLIER PAYMENTS
// ======================================

export async function GET() {
    try {
        const payments =
            await prisma.supplierPayment.findMany({
                include: {
                    supplier: true,

                    allocations: {
                        include: {
                            purchase: true,
                        },

                        orderBy: {
                            createdAt: "asc",
                        },
                    },
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
                message:
                    "Failed to fetch supplier payments",
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

export async function POST(
    request: Request
) {
    try {
        const body = await request.json();

        const {
            supplierId,
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        const supplierIdNumber =
            Number(supplierId);

        const paymentAmount =
            Number(amount);

        // ======================================
        // VALIDATION
        // ======================================

        if (!supplierIdNumber) {
            return NextResponse.json(
                {
                    message:
                        "Supplier is required",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !paymentAmount ||
            paymentAmount <= 0
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
                    // FIND SUPPLIER
                    // ======================================

                    const supplier =
                        await tx.supplier.findUnique(
                            {
                                where: {
                                    id: supplierIdNumber,
                                },
                            }
                        );

                    if (!supplier) {
                        throw new Error(
                            "Supplier not found"
                        );
                    }

                    // ======================================
                    // GET SUPPLIER PURCHASES
                    // ======================================

                    const purchases =
                        await tx.purchase.findMany(
                            {
                                where: {
                                    supplierId:
                                        supplierIdNumber,
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
                    // CALCULATE CURRENT PURCHASE DUE
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
                    // OPENING DUE
                    // ======================================

                    const openingDue =
                        Number(
                            supplier.openingDue
                        );

                    // ======================================
                    // TOTAL CURRENT DUE
                    // ======================================

                    const totalDue =
                        openingDue +
                        purchaseDue;

                    // ======================================
                    // PAYMENT CANNOT EXCEED DUE
                    // ======================================

                    if (
                        paymentAmount >
                        totalDue
                    ) {
                        throw new Error(
                            `Payment cannot be greater than current due. Current due: ${totalDue.toFixed(
                                2
                            )}`
                        );
                    }

                    // ======================================
                    // CREATE SUPPLIER PAYMENT
                    // ======================================

                    const payment =
                        await tx.supplierPayment.create(
                            {
                                data: {
                                    supplierId:
                                        supplierIdNumber,

                                    amount:
                                        paymentAmount,

                                    paymentMethod,

                                    paymentDate:
                                        new Date(
                                            paymentDate
                                        ),

                                    note:
                                        note ||
                                        null,
                                },
                            }
                        );

                    let remainingPayment =
                        paymentAmount;

                    // ======================================
                    // 1. PAY OPENING DUE FIRST
                    // ======================================

                    if (
                        openingDue > 0 &&
                        remainingPayment > 0
                    ) {
                        const openingPayment =
                            Math.min(
                                openingDue,
                                remainingPayment
                            );

                        await tx.supplier.update(
                            {
                                where: {
                                    id: supplierIdNumber,
                                },

                                data: {
                                    openingDue:
                                        openingDue -
                                        openingPayment,
                                },
                            }
                        );

                        remainingPayment -=
                            openingPayment;
                    }

                    // ======================================
                    // 2. PAY PURCHASE DUES
                    //
                    // IMPORTANT:
                    //
                    // Later supplier payment ONLY
                    // decreases purchase.dueAmount.
                    //
                    // purchase.paidAmount MUST NOT
                    // be changed here.
                    //
                    // Example:
                    //
                    // Purchase:
                    // Total = 30,000
                    // Paid at purchase = 20,000
                    // Due = 10,000
                    //
                    // Later payment = 5,000
                    //
                    // Result:
                    // paidAmount = 20,000  <-- unchanged
                    // dueAmount  = 5,000   <-- decreased
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
                        //
                        // DO NOT UPDATE paidAmount
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
                        // CREATE PAYMENT ALLOCATION
                        // ======================================

                        await tx.supplierPaymentAllocation.create(
                            {
                                data: {
                                    supplierPaymentId:
                                        payment.id,

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
                    // CASH BOOK
                    // ======================================

                    await tx.cashBook.create({
                        data: {
                            transactionDate:
                                new Date(
                                    paymentDate
                                ),

                            type: "Expense",

                            amount:
                                paymentAmount,

                            description:
                                note ||
                                `Supplier Payment - ${supplier.name}`,

                            referenceType:
                                "SupplierPayment",

                            referenceId:
                                payment.id,
                        },
                    });

                    // ======================================
                    // ACTIVITY LOG
                    // ======================================

                    await tx.activityLog.create({
                        data: {
                            action:
                                "CREATE",

                            module:
                                "Supplier Payment",

                            referenceId:
                                payment.id,

                            description:
                                `Supplier payment of ${paymentAmount} created for ${supplier.name}`,
                        },
                    });

                    // ======================================
                    // RETURN PAYMENT
                    // ======================================

                    return await tx.supplierPayment.findUnique(
                        {
                            where: {
                                id: payment.id,
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
                }
            );

        return NextResponse.json(
            {
                message:
                    "Supplier payment created successfully",

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
                message:
                    "Failed to create supplier payment",

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