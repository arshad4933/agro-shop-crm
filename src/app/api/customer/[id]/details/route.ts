import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
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

        const sales =
            await prisma.sale.findMany({
                where: {
                    customerId,
                },

                include: {
                    items: true,
                },

                orderBy: {
                    saleDate: "desc",
                },
            });

        // ======================================
        // PAYMENTS
        // ======================================

        const payments =
            await prisma.salePayment.findMany({
                where: {
                    customerId,
                },

                include: {
                    sale: true,
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
                    customerId,
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

                orderBy: {
                    returnDate: "asc",
                },
            });

        // ======================================
        // SUMMARY
        // ======================================

        const totalPurchase = sales.reduce(
            (
                sum: number,
                sale: any
            ) =>
                sum +
                Number(
                    sale.totalAmount
                ),
            0
        );

        const totalPaid = sales.reduce(
            (
                sum: number,
                sale: any
            ) =>
                sum +
                Number(
                    sale.paidAmount
                ),
            0
        );

        const currentDue = sales.reduce(
            (
                sum: number,
                sale: any
            ) =>
                sum +
                Number(
                    sale.dueAmount
                ),
            0
        );

        const totalSaleReturn =
            saleReturns.reduce(
                (
                    sum: number,
                    saleReturn: any
                ) =>
                    sum +
                    Number(
                        saleReturn.totalAmount
                    ),
                0
            );

        const totalReturnCash =
            saleReturns.reduce(
                (
                    sum: number,
                    saleReturn: any
                ) =>
                    sum +
                    Number(
                        saleReturn.cashReturned
                    ),
                0
            );

        const totalReturnDue =
            saleReturns.reduce(
                (
                    sum: number,
                    saleReturn: any
                ) =>
                    sum +
                    Number(
                        saleReturn.adjustedDue
                    ),
                0
            );

        const dueInvoices = sales.filter(
            (sale: any) =>
                Number(
                    sale.dueAmount
                ) > 0
        );

        // ======================================
        // LEDGER
        // ======================================

        const ledger: any[] = [];

        // ======================================
        // SALE ENTRY
        // ======================================

        sales.forEach((sale: any) => {
            ledger.push({
                id: `sale-${sale.id}`,

                date: sale.saleDate,

                sortOrder: 1,

                particular:
                    `Sale (${sale.invoiceNo})`,

                debit: Number(
                    sale.totalAmount
                ),

                credit: 0,
            });
        });

        // ======================================
        // PAYMENT ENTRY
        // ======================================

        payments.forEach(
            (payment: any) => {
                ledger.push({
                    id: `payment-${payment.id}`,

                    date:
                        payment.paymentDate,

                    sortOrder:
                        payment.paymentType ===
                            "SALE"
                            ? 2
                            : 3,

                    particular:
                        payment.paymentType ===
                            "SALE"
                            ? `Cash Received (${payment.sale?.invoiceNo})`
                            : `Due Payment (${payment.sale?.invoiceNo})`,

                    debit: 0,

                    credit: Number(
                        payment.amount
                    ),
                });
            }
        );

        // ======================================
        // SALE RETURN ENTRY
        // ======================================

        saleReturns.forEach(
            (saleReturn: any) => {
                ledger.push({
                    id: `sale-return-${saleReturn.id}`,

                    date:
                        saleReturn.returnDate,

                    sortOrder: 4,

                    particular:
                        `Sale Return (${saleReturn.sale?.invoiceNo})`,

                    debit: 0,

                    credit: Number(
                        saleReturn.totalAmount
                    ),

                    returnCash:
                        Number(
                            saleReturn.cashReturned
                        ),

                    returnDue:
                        Number(
                            saleReturn.adjustedDue
                        ),
                });
            }
        );

        // ======================================
        // SORT
        // ======================================

        ledger.sort((a, b) => {
            const dateDiff =
                new Date(a.date).getTime() -
                new Date(b.date).getTime();

            if (dateDiff !== 0) {
                return dateDiff;
            }

            return (
                a.sortOrder -
                b.sortOrder
            );
        });

        // ======================================
        // RUNNING BALANCE
        // ======================================

        let runningBalance = 0;

        ledger.forEach((entry) => {
            runningBalance += Number(
                entry.debit || 0
            );

            runningBalance -= Number(
                entry.credit || 0
            );

            entry.balance = Number(
                runningBalance.toFixed(2)
            );
        });

        // ======================================
        // RESPONSE
        // ======================================

        return NextResponse.json({
            customer,

            summary: {
                totalPurchase:
                    Number(
                        totalPurchase.toFixed(
                            2
                        )
                    ),

                totalPaid:
                    Number(
                        totalPaid.toFixed(
                            2
                        )
                    ),

                currentDue:
                    Number(
                        currentDue.toFixed(
                            2
                        )
                    ),

                invoiceCount:
                    sales.length,

                totalSaleReturn:
                    Number(
                        totalSaleReturn.toFixed(
                            2
                        )
                    ),

                totalReturnCash:
                    Number(
                        totalReturnCash.toFixed(
                            2
                        )
                    ),

                totalReturnDue:
                    Number(
                        totalReturnDue.toFixed(
                            2
                        )
                    ),
            },

            purchaseHistory: sales,

            paymentHistory: payments,

            saleReturns,

            dueInvoices,

            ledger,
        });
    } catch (error) {
        console.error(
            "Customer details error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}