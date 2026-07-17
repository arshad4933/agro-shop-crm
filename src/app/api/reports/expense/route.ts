import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const where: any = {};

        if (from || to) {

            where.expenseDate = {};

            if (from) {
                where.expenseDate.gte = new Date(from);
            }

            if (to) {
                where.expenseDate.lte = new Date(to);
            }
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                expenseDate: "desc",
            },
        });

        let totalExpense = 0;

        const report = expenses.map((expense) => {

            totalExpense += Number(expense.amount);

            return {
                id: expense.id,
                date: expense.expenseDate,
                category: expense.category.name,
                amount: Number(expense.amount),
                description: expense.description,
            };
        });
        return NextResponse.json({
            summary: {
                totalExpenses: report.length,
                totalExpense,
            },
            report,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to generate expense report",
            },
            {
                status: 500,
            }
        );
    }
}