// app/api/chat/[chatId]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

async function fetchWithAuth(url, options = {}) {
  const cookieStore = cookies();
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

// PATCH update chat (used for isPinned, delete, and block updates)
export async function PATCH(request, { params }) {
  try {
    // Removed await from params since it's already resolved
    const { chatId } = params;
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    let apiEndpoint = `/chat/${chatId}`;

    if (action === "pin") {
      apiEndpoint = `/chat/${chatId}/pin`;
    } else if (action === "delete") {
      apiEndpoint = `/chat/${chatId}/delete`;
    } else if (action === "block") {
      apiEndpoint = `/chat/${chatId}/block`;
    } else {
      // For regular updates (like isPinned updates through older code)
      const body = await request.json();
      const data = await fetchWithAuth(`/chat/${chatId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return NextResponse.json({ data: data.data });
    }

    // For the new action-based endpoints that don't need a request body
    const data = await fetchWithAuth(apiEndpoint, {
      method: "PATCH",
    });

    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update chat" },
      { status: 500 }
    );
  }
}

// DELETE chat
export async function DELETE(request, { params }) {
  try {
    const { chatId } = params;
    await fetchWithAuth(`/chat/${chatId}`, {
      method: "DELETE",
    });
    return NextResponse.json({ success: true, chatId });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete chat" },
      { status: 500 }
    );
  }
}
