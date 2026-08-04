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

      items,

      discount,

      paidAmount,

    } = body;

    if (

      !customerId ||

      !items ||

      items.length === 0

    ) {

      return NextResponse.json(

        {

          message: "Customer and Items are required",

        },

        {

          status: 400,

        }

      );

    }

    const result = await prisma.$transaction(

      async (tx) => {

        // ===========================
        // Invoice Number
        // ===========================

        const lastSale = await tx.sale.findFirst({

          orderBy: {

            id: "desc",

          },

        });

        const invoiceNo = `INV-${String(

          (lastSale?.id ?? 0) + 1

        ).padStart(6, "0")}`;

        // ===========================
        // Calculate Total
        // ===========================

        let grandTotal = 0;

        const saleItems: any[] = [];

        for (const item of items) {

          const batch = await tx.productBatch.findUnique({

            where: {

              id: Number(item.batchId),

            },

          });

          if (!batch) {

            throw new Error("Batch not found");

          }

          if (

            batch.quantityRemaining <

            Number(item.quantity)

          ) {

            throw new Error(

              `${item.productName} stock not available`

            );

          }

          const total =

            Number(item.quantity) *

            Number(item.sellingPrice);

          const profit =

            Number(item.quantity) *

            (

              Number(item.sellingPrice) -

              Number(batch.purchasePrice)

            );

          grandTotal += total;

          saleItems.push({

            batchId: batch.id,

            quantity: Number(item.quantity),

            buyPrice: Number(batch.purchasePrice),

            sellPrice: Number(item.sellingPrice),

            totalPrice: total,

            profit,

          });

        }

        const discountAmount = Number(

          discount || 0

        );

        const finalTotal =

          grandTotal -

          discountAmount;

        const paid = Number(

          paidAmount || 0

        );

        const due =

          finalTotal -

          paid;

        // ===========================
        // Create Sale
        // ===========================

        const sale = await tx.sale.create({

          data: {

            invoiceNo,

            customerId: Number(customerId),

            saleDate: new Date(),

            totalAmount: finalTotal,

            discount: discountAmount,

            paidAmount: paid,

            dueAmount: due,

          },

        });

        // ===========================
        // Create Initial Payment Entry
        // ===========================

        if (paid > 0) {
          await tx.salePayment.create({
            data: {
              saleId: sale.id,
              customerId: Number(customerId),
              amount: paid,
              paymentMethod: "Cash",
              paymentType: "SALE",
              note: "Cash Received During Sale",
            },
          });
        }

        // ===========================
        // Create Sale Items
        // ===========================

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

          await tx.productBatch.update({

            where: {

              id: item.batchId,

            },

            data: {

              quantityRemaining: {

                decrement: item.quantity,

              },

            },

          });

        }

        return sale;

      }

    );

    return NextResponse.json(result);

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(

      {

        message:

          error.message ||

          "Failed to create sale",

      },

      {

        status: 500,

      }

    );

  }

}

