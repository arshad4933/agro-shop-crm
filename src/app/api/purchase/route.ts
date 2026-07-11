import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL PURCHASES
// =======================
export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            batch: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch purchases",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// CREATE PURCHASE
// =======================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      supplierId,
      purchaseNo,
      purchaseDate,
      paidAmount,
      note,
      items,
    } = body;

    if (
      !supplierId ||
      !purchaseNo ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          message: "Supplier, Purchase No and Items are required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // Calculate total
      for (const item of items) {
        totalAmount +=
          Number(item.quantity) *
          Number(item.buyPrice);
      }

      const paid = Number(paidAmount || 0);
      const dueAmount = totalAmount - paid;

      // Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          supplierId: Number(supplierId),
          purchaseNo,
          purchaseDate: new Date(purchaseDate),
          totalAmount,
          paidAmount: paid,
          dueAmount,
          note,
        },
      });

      // Create Items + Batch
      for (const item of items) {
        const batch = await tx.productBatch.create({
          data: {
            productId: Number(item.productId),
            supplierId: Number(supplierId),

            purchasePrice: item.buyPrice,
            sellingPrice: item.sellPrice,

            quantityPurchased: Number(item.quantity),
            quantityRemaining: Number(item.quantity),

            manufactureDate: item.manufactureDate
              ? new Date(item.manufactureDate)
              : null,

            expiryDate: item.expiryDate
              ? new Date(item.expiryDate)
              : null,

            purchaseDate: new Date(purchaseDate),
          },
        });

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            batchId: batch.id,

            quantity: Number(item.quantity),

            buyPrice: item.buyPrice,

            totalPrice:
              Number(item.quantity) *
              Number(item.buyPrice),
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(result, {
      status: 201,
    });

  } catch (error: unknown) {
    console.error("========== PURCHASE ERROR ==========");
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create purchase",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}