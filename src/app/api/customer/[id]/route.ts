import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET CUSTOMER BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        sales: true,
        payments: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          message: "Customer not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch customer",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// UPDATE CUSTOMER
// =======================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        {
          message: "Name and Phone are required",
        },
        {
          status: 400,
        }
      );
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: body.phone.trim(),
        NOT: {
          id: Number(id),
        },
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message: "Another customer already uses this phone number",
        },
        {
          status: 400,
        }
      );
    }

    const customer = await prisma.customer.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        address: body.address || null,
        openingDue: Number(body.openingDue || 0),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update customer",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// DELETE CUSTOMER
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.customer.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete customer",
      },
      {
        status: 500,
      }
    );
  }
}