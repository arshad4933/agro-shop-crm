import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL PRODUCTS
// =======================
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCT ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}

// =======================
// CREATE PRODUCT
// =======================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.name || !body.categoryId || !body.unit) {
      return NextResponse.json(
        {
          message: "Name, Category and Unit are required",
        },
        {
          status: 400,
        }
      );
    }

    // Duplicate Check
    const existingProduct = await prisma.product.findUnique({
      where: {
        name: body.name.trim(),
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          message: "Product already exists",
        },
        {
          status: 400,
        }
      );
    }

    // Create Product
    const product = await prisma.product.create({
      data: {
        description: body.description || null,
        name: body.name.trim(),
        brand: body.brand || null,
        unit: body.unit,
        categoryId: Number(body.categoryId),
        minimumStock: Number(body.minimumStock || 0),
      },
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error("POST PRODUCT ERROR:");
    console.error(error);

    console.error(error);

    return NextResponse.json(
      {
        message: String(error),
      },
      {
        status: 500,
      }
    );
  }
}