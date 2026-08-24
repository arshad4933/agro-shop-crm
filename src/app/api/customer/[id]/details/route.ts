import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET CUSTOMER DETAILS
// ======================================

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const customerId = Number(id);

        if (!Number.isInteger(customerId)) {
            return NextResponse.json(
                {
                    message: "Invalid customer ID",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================
        // CUSTOMER
        // ======================================

        const customer =
            await prisma.customer.findUnique({
                where: {
                    id: customerId,
                },

                include: {
                    sales: {
                        orderBy: {
                            saleDate: "asc",
                        },

                        include: {
                            items: {
                                include: {
                                    batch: {
                                        include: {
                                            product: true,
                                        },
                                    },
                                },
                            },

                            saleReturns: {
                                orderBy: {
                                    returnDate: "asc",
                                },

                                include: {
                                    items: {
                                        include: {
                                            saleItem: true,

                                            batch: {
                                                include: {
                                                    product: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },

                            salePayments: {
                                orderBy: {
                                    paymentDate: "asc",
                                },
                            },

                            payments: {
                                orderBy: {
                                    paymentDate: "asc",
                                },
                            },
                        },
                    },

                    payments: {
                        orderBy: {
                            paymentDate: "asc",
                        },
                    },

                    saleReturns: {
                        orderBy: {
                            returnDate: "asc",
                        },

                        include: {
                            sale: true,

                            items: {
                                include: {
                                    saleItem: true,

                                    batch: {
                                        include: {
                                            product: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        if (!customer) {
            return NextResponse.json(
                {
                    message: "Customer not found",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================
        // OPENING DUE
        // ======================================

        const openingDue =
            Number(customer.openingDue ?? 0);

        // ======================================
        // ORIGINAL SALES
        // ======================================
        //
        // IMPORTANT:
        //
        // sale.totalAmount can be the NET amount
        // after old return processing.
        //
        // Therefore we reconstruct the original
        // sale amount using:
        //
        // current sale total
        // +
        // all return amounts
        //
        // This keeps the original invoice amount
        // in customer history.
        //
        // ======================================

        const salesWithOriginalAmount =
            customer.sales.map((sale) => {
                const totalReturned =
                    sale.saleReturns.reduce(
                        (sum, saleReturn) =>
                            sum +
                            Number(
                                saleReturn.totalAmount ?? 0
                            ),
                        0
                    );

                const currentSaleAmount =
                    Number(
                        sale.totalAmount ?? 0
                    );

                const originalSaleAmount =
                    currentSaleAmount +
                    totalReturned;

                return {
                    ...sale,

                    originalTotalAmount:
                        Number(
                            originalSaleAmount.toFixed(2)
                        ),

                    totalReturned:
                        Number(
                            totalReturned.toFixed(2)
                        ),
                };
            });

        // ======================================
        // TOTAL ORIGINAL SALES
        // ======================================

        const totalSales =
            salesWithOriginalAmount.reduce(
                (sum, sale) =>
                    sum +
                    Number(
                        sale.originalTotalAmount
                    ),
                0
            );

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        const totalCustomerPayments =
            customer.payments.reduce(
                (sum, payment) =>
                    sum +
                    Number(payment.amount ?? 0),
                0
            );

        // ======================================
        // SALE RETURN TOTALS
        // ======================================

        const totalSaleReturns =
            customer.saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.totalAmount ?? 0
                    ),
                0
            );

        const totalCashReturned =
            customer.saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.cashReturned ?? 0
                    ),
                0
            );

        const totalDueAdjusted =
            customer.saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.adjustedDue ?? 0
                    ),
                0
            );

        // ======================================
        // TOTAL SALE RETURN ALLOCATION
        // ======================================

        const totalReturnSettlement =
            totalCashReturned +
            totalDueAdjusted;

        // ======================================
        // CURRENT CUSTOMER BALANCE
        // ======================================
        //
        // Customer owes shop:
        //
        // Opening Due
        // + Original Sales
        // - Payments
        // - Return amount
        //
        // NOTE:
        //
        // Return amount itself is deducted from
        // receivable.
        //
        // Cash returned may create a negative
        // balance if the customer had already
        // completely paid.
        //
        // ======================================

        const closingBalance =
            openingDue +
            totalSales -
            totalCustomerPayments -
            totalSaleReturns;

        // ======================================
        // LEDGER
        // ======================================

        type LedgerEntry = {
            id: string;

            date: Date;

            type:
            | "Opening Balance"
            | "Sale"
            | "Payment"
            | "Sale Return"
            | "Cash Refund";

            reference: string;

            description: string;

            debit: number;

            credit: number;

            balance: number;

            sortOrder: number;
        };

        const ledger: LedgerEntry[] = [];

        // ======================================
        // OPENING BALANCE
        // ======================================

        if (openingDue !== 0) {
            ledger.push({
                id:
                    `opening-${customer.id}`,

                date:
                    customer.createdAt,

                type:
                    "Opening Balance",

                reference: "-",

                description:
                    "Opening customer due",

                debit:
                    Number(
                        openingDue.toFixed(2)
                    ),

                credit: 0,

                balance: 0,

                sortOrder: 0,
            });
        }

        // ======================================
        // SALES
        // ======================================

        for (
            const sale of
            salesWithOriginalAmount
        ) {
            ledger.push({
                id:
                    `sale-${sale.id}`,

                date:
                    sale.saleDate,

                type:
                    "Sale",

                reference:
                    sale.invoiceNo,

                description:
                    `Sale - ${sale.invoiceNo}`,

                debit:
                    Number(
                        sale.originalTotalAmount.toFixed(
                            2
                        )
                    ),

                credit: 0,

                balance: 0,

                sortOrder: 1,
            });
        }

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        for (
            const payment of
            customer.payments
        ) {
            ledger.push({
                id:
                    `payment-${payment.id}`,

                date:
                    payment.paymentDate,

                type:
                    "Payment",

                reference:
                    String(payment.id),

                description:
                    `Cash Received - Invoice ${payment.saleId
                    }`,

                debit: 0,

                credit:
                    Number(
                        payment.amount ?? 0
                    ),

                balance: 0,

                sortOrder: 2,
            });
        }

        // ======================================
        // SALE RETURNS
        // ======================================
        //
        // ONE SALE RETURN ENTRY ONLY.
        //
        // We do NOT reduce the original Sale entry.
        //
        // Example:
        //
        // Sale       ৳400 Debit
        // Payment    ৳300 Credit
        // Return     ৳200 Credit
        //
        // This means customer is entitled to
        // ৳200 back from the shop.
        //
        // ======================================

        for (
            const saleReturn of
            customer.saleReturns
        ) {
            const returnAmount =
                Number(
                    saleReturn.totalAmount ?? 0
                );

            if (returnAmount <= 0) {
                continue;
            }

            ledger.push({
                id:
                    `sale-return-${saleReturn.id}`,

                date:
                    saleReturn.returnDate,

                type:
                    "Sale Return",

                reference:
                    String(
                        saleReturn.sale.invoiceNo
                    ),

                description:
                    `Sale Return - ${saleReturn.sale.invoiceNo
                    }`,

                debit: 0,

                credit:
                    Number(
                        returnAmount.toFixed(2)
                    ),

                balance: 0,

                sortOrder: 3,
            });
        }

        // ======================================
        // CASH REFUNDS
        // ======================================
        //
        // Cash refund is NOT another Sale Return.
        //
        // It is a separate cash movement.
        //
        // Example:
        //
        // Sale Return = ৳200
        // Due Adjusted = ৳100
        // Cash Refund = ৳100
        //
        // The Sale Return remains ৳200.
        //
        // Cash Refund is shown separately.
        //
        // ======================================

        for (
            const saleReturn of
            customer.saleReturns
        ) {
            const cashReturned =
                Number(
                    saleReturn.cashReturned ?? 0
                );

            if (cashReturned <= 0) {
                continue;
            }

            ledger.push({
                id:
                    `cash-refund-${saleReturn.id}`,

                date:
                    saleReturn.returnDate,

                type:
                    "Cash Refund",

                reference:
                    String(
                        saleReturn.sale.invoiceNo
                    ),

                description:
                    `Cash Refund - ${saleReturn.sale.invoiceNo
                    }`,

                // ====================================
                // Debit means customer owes shop.
                //
                // So cash returned to customer is
                // represented as a DEBIT here to
                // offset the return credit.
                //
                // ====================================

                debit:
                    Number(
                        cashReturned.toFixed(2)
                    ),

                credit: 0,

                balance: 0,

                sortOrder: 4,
            });
        }

        // ======================================
        // SORT LEDGER
        // ======================================

        ledger.sort(
            (a, b) => {
                const dateDifference =
                    new Date(a.date).getTime() -
                    new Date(b.date).getTime();

                if (
                    dateDifference !== 0
                ) {
                    return dateDifference;
                }

                if (
                    a.sortOrder !==
                    b.sortOrder
                ) {
                    return (
                        a.sortOrder -
                        b.sortOrder
                    );
                }

                return a.id.localeCompare(
                    b.id
                );
            }
        );

        // ======================================
        // RUNNING BALANCE
        // ======================================

        let balance = 0;

        for (
            const entry of ledger
        ) {
            balance =
                balance +
                entry.debit -
                entry.credit;

            entry.balance =
                Number(
                    balance.toFixed(2)
                );
        }

        // ======================================
        // NET RETURN DUE / CASH POSITION
        // ======================================
        //
        // Total return:
        // ৳200
        //
        // Due adjusted:
        // ৳100
        //
        // Cash returned:
        // ৳100
        //
        // Remaining:
        // ৳0
        //
        // ======================================

        const remainingReturnAmount =
            totalSaleReturns -
            totalDueAdjusted -
            totalCashReturned;

        // ======================================
        // RESPONSE
        // ======================================

        return NextResponse.json({
            customer: {
                id:
                    customer.id,

                name:
                    customer.name,

                phone:
                    customer.phone,

                address:
                    customer.address,
            },

            summary: {
                openingDue:
                    Number(
                        openingDue.toFixed(2)
                    ),

                // Original sales remain intact
                totalSales:
                    Number(
                        totalSales.toFixed(2)
                    ),

                totalPayments:
                    Number(
                        totalCustomerPayments.toFixed(
                            2
                        )
                    ),

                totalSaleReturns:
                    Number(
                        totalSaleReturns.toFixed(
                            2
                        )
                    ),

                totalCashReturned:
                    Number(
                        totalCashReturned.toFixed(
                            2
                        )
                    ),

                totalDueAdjusted:
                    Number(
                        totalDueAdjusted.toFixed(
                            2
                        )
                    ),

                totalReturnSettlement:
                    Number(
                        totalReturnSettlement.toFixed(
                            2
                        )
                    ),

                remainingReturnAmount:
                    Number(
                        Math.max(
                            0,
                            remainingReturnAmount
                        ).toFixed(2)
                    ),

                closingBalance:
                    Number(
                        balance.toFixed(2)
                    ),
            },

            // ======================================
            // SALES
            // ======================================

            sales:
                salesWithOriginalAmount,

            // ======================================
            // PAYMENTS
            // ======================================

            payments:
                customer.payments,

            // ======================================
            // RETURN HISTORY
            // ======================================

            saleReturns:
                customer.saleReturns,

            // ======================================
            // LEDGER
            // ======================================

            ledger: ledger.map(
                (entry) => ({
                    date:
                        entry.date,

                    type:
                        entry.type,

                    reference:
                        entry.reference,

                    description:
                        entry.description,

                    debit:
                        entry.debit,

                    credit:
                        entry.credit,

                    balance:
                        entry.balance,
                })
            ),
        });
    } catch (error: unknown) {
        console.error(
            "Customer details error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to fetch customer details",

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