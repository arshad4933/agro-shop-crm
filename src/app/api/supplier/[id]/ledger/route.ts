import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decimalToNumber(value: any) {
    return Number(value ?? 0);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supplierId = Number(id);

        if (!Number.isInteger(supplierId)) {
            return NextResponse.json(
                { error: "Invalid supplier ID" },
                { status: 400 }
            );
        }

        const supplier = await prisma.supplier.findUnique({
            where: {
                id: supplierId,
            },

            include: {
                purchases: {
                    orderBy: {
                        purchaseDate: "asc",
                    },

                    include: {
                        supplierPaymentAllocations: {
                            orderBy: {
                                createdAt: "asc",
                            },

                            include: {
                                supplierPayment: true,
                            },
                        },
                    },
                },

                supplierPayments: {
                    orderBy: {
                        paymentDate: "asc",
                    },

                    include: {
                        allocations: {
                            include: {
                                purchase: true,
                            },
                        },
                    },
                },
            },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        // ============================================================
        // LEDGER
        // ============================================================

        type LedgerEntry = {
            id: string;
            date: string;
            type: "OPENING" | "PURCHASE" | "PAYMENT";
            reference: string;
            description: string;
            debit: number;
            credit: number;
            balance: number;
            paymentMethod?: string;
            purchaseId?: number;
            supplierPaymentId?: number;
        };

        const entries: LedgerEntry[] = [];

        // ============================================================
        // OPENING DUE
        // ============================================================

        const openingDue = decimalToNumber(
            supplier.openingDue
        );

        if (openingDue > 0) {
            entries.push({
                id: `opening-${supplier.id}`,
                date: supplier.createdAt.toISOString(),
                type: "OPENING",
                reference: "OPENING",
                description: "Opening Due",
                debit: openingDue,
                credit: 0,
                balance: 0,
            });
        }

        // ============================================================
        // PURCHASES
        // ============================================================

        for (const purchase of supplier.purchases) {
            const totalAmount = decimalToNumber(
                purchase.totalAmount
            );

            // Purchase itself creates supplier payable
            entries.push({
                id: `purchase-${purchase.id}`,
                date: purchase.purchaseDate.toISOString(),
                type: "PURCHASE",
                reference: purchase.purchaseNo,
                description: `Purchase ${purchase.purchaseNo}`,
                debit: totalAmount,
                credit: 0,
                balance: 0,
                purchaseId: purchase.id,
            });

            // ========================================================
            // INITIAL PAYMENT
            // ========================================================

            const initialPaidAmount = decimalToNumber(
                purchase.initialPaidAmount
            );

            if (initialPaidAmount > 0) {
                entries.push({
                    id: `initial-payment-${purchase.id}`,
                    date: purchase.purchaseDate.toISOString(),
                    type: "PAYMENT",
                    reference: `${purchase.purchaseNo}-INITIAL`,
                    description: `Initial payment for ${purchase.purchaseNo}`,
                    debit: 0,
                    credit: initialPaidAmount,
                    balance: 0,
                    purchaseId: purchase.id,
                });
            }
        }

        // ============================================================
        // LATER SUPPLIER PAYMENTS
        // ============================================================

        for (const payment of supplier.supplierPayments) {
            const paymentAmount = decimalToNumber(
                payment.amount
            );

            // --------------------------------------------------------
            // If payment has allocation(s)
            // --------------------------------------------------------

            if (payment.allocations.length > 0) {
                for (const allocation of payment.allocations) {
                    const allocationAmount = decimalToNumber(
                        allocation.amount
                    );

                    if (allocationAmount <= 0) continue;

                    entries.push({
                        id: `allocation-${allocation.id}`,
                        date: payment.paymentDate.toISOString(),
                        type: "PAYMENT",
                        reference: `${payment.id}`,
                        description: `Payment for ${allocation.purchase.purchaseNo}`,
                        debit: 0,
                        credit: allocationAmount,
                        balance: 0,
                        paymentMethod: payment.paymentMethod,
                        purchaseId: allocation.purchaseId,
                        supplierPaymentId: payment.id,
                    });
                }
            } else {
                // ----------------------------------------------------
                // Payment exists but has no allocation
                // ----------------------------------------------------

                entries.push({
                    id: `payment-${payment.id}`,
                    date: payment.paymentDate.toISOString(),
                    type: "PAYMENT",
                    reference: `PAY-${payment.id}`,
                    description: "Unallocated supplier payment",
                    debit: 0,
                    credit: paymentAmount,
                    balance: 0,
                    paymentMethod: payment.paymentMethod,
                    supplierPaymentId: payment.id,
                });
            }
        }

        // ============================================================
        // SORT
        // ============================================================

        entries.sort((a, b) => {
            const dateDifference =
                new Date(a.date).getTime() -
                new Date(b.date).getTime();

            if (dateDifference !== 0) {
                return dateDifference;
            }

            // Same date:
            // Purchase first, then payment
            if (a.type === "PURCHASE" && b.type === "PAYMENT") {
                return -1;
            }

            if (a.type === "PAYMENT" && b.type === "PURCHASE") {
                return 1;
            }

            return a.id.localeCompare(b.id);
        });

        // ============================================================
        // CALCULATE RUNNING BALANCE
        // ============================================================

        let balance = 0;

        for (const entry of entries) {
            balance =
                balance +
                entry.debit -
                entry.credit;

            entry.balance = Number(
                balance.toFixed(2)
            );
        }

        // ============================================================
        // TOTALS
        // ============================================================

        const totalPurchase = supplier.purchases.reduce(
            (sum, purchase) =>
                sum +
                decimalToNumber(
                    purchase.totalAmount
                ),
            0
        );

        const totalInitialPaid =
            supplier.purchases.reduce(
                (sum, purchase) =>
                    sum +
                    decimalToNumber(
                        purchase.initialPaidAmount
                    ),
                0
            );

        const totalAllocatedPayments =
            supplier.supplierPayments.reduce(
                (sum, payment) =>
                    sum +
                    payment.allocations.reduce(
                        (
                            allocationSum,
                            allocation
                        ) =>
                            allocationSum +
                            decimalToNumber(
                                allocation.amount
                            ),
                        0
                    ),
                0
            );

        const totalUnallocatedPayments =
            supplier.supplierPayments.reduce(
                (sum, payment) => {
                    if (
                        payment.allocations.length ===
                        0
                    ) {
                        return (
                            sum +
                            decimalToNumber(
                                payment.amount
                            )
                        );
                    }

                    return sum;
                },
                0
            );

        const totalSupplierPayments =
            totalInitialPaid +
            totalAllocatedPayments +
            totalUnallocatedPayments;

        const calculatedBalance =
            openingDue +
            totalPurchase -
            totalSupplierPayments;

        return NextResponse.json({
            supplier: {
                id: supplier.id,
                name: supplier.name,
                company: supplier.company,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
            },

            summary: {
                openingDue: Number(
                    openingDue.toFixed(2)
                ),

                totalPurchase: Number(
                    totalPurchase.toFixed(2)
                ),

                totalInitialPaid: Number(
                    totalInitialPaid.toFixed(2)
                ),

                totalAllocatedPayments: Number(
                    totalAllocatedPayments.toFixed(2)
                ),

                totalUnallocatedPayments: Number(
                    totalUnallocatedPayments.toFixed(2)
                ),

                totalSupplierPayments: Number(
                    totalSupplierPayments.toFixed(2)
                ),

                calculatedBalance: Number(
                    calculatedBalance.toFixed(2)
                ),
            },

            ledger: entries,
        });
    } catch (error) {
        console.error(
            "Supplier ledger error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to load supplier account ledger",
            },
            { status: 500 }
        );
    }
}