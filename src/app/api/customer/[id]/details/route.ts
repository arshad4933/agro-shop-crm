import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const { id } = await params;

        const customerId = Number(id);

        const customer = await prisma.customer.findUnique({
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

        const sales = await prisma.sale.findMany({
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

        const payments = await prisma.customerPayment.findMany({
            where: {
                customerId,
            },
            include: {
                sale: true,
            },
            orderBy: {
                paymentDate: "desc",
            },
        });

        const totalPurchase = sales.reduce(
            (sum: number, sale: any) => sum + Number(sale.totalAmount),
            0
        );
        const totalPaid = sales.reduce(
            (sum: number, sale: any) => sum + Number(sale.paidAmount),
            0
        );

        const currentDue = sales.reduce(
            (sum: number, sale: any) => sum + Number(sale.dueAmount),
            0
        );

        const dueInvoices = sales.filter(
            (sale: any) => Number(sale.dueAmount) > 0
        );

        const ledger: any[] = [];

        let runningBalance = 0;

        // সব Sale Entry
        sales
            .sort(
                (a, b) =>
                    new Date(a.saleDate).getTime() -
                    new Date(b.saleDate).getTime()
            )
            .forEach((sale: any) => {

                // Sale (Debit)
                runningBalance += Number(sale.totalAmount);

                ledger.push({
                    id: `sale-${sale.id}`,
                    date: sale.saleDate,
                    particular: `Sale (${sale.invoiceNo})`,
                    debit: Number(sale.totalAmount),
                    credit: 0,
                    balance: runningBalance,
                });

                // Invoice-এর সময় Cash Received
                if (Number(sale.paidAmount) > 0) {

                    runningBalance -= Number(sale.paidAmount);

                    ledger.push({
                        id: `sale-paid-${sale.id}`,
                        date: sale.saleDate,
                        particular: `Cash Received (${sale.invoiceNo})`,
                        debit: 0,
                        credit: Number(sale.paidAmount),
                        balance: runningBalance,
                    });

                }

            });

        // সব Due Payment Entry
        payments
            .sort(
                (a, b) =>
                    new Date(a.paymentDate).getTime() -
                    new Date(b.paymentDate).getTime()
            )
            .forEach((payment: any) => {

                runningBalance -= Number(payment.amount);

                ledger.push({
                    id: `payment-${payment.id}`,
                    date: payment.paymentDate,
                    particular: `Due Payment (${payment.sale?.invoiceNo})`,
                    debit: 0,
                    credit: Number(payment.amount),
                    balance: runningBalance,
                });

            });

        // Final Sort
        ledger.sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        );

        return NextResponse.json({
            customer,

            summary: {
                totalPurchase,
                totalPaid,
                currentDue,
                invoiceCount: sales.length,
            },

            purchaseHistory: sales,

            paymentHistory: payments,

            dueInvoices,

            ledger,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}