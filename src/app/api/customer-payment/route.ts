import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET CUSTOMER PAYMENTS
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (customerId) {
      const parsedCustomerId = Number(customerId);

      if (!Number.isInteger(parsedCustomerId)) {
        return NextResponse.json(
          { message: "Invalid customerId" },
          { status: 400 }
        );
      }

      const payments = await prisma.customerPayment.findMany({
        where: {
          customerId: parsedCustomerId,
        },
        include: {
          customer: true,
          sale: true,
        },
        orderBy: {
          paymentDate: "desc",
        },
      });

      return NextResponse.json(payments);
    }

    const payments = await prisma.customerPayment.findMany({
      include: {
        customer: true,
        sale: true,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error: unknown) {
    console.error("Customer Payment GET error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch customer payments",
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

// ==========================================
// CREATE CUSTOMER PAYMENT
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerId,
      saleId,
      amount,
      paymentMethod,
      paymentDate,
      note,
    } = body;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!customerId || !amount || !paymentMethod) {
      return NextResponse.json(
        {
          message:
            "Customer, amount and payment method are required",
        },
        {
          status: 400,
        }
      );
    }

    const parsedCustomerId = Number(customerId);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedCustomerId)) {
      return NextResponse.json(
        {
          message: "Invalid customer ID",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        {
          message: "Invalid payment amount",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // ------------------------------------------
      // FIND CUSTOMER
      // ------------------------------------------

      const customer = await tx.customer.findUnique({
        where: {
          id: parsedCustomerId,
        },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // ------------------------------------------
      // FIND SALE IF PROVIDED
      // ------------------------------------------

      let sale = null;

      if (saleId) {
        sale = await tx.sale.findUnique({
          where: {
            id: Number(saleId),
          },
        });

        if (!sale) {
          throw new Error("Sale not found");
        }

        if (sale.customerId !== parsedCustomerId) {
          throw new Error(
            "This sale does not belong to this customer"
          );
        }

        // ------------------------------------------
        // PAYMENT CANNOT EXCEED CURRENT SALE DUE
        // ------------------------------------------

        const currentDue = Number(
          sale.dueAmount ?? 0
        );

        if (parsedAmount > currentDue + 0.01) {
          throw new Error(
            `Payment cannot exceed current due amount ৳${currentDue.toFixed(
              2
            )}`
          );
        }
      }

      // ------------------------------------------
      // CREATE PAYMENT
      // ------------------------------------------

      const payment = await tx.customerPayment.create({
        data: {
          customerId: parsedCustomerId,

          saleId: sale
            ? sale.id
            : Number(saleId || 0),

          amount: parsedAmount,

          paymentMethod:
            String(paymentMethod).trim(),

          paymentDate: paymentDate
            ? new Date(paymentDate)
            : new Date(),

          note:
            note?.trim() || null,
        },
      });

      // ------------------------------------------
      // UPDATE SALE
      // ------------------------------------------

      if (sale) {
        const newPaidAmount =
          Number(sale.paidAmount) +
          parsedAmount;

        const newDueAmount =
          Number(sale.dueAmount) -
          parsedAmount;

        await tx.sale.update({
          where: {
            id: sale.id,
          },
          data: {
            paidAmount:
              Number(
                newPaidAmount.toFixed(2)
              ),

            dueAmount:
              Number(
                Math.max(
                  0,
                  newDueAmount
                ).toFixed(2)
              ),
          },
        });
      }

      // ------------------------------------------
      // CASH BOOK
      // ------------------------------------------

      await tx.cashBook.create({
        data: {
          transactionDate: paymentDate
            ? new Date(paymentDate)
            : new Date(),

          type: "Income",

          amount: parsedAmount,

          description: sale
            ? `Customer Payment - Invoice ${sale.invoiceNo}`
            : `Customer Payment - ${customer.name}`,

          referenceType:
            "CustomerPayment",

          referenceId: payment.id,
        },
      });

      // ------------------------------------------
      // ACTIVITY LOG
      // ------------------------------------------

      await tx.activityLog.create({
        data: {
          action: "CREATE",

          module: "Customer Payment",

          referenceId: payment.id,

          description: sale
            ? `Payment ৳${parsedAmount.toFixed(
              2
            )} received for Invoice ${sale.invoiceNo}`
            : `Payment ৳${parsedAmount.toFixed(
              2
            )} received from ${customer.name}`,
        },
      });

      return payment;
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error: unknown) {
    console.error(
      "Customer Payment POST error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to create customer payment",

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