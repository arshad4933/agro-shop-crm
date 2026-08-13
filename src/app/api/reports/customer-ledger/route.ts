import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } =
            new URL(request.url);

        const customerId =
            searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json(
                {
                    message:
                        "customerId is required",
                },
                {
                    status: 400,
                }
            );
        }

        const parsedCustomerId =
            Number(customerId);

        if (!Number.isInteger(parsedCustomerId)) {
            return NextResponse.json(
                {
                    message:
                        "Invalid customerId",
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
                    id: parsedCustomerId,
                },
            });

        if (!customer) {
            return NextResponse.json(
                {
                    message:
                        "Customer not found",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================
        // SALES
        // ======================================

        const sales =
            await prisma.sale.findMany({
                where: {
                    customerId:
                        parsedCustomerId,
                },

                include: {
                    saleReturns: {
                        orderBy: {
                            returnDate: "asc",
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
                    customerId:
                        parsedCustomerId,
                },

                orderBy: {
                    paymentDate: "asc",
                },
            });

        // ======================================
        // SALE RETURNS
        // ======================================

        const saleReturns =
            await prisma.saleReturn.findMany({
                where: {
                    customerId:
                        parsedCustomerId,
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

            date: Date | null;

            type: string;

            reference:
            | string
            | number;

            debit: number;

            credit: number;

            balance: number;

            sortOrder: number;
        };

        const ledger:
            LedgerEntry[] = [];

        // ======================================
        // OPENING BALANCE
        // ======================================

        const openingDue =
            Number(
                customer.openingDue ?? 0
            );

        if (openingDue !== 0) {

            ledger.push({
                id:
                    `opening-${customer.id}`,

                date:
                    customer.createdAt,

                type:
                    "Opening Balance",

                reference:
                    "-",

                debit:
                    openingDue,

                credit:
                    0,

                balance:
                    0,

                sortOrder:
                    0,
            });
        }

        // ======================================
        // SALES
        // ======================================
        //
        // IMPORTANT:
        //
        // sale.totalAmount এখন original invoice
        // amount হিসেবে থাকবে।
        //
        // তাই এখানে return যোগ করে আবার
        // original amount বের করার দরকার নেই।
        //
        // Example:
        //
        // Original Sale = 400
        // Return = 200
        //
        // Ledger Sale = 400
        //
        // ======================================

        for (const sale of sales) {

            ledger.push({
                id:
                    `sale-${sale.id}`,

                date:
                    sale.saleDate,

                type:
                    "Sale",

                reference:
                    sale.invoiceNo,

                debit:
                    Number(
                        Number(
                            sale.totalAmount
                        ).toFixed(2)
                    ),

                credit:
                    0,

                balance:
                    0,

                sortOrder:
                    1,
            });
        }

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        for (const payment of payments) {

            ledger.push({
                id:
                    `payment-${payment.id}`,

                date:
                    payment.paymentDate,

                type:
                    "Cash Received",

                reference:
                    payment.saleId,

                debit:
                    0,

                credit:
                    Number(
                        Number(
                            payment.amount
                        ).toFixed(2)
                    ),

                balance:
                    0,

                sortOrder:
                    2,
            });
        }

        // ======================================
        // SALE RETURNS
        // ======================================
        //
        // Return total পুরোটা CREDIT হবে।
        //
        // কারণ return হলে customer-এর
        // payable/receivable কমে।
        //
        // Example:
        //
        // Sale = 400
        // Paid = 300
        // Balance = 100
        //
        // Return = 200
        // Balance = -100
        //
        // এরপর cash refund = 100
        // Balance = 0
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

            // ==================================
            // SALE RETURN
            // ==================================

            ledger.push({
                id:
                    `sale-return-${saleReturn.id}`,

                date:
                    saleReturn.returnDate,

                type:
                    "Sale Return",

                reference:
                    saleReturn.id,

                debit:
                    0,

                credit:
                    Number(
                        returnAmount.toFixed(2)
                    ),

                balance:
                    0,

                sortOrder:
                    3,
            });

            // ==================================
            // CASH REFUND
            // ==================================
            //
            // Customer-কে cash ফেরত দিলে
            // সেই credit balance settle হয়।
            //
            // তাই Cash Refund = DEBIT
            //
            // ==================================

            if (cashReturned > 0) {

                ledger.push({
                    id:
                        `cash-refund-${saleReturn.id}`,

                    date:
                        saleReturn.returnDate,

                    type:
                        "Cash Refund",

                    reference:
                        saleReturn.id,

                    debit:
                        Number(
                            cashReturned.toFixed(2)
                        ),

                    credit:
                        0,

                    balance:
                        0,

                    sortOrder:
                        4,
                });
            }
        }

        // ======================================
        // SORT
        // ======================================

        ledger.sort((a, b) => {

            if (!a.date && !b.date) {
                return 0;
            }

            if (!a.date) {
                return -1;
            }

            if (!b.date) {
                return 1;
            }

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

            entry.balance =
                Number(
                    balance.toFixed(2)
                );
        }

        // ======================================
        // TOTAL SALES
        // ======================================
        //
        // Original invoice total
        //
        // Return বাদ দিয়ে total sales
        // কমানো হবে না।
        //
        // ======================================

        const totalSales =
            sales.reduce(
                (sum, sale) => {

                    return (
                        sum +
                        Number(
                            sale.totalAmount ?? 0
                        )
                    );
                },
                0
            );

        // ======================================
        // TOTAL PAYMENTS
        // ======================================

        const totalPayments =
            payments.reduce(
                (sum, payment) => {

                    return (
                        sum +
                        Number(
                            payment.amount ?? 0
                        )
                    );
                },
                0
            );

        // ======================================
        // TOTAL RETURN
        // ======================================

        const totalSaleReturns =
            saleReturns.reduce(
                (
                    sum,
                    saleReturn
                ) => {

                    return (
                        sum +
                        Number(
                            saleReturn.totalAmount ??
                            0
                        )
                    );
                },
                0
            );

        // ======================================
        // TOTAL CASH REFUND
        // ======================================

        const totalCashRefund =
            saleReturns.reduce(
                (
                    sum,
                    saleReturn
                ) => {

                    return (
                        sum +
                        Number(
                            saleReturn.cashReturned ??
                            0
                        )
                    );
                },
                0
            );

        // ======================================
        // TOTAL DUE ADJUSTMENT
        // ======================================

        const totalDueAdjustment =
            saleReturns.reduce(
                (
                    sum,
                    saleReturn
                ) => {

                    return (
                        sum +
                        Number(
                            saleReturn.adjustedDue ??
                            0
                        )
                    );
                },
                0
            );

        // ======================================
        // CURRENT DUE INVOICES
        // ======================================

        const currentDueInvoices =
            sales
                .map((sale) => {

                    const saleReturnDueAdjustment =
                        sale.saleReturns.reduce(
                            (
                                sum,
                                saleReturn
                            ) => {

                                return (
                                    sum +
                                    Number(
                                        saleReturn.adjustedDue ??
                                        0
                                    )
                                );
                            },
                            0
                        );

                    const currentDue =
                        Number(
                            sale.dueAmount ?? 0
                        ) -
                        saleReturnDueAdjustment;

                    return {
                        id:
                            sale.id,

                        invoiceNo:
                            sale.invoiceNo,

                        saleDate:
                            sale.saleDate,

                        totalAmount:
                            Number(
                                Number(
                                    sale.totalAmount
                                ).toFixed(2)
                            ),

                        dueAmount:
                            Number(
                                Math.max(
                                    0,
                                    currentDue
                                ).toFixed(2)
                            ),
                    };
                })
                .filter(
                    (sale) =>
                        sale.dueAmount >
                        0.01
                );

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

                totalSales:
                    Number(
                        totalSales.toFixed(2)
                    ),

                totalPayments:
                    Number(
                        totalPayments.toFixed(2)
                    ),

                totalSaleReturns:
                    Number(
                        totalSaleReturns.toFixed(2)
                    ),

                totalCashRefund:
                    Number(
                        totalCashRefund.toFixed(2)
                    ),

                totalDueAdjustment:
                    Number(
                        totalDueAdjustment.toFixed(2)
                    ),

                closingBalance:
                    Number(
                        balance.toFixed(2)
                    ),
            },

            currentDueInvoices,

            ledger:
                ledger.map(
                    (entry) => ({

                        date:
                            entry.date,

                        type:
                            entry.type,

                        reference:
                            entry.reference,

                        debit:
                            entry.debit,

                        credit:
                            entry.credit,

                        balance:
                            entry.balance,
                    })
                ),
        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message:
                    "Failed to fetch customer ledger",

                error:
                    error.message,
            },
            {
                status: 500,
            }
        );
    }
}