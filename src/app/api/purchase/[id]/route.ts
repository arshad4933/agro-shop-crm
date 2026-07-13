import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET PURCHASE BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        supplier: true,
        items: {
          include: {
            batch: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          message: "Purchase not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch purchase",
      },
      {
        status: 500,
      }
    );
  }
}
