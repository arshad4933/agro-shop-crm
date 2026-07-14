import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET SUPPLIER PAYMENT BY ID
// =======================
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const payment = await prisma.supplierPayment.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                supplier: true,
            },
        });

        if (!payment) {
            return NextResponse.json(
                {
                    message: "Supplier payment not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch supplier payment",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// UPDATE SUPPLIER PAYMENT
// =======================
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const body = await request.json();

        const {
            amount,
            paymentMethod,
            paymentDate,
            note,
        } = body;

        if (
            !amount ||
            !paymentMethod ||
            !paymentDate
        ) {
            return NextResponse.json(
                {
                    message:
                        "Amount, Payment Method and Payment Date are required",
                },
                {
                    status: 400,
                }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.supplierPayment.findUnique({
                where: {
                    id: Number(id),
                },
            });

            if (!payment) {
                throw new Error("Supplier payment not found");
            }

            const purchase = await tx.purchase.findFirst({
                where: {
                    supplierId: payment.supplierId,
                },
                orderBy: {
                    purchaseDate: "asc",
                },
            });

            if (!purchase) {
                throw new Error("Purchase not found");
            }

            // Reverse old payment
            await tx.purchase.update({
                where: {
                    id: purchase.id,
                },
                data: {
                    paidAmount:
                        Number(purchase.paidAmount) -
                        Number(payment.amount),

                    dueAmount:
                        Number(purchase.dueAmount) +
                        Number(payment.amount),
                },
            });

            const updatedPurchase =
                await tx.purchase.findUnique({
                    where: {
                        id: purchase.id,
                    },
                });

            if (!updatedPurchase) {
                throw new Error("Purchase not found");
            }

            // Apply new payment
            await tx.purchase.update({
                where: {
                    id: purchase.id,
                },
                data: {
                    paidAmount:
                        Number(updatedPurchase.paidAmount) +
                        Number(amount),

                    dueAmount:
                        Number(updatedPurchase.dueAmount) -
                        Number(amount),
                },
            });

            const updatedPayment =
                await tx.supplierPayment.update({
                    where: {
                        id: Number(id),
                    },
                    data: {
                        amount: Number(amount),
                        paymentMethod,
                        paymentDate: new Date(paymentDate),
                        note,
                    },
                });

            return updatedPayment;
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to update supplier payment",
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

// =======================
// DELETE SUPPLIER PAYMENT
// =======================
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.supplierPayment.findUnique({
                where: {
                    id: Number(id),
                },
            });

            if (!payment) {
                throw new Error("Supplier payment not found");
            }

            const purchase = await tx.purchase.findFirst({
                where: {
                    supplierId: payment.supplierId,
                },
                orderBy: {
                    purchaseDate: "asc",
                },
            });

            if (!purchase) {
                throw new Error("Purchase not found");
            }

            // Restore Purchase Amount
            await tx.purchase.update({
                where: {
                    id: purchase.id,
                },
                data: {
                    paidAmount:
                        Number(purchase.paidAmount) -
                        Number(payment.amount),

                    dueAmount:
                        Number(purchase.dueAmount) +
                        Number(payment.amount),
                },
            });

            await tx.supplierPayment.delete({
                where: {
                    id: Number(id),
                },
            });

            return {
                message: "Supplier payment deleted successfully",
            };
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to delete supplier payment",
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