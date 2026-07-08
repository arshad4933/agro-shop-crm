import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================
// GET ALL CATEGORIES
// =======================
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// =======================
// CREATE CATEGORY
// =======================
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    // Duplicate Check
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: body.name.trim(),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category already exists" },
        { status: 400 }
      );
    }

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
      },
    });

    return NextResponse.json(category, {
      status: 201,
    });
  } catch (error) {
  console.error(error);

  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : "Something went wrong",
    },
    { status: 500 }
  );
}
}