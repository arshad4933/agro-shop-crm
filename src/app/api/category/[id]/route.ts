import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET SINGLE CATEGORY
// =======================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// =======================
// UPDATE CATEGORY
// =======================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const category = await prisma.category.update({
      where: {
        id: Number(id),
      },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// =======================
// DELETE CATEGORY
// =======================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.category.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}