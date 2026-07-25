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

// =======================
// UPDATE PURCHASE
// =======================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id } = await params;

    const body = await request.json();

    if (!body.supplierId) {
      return NextResponse.json(
        {
          message: "Supplier is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          message: "At least one product is required",
        },
        {
          status: 400,
        }
      );
    }

    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          message: "Purchase not found",
        },
        {
          status: 404,
        }
      );
    }

    const purchase = await prisma.$transaction(async (tx) => {




      return true;

    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {
        message: "Failed to update purchase",
      },

      {
        status: 500,
      }

    );

  }
}