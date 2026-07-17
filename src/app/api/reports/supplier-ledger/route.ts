import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const supplierId = searchParams.get("supplierId");

        if (!supplierId) {
            return NextResponse.json(
                {
                    message: "supplierId is required",
                },
                {
                    status: 400,
                }
            );
        }

        const supplier = await prisma.supplier.findUnique({
            where: {
                id: Number(supplierId),
            },
        });

        if (!supplier) {
            return NextResponse.json(
                {
                    message: "Supplier not found",
                },
                {
                    status: 404,
                }
            );
        }

        const purchases = await prisma.purchase.findMany({
            where: {
                supplierId: Number(supplierId),
            },
            orderBy: {
                purchaseDate: "asc",
            },
        });

        const payments = await prisma.supplierPayment.findMany({
            where: {
                supplierId: Number(supplierId),
            },
            orderBy: {
                paymentDate: "asc",
            },
        });

        const purchaseReturns = await prisma.purchaseReturn.findMany({
            where: {
                supplierId: Number(supplierId),
            },
            orderBy: {
                returnDate: "asc",
            },
        });

        let ledger: any[] = [];

        let balance = Number(supplier.openingDue);

        ledger.push({
            date: null,
            type: "Opening Balance",
            reference: "-",
            debit: Number(supplier.openingDue),
            credit: 0,
            balance,
        });
        // ==========================
        // PURCHASES
        // ==========================

        for (const purchase of purchases) {

            balance += Number(purchase.totalAmount);

            ledger.push({
                date: purchase.purchaseDate,
                type: "Purchase",
                reference: purchase.purchaseNo,
                debit: Number(purchase.totalAmount),
                credit: 0,
                balance,
            });

        }

        // ==========================
        // SUPPLIER PAYMENTS
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
        // PURCHASE RETURNS
        // ==========================

        for (const item of purchaseReturns) {

            const amount =
                Number(item.cashReceived) +
                Number(item.adjustedDue);

            balance -= amount;

            ledger.push({
                date: item.returnDate,
                type: "Purchase Return",
                reference: item.id,
                debit: 0,
                credit: amount,
                balance,
            });

        }

        // ==========================
        // SORT LEDGER
        // ==========================

        ledger.sort((a, b) => {

            if (!a.date) return -1;
            if (!b.date) return 1;

            return (
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
            );

        });
        return NextResponse.json({
            supplier: {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.phone,
                address: supplier.address,
            },

            summary: {
                openingDue: Number(supplier.openingDue),

                totalPurchase: purchases.reduce(
                    (sum, p) => sum + Number(p.totalAmount),
                    0
                ),

                totalPayments: payments.reduce(
                    (sum, p) => sum + Number(p.amount),
                    0
                ),

                totalPurchaseReturns: purchaseReturns.reduce(
                    (sum, r) =>
                        sum +
                        Number(r.cashReceived) +
                        Number(r.adjustedDue),
                    0
                ),

                closingBalance: balance,
            },

            ledger,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to generate supplier ledger",
            },
            {
                status: 500,
            }
        );

    }
}