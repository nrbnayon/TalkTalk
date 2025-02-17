// app/api/chat/rename/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

async function fetchWithAuth(url, options = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred while fetching the data.",
    }));
    throw new Error(
      error.message || "An error occurred while fetching the data."
    );
  }

  return response.json();
}

// PATCH rename group
export async function PATCH(request) {
  try {
    const body = await request.json();
    const data = await fetchWithAuth("/chat/rename", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json({ data: data.data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to rename group" },
      { status: 500 }
    );
  }
}
