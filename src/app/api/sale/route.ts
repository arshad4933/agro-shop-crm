import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL SALES
// =======================
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
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

    return NextResponse.json(sales);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch sales",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// CREATE SALE
// =======================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerId,
      invoiceNo,
      saleDate,
      paidAmount,
      discount,
      note,
      items,
    } = body;

    if (!customerId || !invoiceNo || !items || items.length === 0) {
      return NextResponse.json(
        {
          message: "Customer, Invoice No and Items are required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      const saleItems: {
        batchId: number;
        quantity: number;
        buyPrice: number;
        sellPrice: number;
        totalPrice: number;
        profit: number;
      }[] = [];

      // FIFO
      for (const item of items) {
        let remainingQty = Number(item.quantity);

        const batches = await tx.productBatch.findMany({
          where: {
            productId: Number(item.productId),
            quantityRemaining: {
              gt: 0,
            },
          },
          orderBy: {
            purchaseDate: "asc",
          },
        });

        if (batches.length === 0) {
          throw new Error("Product is out of stock");
        }

        for (const batch of batches) {
          if (remainingQty <= 0) break;

          const sellQty = Math.min(
            remainingQty,
            batch.quantityRemaining
          );

          const total =
            sellQty * Number(batch.sellingPrice);

          const profit =
            sellQty *
            (Number(batch.sellingPrice) -
              Number(batch.purchasePrice));

          totalAmount += total;

          saleItems.push({
            batchId: batch.id,
            quantity: sellQty,
            buyPrice: Number(batch.purchasePrice),
            sellPrice: Number(batch.sellingPrice),
            totalPrice: total,
            profit,
          });

          await tx.productBatch.update({
            where: {
              id: batch.id,
            },
            data: {
              quantityRemaining:
                batch.quantityRemaining - sellQty,
            },
          });

          remainingQty -= sellQty;
        }

        if (remainingQty > 0) {
          throw new Error("Not enough stock available");
        }
      }

      const discountAmount = Number(discount || 0);
      const grandTotal = totalAmount - discountAmount;
      const paid = Number(paidAmount || 0);
      const dueAmount = grandTotal - paid;

      const sale = await tx.sale.create({
        data: {
          customerId: Number(customerId),
          invoiceNo,
          saleDate: new Date(saleDate),
          totalAmount: grandTotal,
          discount: discountAmount,
          paidAmount: paid,
          dueAmount,
          note,
        },
      });

      for (const item of saleItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            batchId: item.batchId,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            totalPrice: item.totalPrice,
            profit: item.profit,
          },
        });
      }

      return sale;
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error: unknown) {
    console.error("========== SALE ERROR ==========");
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create sale",
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