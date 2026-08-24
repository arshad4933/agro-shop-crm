import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// CUSTOMER LEDGER
// ======================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json(
                {
                    message: "customerId is required",
                },
                {
                    status: 400,
                }
            );
        }

        const parsedCustomerId = Number(customerId);

        if (!Number.isInteger(parsedCustomerId)) {
            return NextResponse.json(
                {
                    message: "Invalid customerId",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================
        // CUSTOMER
        // ======================================

        const customer = await prisma.customer.findUnique({
            where: {
                id: parsedCustomerId,
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
        // SALES
        // ======================================

        const sales = await prisma.sale.findMany({
            where: {
                customerId: parsedCustomerId,
            },

            include: {
                items: true,

                saleReturns: {
                    orderBy: {
                        returnDate: "asc",
                    },

                    include: {
                        items: true,
                    },
                },

                salePayments: {
                    orderBy: {
                        paymentDate: "asc",
                    },
                },
            },

            orderBy: {
                saleDate: "asc",
            },
        });

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        const payments =
            await prisma.customerPayment.findMany({
                where: {
                    customerId: parsedCustomerId,
                },

                orderBy: {
                    paymentDate: "asc",
                },
            });

        // ======================================
        // ALL SALE RETURNS
        // ======================================

        const saleReturns =
            await prisma.saleReturn.findMany({
                where: {
                    customerId: parsedCustomerId,
                },

                include: {
                    sale: true,

                    items: true,
                },

                orderBy: {
                    returnDate: "asc",
                },
            });

        // ======================================
        // LEDGER TYPE
        // ======================================

        type LedgerEntry = {
            id: string;
            date: Date;
            type: string;
            reference: string | number;
            debit: number;
            credit: number;
            balance: number;
            sortOrder: number;
            description?: string;
        };

        const ledger: LedgerEntry[] = [];

        // ======================================
        // OPENING DUE
        // ======================================

        const openingDue =
            Number(customer.openingDue ?? 0);

        if (openingDue !== 0) {
            ledger.push({
                id: `opening-${customer.id}`,

                date: customer.createdAt,

                type: "Opening Balance",

                reference: "-",

                debit: openingDue,

                credit: 0,

                balance: 0,

                sortOrder: 0,

                description: "Opening Balance",
            });
        }

        // ======================================
        // SALES
        // ======================================
        //
        // IMPORTANT:
        //
        // NEVER use sale.totalAmount here as the
        // original invoice amount.
        //
        // Original amount is calculated from
        // SaleItem totalPrice.
        //
        // This keeps:
        //
        // Original Sale = 400
        //
        // even after:
        //
        // Return = 200
        //
        // ======================================

        for (const sale of sales) {
            const itemTotal = sale.items.reduce(
                (sum, item) =>
                    sum + Number(item.totalPrice ?? 0),
                0
            );

            const discount =
                Number(sale.discount ?? 0);

            const originalSaleAmount =
                itemTotal - discount;

            ledger.push({
                id: `sale-${sale.id}`,

                date: sale.saleDate,

                type: "Sale",

                reference: sale.invoiceNo,

                debit: Number(
                    originalSaleAmount.toFixed(2)
                ),

                credit: 0,

                balance: 0,

                sortOrder: 1,

                description:
                    `Sale (${sale.invoiceNo})`,
            });
        }

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        for (const payment of payments) {
            ledger.push({
                id: `payment-${payment.id}`,

                date: payment.paymentDate,

                type: "Payment",

                reference: payment.id,

                debit: 0,

                credit: Number(
                    payment.amount ?? 0
                ),

                balance: 0,

                sortOrder: 2,

                description:
                    `Cash Received`,
            });
        }

        // ======================================
        // SALE RETURNS
        // ======================================
        //
        // Return-এর total amount customer-এর
        // account থেকে কমাবে।
        //
        // কিন্তু invoice-এর original sale
        // amount কমাবে না।
        //
        // Example:
        //
        // Sale       = 400
        // Payment    = 300
        // Due        = 100
        //
        // Return     = 200
        // Cash       = 100
        // Due adjust = 100
        //
        // Return-এর credit = 200
        //
        // Final balance:
        //
        // 400 - 300 - 200 = -100
        //
        // অর্থাৎ customer-এর কাছে দোকানের
        // ৳100 পাওনা থাকবে।
        //
        // ======================================

        for (const saleReturn of saleReturns) {
            const returnAmount =
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
            // SAFETY CHECK
            // ======================================
            //
            // Normally:
            //
            // totalAmount =
            // cashReturned + adjustedDue
            //
            // ======================================

            const creditAmount =
                cashReturned +
                adjustedDue;

            ledger.push({
                id: `sale-return-${saleReturn.id}`,

                date: saleReturn.returnDate,

                type: "Sale Return",

                reference:
                    saleReturn.sale?.invoiceNo ??
                    saleReturn.id,

                debit: 0,

                credit: Number(
                    creditAmount.toFixed(2)
                ),

                balance: 0,

                sortOrder: 3,

                description:
                    `Sale Return (${saleReturn.sale?.invoiceNo ??
                    saleReturn.id
                    })`,
            });
        }

        // ======================================
        // SORT LEDGER
        // ======================================

        ledger.sort((a, b) => {
            const dateDifference =
                new Date(a.date).getTime() -
                new Date(b.date).getTime();

            if (dateDifference !== 0) {
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
        });

        // ======================================
        // RUNNING BALANCE
        // ======================================

        let balance = 0;

        for (const entry of ledger) {
            balance =
                balance +
                entry.debit -
                entry.credit;

            entry.balance = Number(
                balance.toFixed(2)
            );
        }

        // ======================================
        // TOTAL SALES
        // ======================================

        const totalSales = sales.reduce(
            (sum, sale) => {
                const itemTotal =
                    sale.items.reduce(
                        (itemSum, item) =>
                            itemSum +
                            Number(
                                item.totalPrice ?? 0
                            ),
                        0
                    );

                const discount =
                    Number(
                        sale.discount ?? 0
                    );

                return (
                    sum +
                    itemTotal -
                    discount
                );
            },
            0
        );

        // ======================================
        // TOTAL PAYMENTS
        // ======================================

        const totalPayments =
            payments.reduce(
                (sum, payment) =>
                    sum +
                    Number(
                        payment.amount ?? 0
                    ),
                0
            );

        // ======================================
        // TOTAL SALE RETURNS
        // ======================================

        const totalSaleReturns =
            saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.totalAmount ??
                        0
                    ),
                0
            );

        // ======================================
        // TOTAL CASH RETURNED
        // ======================================

        const totalCashReturned =
            saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.cashReturned ??
                        0
                    ),
                0
            );

        // ======================================
        // TOTAL DUE ADJUSTED
        // ======================================

        const totalDueAdjusted =
            saleReturns.reduce(
                (sum, saleReturn) =>
                    sum +
                    Number(
                        saleReturn.adjustedDue ??
                        0
                    ),
                0
            );

        // ======================================
        // ORIGINAL CUSTOMER LIABILITY
        // ======================================

        const originalReceivable =
            openingDue +
            totalSales;

        // ======================================
        // FINAL BALANCE
        // ======================================

        const closingBalance =
            originalReceivable -
            totalPayments -
            totalSaleReturns;

        // ======================================
        // RESPONSE
        // ======================================

        return NextResponse.json({
            customer: {
                id: customer.id,

                name: customer.name,

                phone: customer.phone,

                address: customer.address,
            },

            summary: {
                openingDue: Number(
                    openingDue.toFixed(2)
                ),

                totalSales: Number(
                    totalSales.toFixed(2)
                ),

                totalPayments: Number(
                    totalPayments.toFixed(2)
                ),

                totalSaleReturns: Number(
                    totalSaleReturns.toFixed(2)
                ),

                totalCashReturned: Number(
                    totalCashReturned.toFixed(2)
                ),

                totalDueAdjusted: Number(
                    totalDueAdjusted.toFixed(2)
                ),

                closingBalance: Number(
                    closingBalance.toFixed(2)
                ),
            },

            ledger: ledger.map(
                (entry) => ({
                    date: entry.date,

                    type: entry.type,

                    reference:
                        entry.reference,

                    debit: entry.debit,

                    credit: entry.credit,

                    balance:
                        entry.balance,

                    description:
                        entry.description,
                })
            ),
        });
    } catch (error: any) {
        console.error(
            "Customer Ledger Error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to fetch customer ledger",

                error:
                    error?.message ??
                    String(error),
            },
            {
                status: 500,
            }
        );
    }
}