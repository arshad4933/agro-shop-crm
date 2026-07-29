import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const { id } = await params;

        const sales = await prisma.sale.findMany({

            where: {

                customerId: Number(id),

                dueAmount: {

                    gt: 0,

                },

            },

            orderBy: {

                saleDate: "asc",

            },

            select: {

                id: true,

                invoiceNo: true,

                saleDate: true,

                dueAmount: true,

            },

        });

        return NextResponse.json(sales);

    } catch (error) {

        console.error(error);

        return NextResponse.json(

            {

                message: "Failed to load due invoices",

            },

            {

                status: 500,

            }

        );

    }
}