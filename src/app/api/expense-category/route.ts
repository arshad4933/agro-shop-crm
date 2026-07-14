import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL EXPENSE CATEGORIES
// =======================
export async function GET() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: {
                id: "desc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to fetch expense categories",
            },
            {
                status: 500,
            }
        );
    }
}

// =======================
// CREATE EXPENSE CATEGORY
// =======================
export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json(
                {
                    message: "Category name is required",
                },
                {
                    status: 400,
                }
            );
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name: body.name.trim(),
            },
        });

        return NextResponse.json(category, {
            status: 201,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                message: "Failed to create expense category",
            },
            {
                status: 500,
            }
        );
    }
}