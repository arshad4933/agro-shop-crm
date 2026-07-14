import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET EXPENSE BY ID
// =======================
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const expense = await prisma.expense.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                category: true,
            },
        });

        if (!expense) {
            return NextResponse.json(
                {
                    message: "Expense not found",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch expense",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// UPDATE EXPENSE
// =======================
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const body = await request.json();

        const {
            categoryId,
            amount,
            expenseDate,
            description,
        } = body;

        if (!categoryId || !amount || !expenseDate) {
            return NextResponse.json(
                {
                    message:
                        "Category, Amount and Expense Date are required",
                },
                {
                    status: 400,
                }
            );
        }

        const expense = await prisma.expense.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!expense) {
            return NextResponse.json(
                {
                    message: "Expense not found",
                },
                {
                    status: 404,
                }
            );
        }

        const updatedExpense = await prisma.expense.update({
            where: {
                id: Number(id),
            },
            data: {
                categoryId: Number(categoryId),
                amount: Number(amount),
                expenseDate: new Date(expenseDate),
                description,
            },
        });

        // Update Cash Book
        await prisma.cashBook.updateMany({
            where: {
                referenceType: "Expense",
                referenceId: Number(id),
            },
            data: {
                transactionDate: new Date(expenseDate),
                amount: Number(amount),
                description,
            },
        });

        return NextResponse.json(updatedExpense);
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to update expense",
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
// DELETE EXPENSE
// =======================
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const expense = await prisma.expense.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!expense) {
            return NextResponse.json(
                {
                    message: "Expense not found",
                },
                {
                    status: 404,
                }
            );
        }

        // Delete Cash Book Entry
        await prisma.cashBook.deleteMany({
            where: {
                referenceType: "Expense",
                referenceId: Number(id),
            },
        });

        await prisma.expense.delete({
            where: {
                id: Number(id),
            },
        });

        return NextResponse.json({
            message: "Expense deleted successfully",
        });
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to delete expense",
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