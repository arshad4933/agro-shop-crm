import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL SUPPLIER PAYMENTS
// =======================
export async function GET() {
    try {
        const payments = await prisma.supplierPayment.findMany({
            include: {
                supplier: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch supplier payments",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// CREATE SUPPLIER PAYMENT
// =======================
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            supplierId,
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        if (
            !supplierId ||
            !amount ||
            !paymentMethod ||
            !paymentDate
        ) {
            return NextResponse.json(
                {
                    message:
                        "Supplier, Amount, Payment Method and Payment Date are required",
                },
                {
                    status: 400,
                }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const purchases = await tx.purchase.findMany({
                where: {
                    supplierId: Number(supplierId),
                    dueAmount: {
                        gt: 0,
                    },
                },
                orderBy: {
                    purchaseDate: "asc",
                },
            });

            let remainingPayment = Number(amount);

            for (const purchase of purchases) {
                if (remainingPayment <= 0) break;

                const due = Number(purchase.dueAmount);

                const pay = Math.min(due, remainingPayment);

                await tx.purchase.update({
                    where: {
                        id: purchase.id,
                    },
                    data: {
                        paidAmount: Number(purchase.paidAmount) + pay,
                        dueAmount: due - pay,
                    },
                });

                remainingPayment -= pay;
            }

            const payment = await tx.supplierPayment.create({
                data: {
                    supplierId: Number(supplierId),
                    amount: Number(amount),
                    paymentMethod,
                    paymentDate: new Date(paymentDate),
                    note,
                },
            });

            return payment;
        });

        return NextResponse.json(result, {
            status: 201,
        });
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create supplier payment",
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