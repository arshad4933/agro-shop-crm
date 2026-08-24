import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET SALE BY ID
// ======================================

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
        // ======================================
        // CUSTOMER
        // ======================================

        customer: true,

        // ======================================
        // SALE ITEMS
        // ======================================

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

        // ======================================
        // SALE PAYMENTS
        // ======================================

        salePayments: {
          orderBy: {
            paymentDate: "asc",
          },
        },

        // ======================================
        // CUSTOMER PAYMENTS
        // ======================================

        payments: {
          orderBy: {
            paymentDate: "asc",
          },
        },

        // ======================================
        // SALE RETURNS
        // ======================================

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
      },
    });

    // ======================================
    // SALE NOT FOUND
    // ======================================

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

    // ======================================
    // RETURN SUMMARY
    // ======================================

    const totalReturned = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return (
          sum +
          Number(saleReturn.totalAmount ?? 0)
        );
      },
      0
    );

    const totalCashReturned = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return (
          sum +
          Number(saleReturn.cashReturned ?? 0)
        );
      },
      0
    );

    const totalDueAdjusted = sale.saleReturns.reduce(
      (sum, saleReturn) => {
        return (
          sum +
          Number(saleReturn.adjustedDue ?? 0)
        );
      },
      0
    );

    // ======================================
    // CURRENT SALE VALUES
    // ======================================

    const currentSaleAmount = Number(
      sale.totalAmount ?? 0
    );

    const currentPaidAmount = Number(
      sale.paidAmount ?? 0
    );

    const currentDueAmount = Number(
      sale.dueAmount ?? 0
    );

    // ======================================
    // ORIGINAL SALE TOTAL
    // ======================================
    //
    // If older return logic reduced
    // sale.totalAmount, reconstruct original
    // invoice total by adding returns back.
    //
    // Example:
    //
    // Current Sale = 200
    // Returned     = 200
    //
    // Original Sale = 400
    //
    // ======================================

    const originalSaleAmount =
      currentSaleAmount +
      totalReturned;

    // ======================================
    // ORIGINAL PAID
    // ======================================
    //
    // If return reduced paidAmount because
    // cash was refunded, add the refunded cash
    // back to recover the original paid amount.
    //
    // ======================================

    const originalPaidAmount =
      currentPaidAmount +
      totalCashReturned;

    // ======================================
    // ORIGINAL DUE
    // ======================================
    //
    // If return adjusted the customer's due,
    // add the adjustment back.
    //
    // ======================================

    const originalDueAmount =
      currentDueAmount +
      totalDueAdjusted;

    // ======================================
    // NET SALE AMOUNT
    // ======================================
    //
    // Original Invoice
    //       -
    // Total Returned
    //       =
    // Current Net Sale
    //
    // Example:
    //
    // Original = 400
    // Return   = 200
    // Net      = 200
    //
    // ======================================

    const netSaleAmount =
      originalSaleAmount -
      totalReturned;

    // ======================================
    // SALE ITEMS + RETURN INFORMATION
    // ======================================
    //
    // For every sale item we calculate:
    //
    // alreadyReturned
    // remainingToReturn
    //
    // This allows frontend to know exactly
    // how much quantity can still be returned.
    //
    // ======================================

    const itemsWithReturnInfo =
      sale.items.map((saleItem) => {
        const alreadyReturned =
          sale.saleReturns.reduce(
            (sum, saleReturn) => {
              const itemReturned =
                saleReturn.items
                  .filter(
                    (returnItem) =>
                      returnItem.saleItemId ===
                      saleItem.id
                  )
                  .reduce(
                    (
                      itemSum,
                      returnItem
                    ) => {
                      return (
                        itemSum +
                        Number(
                          returnItem.quantity ?? 0
                        )
                      );
                    },
                    0
                  );

              return (
                sum +
                itemReturned
              );
            },
            0
          );

        const remainingToReturn =
          Math.max(
            0,
            Number(saleItem.quantity) -
            alreadyReturned
          );

        return {
          ...saleItem,

          // Quantity already returned
          alreadyReturned,

          // Quantity still available
          // for future return
          remainingToReturn,
        };
      });

    // ======================================
    // RESPONSE
    // ======================================

    return NextResponse.json({
      ...sale,

      // ======================================
      // SALE ITEMS WITH RETURN INFORMATION
      // ======================================

      items: itemsWithReturnInfo,

      // ======================================
      // ORIGINAL INVOICE VALUES
      // ======================================

      originalTotalAmount: Number(
        originalSaleAmount.toFixed(2)
      ),

      originalPaidAmount: Number(
        originalPaidAmount.toFixed(2)
      ),

      originalDueAmount: Number(
        originalDueAmount.toFixed(2)
      ),

      // ======================================
      // CURRENT SALE VALUES
      // ======================================

      currentTotalAmount: Number(
        currentSaleAmount.toFixed(2)
      ),

      currentPaidAmount: Number(
        currentPaidAmount.toFixed(2)
      ),

      currentDueAmount: Number(
        currentDueAmount.toFixed(2)
      ),

      // ======================================
      // NET SALE AFTER RETURNS
      // ======================================

      netSaleAmount: Number(
        Math.max(
          0,
          netSaleAmount
        ).toFixed(2)
      ),

      // ======================================
      // RETURN SUMMARY
      // ======================================

      returnSummary: {
        // Total value of returned products
        totalReturned: Number(
          totalReturned.toFixed(2)
        ),

        // Total cash refunded
        totalCashReturned: Number(
          totalCashReturned.toFixed(2)
        ),

        // Total customer due adjusted
        totalDueAdjusted: Number(
          totalDueAdjusted.toFixed(2)
        ),

        // Number of return transactions
        returnCount:
          sale.saleReturns.length,
      },
    });
  } catch (error) {
    console.error(
      "Sale GET error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to fetch sale",

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

// ======================================
// DELETE SALE
// ======================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const saleId = Number(id);

    // ======================================
    // VALIDATE SALE ID
    // ======================================

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

    // ======================================
    // TRANSACTION
    // ======================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ======================================
          // FIND SALE
          // ======================================

          const sale =
            await tx.sale.findUnique({
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

          // ======================================
          // SALE NOT FOUND
          // ======================================

          if (!sale) {
            throw new Error(
              "Sale not found"
            );
          }

          // ======================================
          // RESTORE STOCK
          // ======================================
          //
          // First determine how much quantity
          // was originally sold.
          //
          // Then subtract quantities that were
          // already returned to stock.
          //
          // This prevents double restoration.
          //
          // Example:
          //
          // Sold       = 10
          // Returned   = 4
          //
          // When deleting sale:
          //
          // Restore = 10 - 4 = 6
          //
          // The 4 returned earlier already exists
          // in stock.
          //
          // ======================================

          for (
            const item of sale.items
          ) {
            const batch =
              await tx.productBatch.findUnique({
                where: {
                  id: item.batchId,
                },
              });

            if (!batch) {
              continue;
            }

            // ====================================
            // ALREADY RETURNED QUANTITY
            // ====================================

            const returnedQuantity =
              sale.saleReturns.reduce(
                (
                  total,
                  saleReturn
                ) => {
                  const returnedForThisItem =
                    saleReturn.items
                      .filter(
                        (returnItem) =>
                          returnItem.saleItemId ===
                          item.id
                      )
                      .reduce(
                        (
                          itemTotal,
                          returnItem
                        ) => {
                          return (
                            itemTotal +
                            Number(
                              returnItem.quantity ??
                              0
                            )
                          );
                        },
                        0
                      );

                  return (
                    total +
                    returnedForThisItem
                  );
                },
                0
              );

            // ====================================
            // QUANTITY TO RESTORE
            // ====================================

            const quantityToRestore =
              Math.max(
                0,
                Number(item.quantity) -
                returnedQuantity
              );

            // ====================================
            // RESTORE STOCK
            // ====================================

            if (
              quantityToRestore > 0
            ) {
              await tx.productBatch.update({
                where: {
                  id: batch.id,
                },

                data: {
                  quantityRemaining: {
                    increment:
                      quantityToRestore,
                  },
                },
              });
            }
          }

          // ======================================
          // DELETE SALE RETURN ITEMS
          // ======================================

          for (
            const saleReturn of
            sale.saleReturns
          ) {
            await tx.saleReturnItem.deleteMany({
              where: {
                saleReturnId:
                  saleReturn.id,
              },
            });
          }

          // ======================================
          // DELETE SALE RETURNS
          // ======================================

          await tx.saleReturn.deleteMany({
            where: {
              saleId: sale.id,
            },
          });

          // ======================================
          // DELETE SALE PAYMENTS
          // ======================================

          await tx.salePayment.deleteMany({
            where: {
              saleId: sale.id,
            },
          });

          // ======================================
          // DELETE CUSTOMER PAYMENTS
          // ======================================

          await tx.customerPayment.deleteMany({
            where: {
              saleId: sale.id,
            },
          });

          // ======================================
          // DELETE SALE ITEMS
          // ======================================

          await tx.saleItem.deleteMany({
            where: {
              saleId: sale.id,
            },
          });

          // ======================================
          // DELETE SALE
          // ======================================

          await tx.sale.delete({
            where: {
              id: sale.id,
            },
          });

          // ======================================
          // RESULT
          // ======================================

          return {
            message:
              "Sale deleted successfully",
          };
        }
      );

    // ======================================
    // SUCCESS RESPONSE
    // ======================================

    return NextResponse.json(
      result
    );
  } catch (error: unknown) {
    console.error(
      "Sale DELETE error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to delete sale",

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