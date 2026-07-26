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

    // =======================
    // VALIDATION
    // =======================
    if (!body.supplierId) {
      return NextResponse.json(
        { message: "Supplier is required" },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { message: "At least one product is required" },
        { status: 400 }
      );
    }

    for (const item of body.items) {
      if (!item.productId) {
        return NextResponse.json(
          { message: "Please select a product" },
          { status: 400 }
        );
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { message: "Quantity must be greater than zero" },
          { status: 400 }
        );
      }

      if (item.buyPrice < 0) {
        return NextResponse.json(
          { message: "Invalid buy price" },
          { status: 400 }
        );
      }
    }

    // =======================
    // PURCHASE NUMBER
    // =======================
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });

    const purchaseNo = `PUR-${String(
      (lastPurchase?.id ?? 0) + 1
    ).padStart(6, "0")}`;

    // =======================
    // TRANSACTION
    // =======================
    const purchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          purchaseNo,
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

          }
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
      message: "Purchase Created",
      purchase,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create purchase",
      },
      {
        status: 500,
      }
    );
  }
}