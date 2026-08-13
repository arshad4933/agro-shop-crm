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

    const saleId = Number(id);

    if (!Number.isInteger(saleId)) {
      return NextResponse.json(
        {
          message: "Invalid sale ID",
        },
        {
          status: 400,
        }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
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

        saleReturns: {
          orderBy: {
            returnDate: "asc",
          },

          include: {
            items: {
              include: {
                saleItem: true,

                batch: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },

        salePayments: {
          orderBy: {
            paymentDate: "asc",
          },
        },

        payments: {
          orderBy: {
            paymentDate: "asc",
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

    // ============================================================
    // RETURN HISTORY TOTAL
    // ============================================================

    const totalReturnedAmount = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return sum + Number(saleReturn.totalAmount ?? 0);
      },
      0
    );

    const totalCashReturned = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return sum + Number(saleReturn.cashReturned ?? 0);
      },
      0
    );

    const totalDueAdjusted = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return sum + Number(saleReturn.adjustedDue ?? 0);
      },
      0
    );

    // Sale.totalAmount is current amount after return.
    // Original sale = current amount + all returns.
    const originalTotalAmount =
      Number(sale.totalAmount ?? 0) +
      totalReturnedAmount;

    const originalPaidAmount =
      Number(sale.paidAmount ?? 0) +
      totalCashReturned;

    const originalDueAmount =
      Number(sale.dueAmount ?? 0) +
      totalDueAdjusted;

    return NextResponse.json({
      ...sale,

      // ============================================================
      // ORIGINAL / HISTORICAL VALUES
      // ============================================================

      originalTotalAmount: Number(
        originalTotalAmount.toFixed(2)
      ),

      originalPaidAmount: Number(
        originalPaidAmount.toFixed(2)
      ),

      originalDueAmount: Number(
        originalDueAmount.toFixed(2)
      ),

      returnSummary: {
        totalReturnedAmount: Number(
          totalReturnedAmount.toFixed(2)
        ),

        totalCashReturned: Number(
          totalCashReturned.toFixed(2)
        ),

        totalDueAdjusted: Number(
          totalDueAdjusted.toFixed(2)
        ),

        returnCount: sale.saleReturns.length,
      },
    });
  } catch (error) {
    console.error("GET SALE BY ID ERROR:", error);

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

    const saleId = Number(id);

    if (!Number.isInteger(saleId)) {
      return NextResponse.json(
        {
          message: "Invalid sale ID",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: {
          id: saleId,
        },

        include: {
          items: true,

          saleReturns: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      // ============================================================
      // RESTORE STOCK
      // ============================================================

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

      // ============================================================
      // DELETE SALE RETURN ITEMS
      // ============================================================

      for (const saleReturn of sale.saleReturns) {
        await tx.saleReturnItem.deleteMany({
          where: {
            saleReturnId: saleReturn.id,
          },
        });
      }

      // ============================================================
      // DELETE SALE RETURNS
      // ============================================================

      await tx.saleReturn.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // ============================================================
      // DELETE SALE PAYMENTS
      // ============================================================

      await tx.salePayment.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // ============================================================
      // DELETE CUSTOMER PAYMENTS
      // ============================================================

      await tx.customerPayment.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // ============================================================
      // DELETE SALE ITEMS
      // ============================================================

      await tx.saleItem.deleteMany({
        where: {
          saleId: sale.id,
        },
      });

      // ============================================================
      // DELETE SALE
      // ============================================================

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
    console.error("DELETE SALE ERROR:", error);

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