import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET SALE BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        customer: true,
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

    if (!sale) {
      return NextResponse.json(
        {
          message: "Sale not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch sale",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// DELETE SALE
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          items: true,
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      // Restore stock
      for (const item of sale.items) {
        const batch = await tx.productBatch.findUnique({
          where: {
            id: item.batchId,
          },
        });

        if (batch) {
          await tx.productBatch.update({
            where: {
              id: batch.id,
            },
            data: {
              quantityRemaining:
                batch.quantityRemaining + item.quantity,
            },
          });
        }
      }

      // Delete Sale Items
      await tx.saleItem.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // Delete Sale
      await tx.sale.delete({
        where: {
          id: sale.id,
        },
      });

      return {
        message: "Sale deleted successfully",
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete sale",
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