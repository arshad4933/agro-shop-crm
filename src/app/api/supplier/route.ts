import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL SUPPLIERS
// =======================
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch suppliers",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// CREATE SUPPLIER
// =======================
export async function POST(request: Request) {
  try {
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

    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        phone: body.phone,
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        {
          message: "Supplier already exists",
        },
        {
          status: 400,
        }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        company: body.company || null,
        phone: body.phone.trim(),
        email: body.email || null,
        address: body.address || null,
        openingDue: body.openingDue || 0,
      },
    });

    return NextResponse.json(supplier, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create supplier",
      },
      {
        status: 500,
      }
    );
  }
}