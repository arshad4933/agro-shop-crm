import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET CUSTOMER PAYMENT BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await prisma.customerPayment.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        customer: true,
        sale: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          message: "Customer payment not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch customer payment",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// DELETE CUSTOMER PAYMENT
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!payment) {
        throw new Error("Customer payment not found");
      }

      const sale = await tx.sale.findUnique({
        where: {
          id: payment.saleId,
        },
      });

      if (!sale) {
        throw new Error("Sale not found");
      }

      // Restore paid/due amount
      await tx.sale.update({
        where: {
          id: sale.id,
        },
        data: {
          paidAmount: Number(sale.paidAmount) - Number(payment.amount),
          dueAmount: Number(sale.dueAmount) + Number(payment.amount),
        },
      });

      await tx.customerPayment.delete({
        where: {
          id: payment.id,
        },
      });

      return {
        message: "Customer payment deleted successfully",
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete customer payment",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}