import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL EXPENSES
// =======================
export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            include: {
                category: true,
            },
            orderBy: {
                expenseDate: "desc",
            },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch expenses",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// CREATE EXPENSE
// =======================
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            categoryId,
            amount,
            expenseDate,
            description,
        } = body;

        if (
            !categoryId ||
            !amount ||
            !expenseDate
        ) {
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

        const category =
            await prisma.expenseCategory.findUnique({
                where: {
                    id: Number(categoryId),
                },
            });

        if (!category) {
            return NextResponse.json(
                {
                    message: "Expense category not found",
                },
                {
                    status: 404,
                }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                categoryId: Number(categoryId),
                amount: Number(amount),
                expenseDate: new Date(expenseDate),
                description,
            },
        });

        // Cash Book Entry
        await prisma.cashBook.create({
            data: {
                transactionDate: new Date(expenseDate),

                type: "Expense",

                amount: Number(amount),

                description,

                referenceType: "Expense",

                referenceId: expense.id,
            },
        });

        return NextResponse.json(expense, {
            status: 201,
        });
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create expense",
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