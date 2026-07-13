import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL CUSTOMERS
// =======================
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch customers",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// CREATE CUSTOMER
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

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phone: body.phone.trim(),
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          message: "Customer already exists",
        },
        {
          status: 400,
        }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        address: body.address || null,
        openingDue: Number(body.openingDue || 0),
      },
    });

    return NextResponse.json(customer, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create customer",
      },
      {
        status: 500,
      }
    );
  }
}