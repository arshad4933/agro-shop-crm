import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET PRODUCT BY ID
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        category: true,
        batches: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// UPDATE PRODUCT
// =======================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: body.name.trim(),
        NOT: {
          id: Number(id),
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          message: "Another product with this name already exists",
        },
        {
          status: 400,
        }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name.trim(),
        brand: body.brand || null,
        unit: body.unit,
        categoryId: Number(body.categoryId),
        minimumStock: Number(body.minimumStock || 0),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to update product",
      },
      {
        status: 500,
      }
    );
  }
}


// =======================
// DELETE PRODUCT
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to delete product",
      },
      {
        status: 500,
      }
    );
  }
}