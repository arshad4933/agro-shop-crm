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

      await tx.purchaseItem.deleteMany({
        where: {
          purchaseId: Number(id),
        },
      });

      await tx.productBatch.deleteMany({
        where: {
          purchaseId: Number(id),
        },
      });



      const purchase = await tx.purchase.update({

        where: {
          id: Number(id),
        },

        data: {

          supplierId: Number(body.supplierId),

          purchaseDate: new Date(body.purchaseDate),

          totalAmount: body.totalAmount,

          paidAmount: body.paidAmount,

          dueAmount: body.dueAmount,

          note: body.note || null,

        },

      });

      for (const item of body.items) {

        const batch = await tx.productBatch.create({

          data: {

            purchaseId: purchase.id,

            productId: Number(item.productId),

            supplierId: Number(body.supplierId),

            purchasePrice: item.buyPrice,

            sellingPrice: 0,

            quantityPurchased: item.quantity,

            quantityRemaining: item.quantity,

            purchaseDate: new Date(body.purchaseDate),

          },

        });

        await tx.purchaseItem.create({

          data: {

            purchaseId: purchase.id,

            batchId: batch.id,

            quantity: item.quantity,

            buyPrice: item.buyPrice,

            totalPrice: item.total,

          },

        });

      }
      return purchase;

    });

    return NextResponse.json({

      message: "Purchase Updated",

      purchase,

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

// =======================
// DELETE PURCHASE
// =======================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id } = await params;

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

    await prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({

        where: {
          purchaseId: Number(id),
        },

      });

      await tx.productBatch.deleteMany({

        where: {
          purchaseId: Number(id),
        },

      });

      await tx.purchase.delete({

        where: {
          id: Number(id),
        },

      });



      return true;

    });

    return NextResponse.json({

      message: "Purchase Deleted",

    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(

      {
        message: "Failed to delete purchase",
      },

      {
        status: 500,
      }

    );

  }

}