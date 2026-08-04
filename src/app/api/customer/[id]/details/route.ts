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

        const payments = await prisma.salePayment.findMany({
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

        // =======================
        // LEDGER
        // =======================

        const ledger: any[] = [];

        // Sale Entry
        sales.forEach((sale: any) => {

            ledger.push({
                id: `sale-${sale.id}`,
                date: sale.saleDate,
                sortOrder: 1,
                particular: `Sale (${sale.invoiceNo})`,
                debit: Number(sale.totalAmount),
                credit: 0,
            });

        });

        // Payment Entry (Sale + Due)
        payments.forEach((payment: any) => {

            ledger.push({
                id: `payment-${payment.id}`,
                date: payment.paymentDate,
                sortOrder:
                    payment.paymentType === "SALE"
                        ? 2
                        : 3,

                particular:
                    payment.paymentType === "SALE"
                        ? `Cash Received (${payment.sale?.invoiceNo})`
                        : `Due Payment (${payment.sale?.invoiceNo})`,

                debit: 0,
                credit: Number(payment.amount),
            });

        });

        // Sort
        ledger.sort((a, b) => {

            const dateDiff =
                new Date(a.date).getTime() -
                new Date(b.date).getTime();

            if (dateDiff !== 0) {
                return dateDiff;
            }

            return a.sortOrder - b.sortOrder;

        });

        // Running Balance
        let runningBalance = 0;

        ledger.forEach((entry) => {

            runningBalance += Number(entry.debit);

            runningBalance -= Number(entry.credit);

            entry.balance = runningBalance;

        });
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