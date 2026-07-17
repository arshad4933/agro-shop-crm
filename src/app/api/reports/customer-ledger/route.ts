import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        const customer = await prisma.customer.findUnique({
            where: {
                id: Number(customerId),
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

        const sales = await prisma.sale.findMany({
            where: {
                customerId: Number(customerId),
            },
            orderBy: {
                saleDate: "asc",
            },
        });

        const payments = await prisma.customerPayment.findMany({
            where: {
                customerId: Number(customerId),
            },
            orderBy: {
                paymentDate: "asc",
            },
        });

        const saleReturns = await prisma.saleReturn.findMany({
            where: {
                customerId: Number(customerId),
            },
            orderBy: {
                returnDate: "asc",
            },
        });

        let ledger: any[] = [];

        let balance = Number(customer.openingDue);

        ledger.push({
            date: null,
            type: "Opening Balance",
            reference: "-",
            debit: Number(customer.openingDue),
            credit: 0,
            balance,
        });
        // ==========================
        // SALES
        // ==========================

        for (const sale of sales) {

            balance += Number(sale.totalAmount);

            ledger.push({

                date: sale.saleDate,

                type: "Sale",

                reference: sale.invoiceNo,

                debit: Number(sale.totalAmount),

                credit: 0,

                balance,

            });
        }

        // ==========================
        // CUSTOMER PAYMENTS
        // ==========================

        for (const payment of payments) {

            balance -= Number(payment.amount);

            ledger.push({

                date: payment.paymentDate,

                type: "Payment",

                reference: payment.id,

                debit: 0,

                credit: Number(payment.amount),

                balance,

            });
        }

        // ==========================
        // SALE RETURNS
        // ==========================

        for (const item of saleReturns) {

            const totalCredit =
                Number(item.cashReturned) +
                Number(item.adjustedDue);

            balance -= totalCredit;

            ledger.push({

                date: item.returnDate,

                type: "Sale Return",

                reference: item.id,

                debit: 0,

                credit: totalCredit,

                balance,

            });
        }

        // ==========================
        // SORT BY DATE
        // ==========================

        ledger.sort((a, b) => {

            if (!a.date) return -1;

            if (!b.date) return 1;

            return (
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
            );
        });
        // ==========================
        // RESPONSE
        // ==========================

        return NextResponse.json({

            customer: {

                id: customer.id,

                name: customer.name,

                phone: customer.phone,

                address: customer.address,

            },

            summary: {

                openingDue: Number(customer.openingDue),

                totalSales: sales.reduce(
                    (sum, s) => sum + Number(s.totalAmount),
                    0
                ),

                totalPayments: payments.reduce(
                    (sum, p) => sum + Number(p.amount),
                    0
                ),

                totalSaleReturns: saleReturns.reduce(
                    (sum, r) =>
                        sum +
                        Number(r.cashReturned) +
                        Number(r.adjustedDue),
                    0
                ),

                closingBalance: balance,

            },

            ledger,

        });

    } catch (error: any) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch customer ledger",
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }
}