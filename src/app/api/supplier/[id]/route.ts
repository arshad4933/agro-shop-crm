import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET SUPPLIER BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        batches: true,
        purchases: true,
        supplierPayments: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          message: "Supplier not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch supplier",
      },
      {
        status: 500,
      }
    );
  }
}
// =======================
// UPDATE SUPPLIER
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

    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        phone: body.phone.trim(),
        NOT: {
          id: Number(id),
        },
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        {
          message: "Another supplier already uses this phone number",
        },
        {
          status: 400,
        }
      );
    }

    const supplier = await prisma.supplier.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name.trim(),
        company: body.company || null,
        phone: body.phone.trim(),
        email: body.email || null,
        address: body.address || null,
        openingDue: body.openingDue || 0,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update supplier",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// DELETE SUPPLIER
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.supplier.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete supplier",
      },
      {
        status: 500,
      }
    );
  }
}