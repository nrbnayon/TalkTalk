// app/api/categories/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const apiUrl = process.env.API_URL;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  // console.log("first request id::", id);
  try {
    const url = id
      ? `${apiUrl}/api/v1/products/${id}`
      : `${apiUrl}/api/v1/products`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("product data", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
