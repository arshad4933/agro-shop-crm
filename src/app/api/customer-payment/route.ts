import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL CUSTOMER PAYMENTS
// =======================
export async function GET() {
  try {
    const payments = await prisma.customerPayment.findMany({
      include: {
        customer: true,
        sale: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch customer payments",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// CREATE CUSTOMER PAYMENT
// =======================
export async function POST(request: Request) {
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

    if (
      !customerId ||
      !saleId ||
      !amount ||
      !paymentMethod ||
      !paymentDate
    ) {
      return NextResponse.json(
        {
          message:
            "Customer, Sale, Amount, Payment Method and Payment Date are required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: {
          id: Number(saleId),
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      const payAmount = Number(amount);

      if (payAmount > Number(sale.dueAmount)) {
        throw new Error("Payment exceeds due amount");
      }

      const payment = await tx.customerPayment.create({
        data: {
          customerId: Number(customerId),
          saleId: Number(saleId),
          amount: payAmount,
          paymentMethod,
          paymentDate: new Date(paymentDate),
          note,
        },
      });

      await tx.sale.update({
        where: {
          id: Number(saleId),
        },
        data: {
          paidAmount: Number(sale.paidAmount) + payAmount,
          dueAmount: Number(sale.dueAmount) - payAmount,
        },
      });

      // =======================
      // CASH BOOK ENTRY
      // =======================
      await tx.cashBook.create({
        data: {
          transactionDate: new Date(paymentDate),

          type: "Income",

          amount: payAmount,

          description:
            note || `Customer Payment - Invoice ${sale.invoiceNo}`,

          referenceType: "CustomerPayment",

          referenceId: payment.id,
        },
      });

      return payment;
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create customer payment",
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