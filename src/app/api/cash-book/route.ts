import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET CASH BOOK
// =======================
export async function GET() {
    try {
        const transactions = await prisma.cashBook.findMany({
            orderBy: {
                transactionDate: "desc",
            },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch cash book",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// CREATE CASH ENTRY
// =======================
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            transactionDate,
            type,
            amount,
            description,
            referenceType,
            referenceId,
        } = body;

        if (
            !transactionDate ||
            !type ||
            !amount
        ) {
            return NextResponse.json(
                {
                    message:
                        "Transaction Date, Type and Amount are required",
                },
                {
                    status: 400,
                }
            );
        }

        const entry = await prisma.cashBook.create({
            data: {
                transactionDate: new Date(transactionDate),
                type,
                amount: Number(amount),
                description,
                referenceType,
                referenceId,
            },
        });

        return NextResponse.json(entry, {
            status: 201,
        });
    } catch (error: unknown) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create cash entry",
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