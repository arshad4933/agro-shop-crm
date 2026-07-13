import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// CURRENT STOCK
// =======================
export async function GET() {
  try {
    const stock = await prisma.product.findMany({
      include: {
        category: true,
        batches: {
          where: {
            quantityRemaining: {
              gt: 0,
            },
          },
          orderBy: {
            purchaseDate: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = stock.map((product) => {
      const totalStock = product.batches.reduce(
        (sum, batch) => sum + batch.quantityRemaining,
        0
      );

      const latestBatch =
        product.batches.length > 0
          ? product.batches[product.batches.length - 1]
          : null;

      return {
        id: product.id,
        productName: product.name,
        brand: product.brand,
        category: product.category.name,
        unit: product.unit,

        currentStock: totalStock,
        minimumStock: product.minimumStock,

        buyPrice: latestBatch?.purchasePrice ?? null,
        sellPrice: latestBatch?.sellingPrice ?? null,

        isLowStock: totalStock <= product.minimumStock,

        totalBatches: product.batches.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch stock",
      },
      {
        status: 500,
      }
    );
  }
}