import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const type = searchParams.get("type");

        const where: any = {};

        if (from || to) {
            where.transactionDate = {};

            if (from) {
                where.transactionDate.gte = new Date(from);
            }

            if (to) {
                where.transactionDate.lte = new Date(to);
            }
        }

        if (type) {
            where.type = type;
        }

        const transactions = await prisma.cashBook.findMany({
            where,
            orderBy: {
                transactionDate: "asc",
            },
        });

        let openingBalance = 0;
        let runningBalance = openingBalance;

        const report: any[] = [];

        let totalCashIn = 0;
        let totalCashOut = 0;
        for (const tx of transactions) {

            const amount = Number(tx.amount);

            const isCashIn =
                tx.type === "Income" ||
                tx.type === "Customer Payment";

            if (isCashIn) {
                totalCashIn += amount;
                runningBalance += amount;
            } else {
                totalCashOut += amount;
                runningBalance -= amount;
            }

            report.push({
                id: tx.id,
                date: tx.transactionDate,
                type: tx.type,
                description: tx.description,
                referenceType: tx.referenceType,
                referenceId: tx.referenceId,
                cashIn: isCashIn ? amount : 0,
                cashOut: isCashIn ? 0 : amount,
                balance: runningBalance,
            });
        }

        return NextResponse.json({
            summary: {
                openingBalance,
                totalCashIn,
                totalCashOut,
                closingBalance: runningBalance,
                totalTransactions: report.length,
            },

            report,
        });
    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to generate cash book report",
            },
            {
                status: 500,
            }
        );

    }
}