// app/api/messages/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

async function fetchWithAuth(url, options = {}) {
  const cookieStore = await cookies();
  const token =  cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "An error occurred while fetching the data.",
    }));
    throw new Error(errorData.message || "An error occurred while fetching the data.");
  }

  return response.json();
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const cookieStore = await cookies();
    const token = await cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Extract data from FormData
    const content = formData.get("content");
    const chatId = formData.get("chatId");
    const replyToId = formData.get("replyToId");
    const files = formData.getAll("files");
    
    if (!content || !chatId) {
      return NextResponse.json(
        { error: "Content and chatId are required" },
        { status: 400 }
      );
    }

    // Create the request body to match backend expectations
    const apiFormData = new FormData();
    apiFormData.append("content", content);
    apiFormData.append("chatId", chatId);
    
    if (replyToId) {
      apiFormData.append("replyToId", replyToId);
    }

    // Handle files
    files.forEach((file, index) => {
      if (file instanceof File) {
        apiFormData.append(`files`, file);
      }
    });

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send message");
    }

    const data = await response.json();
    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error("Message sending error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "ChatId is required" },
        { status: 400 }
      );
    }

    let endpoint = `/messages/${chatId}`;
    if (query) {
      endpoint = `/messages/search?query=${query}&chatId=${chatId}`;
    }

    const data = await fetchWithAuth(endpoint);
    return NextResponse.json({ data: data.data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: "MessageId and content are required" },
        { status: 400 }
      );
    }

    const data = await fetchWithAuth(`/messages/${messageId}/edit`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    return NextResponse.json({ data: data.data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to edit message" },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

// async function fetchWithAuth(url, options = {}) {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("accessToken")?.value;

//   console.log("[API] Fetching with token:", token ? "Present" : "Missing");
//   console.log("[API] URL:", `${API_BASE_URL}${url}`);

//   if (!token) {
//     throw new Error("No authentication token found");
//   }

//   const headers = {
//     Authorization: `Bearer ${token}`,
//     ...options.headers,
//   };

//   try {
//     console.log("[API] Making request with options:", {
//       url: `${API_BASE_URL}${url}`,
//       method: options.method || "GET",
//       headers: headers,
//     });

//     const response = await fetch(`${API_BASE_URL}${url}`, {
//       ...options,
//       headers,
//     });

//     console.log("[API] Response status:", response.status);

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({
//         message: "An error occurred while fetching the data.",
//       }));
//       console.error("[API] Error response:", errorData);
//       throw new Error(
//         errorData.message || "An error occurred while fetching the data."
//       );
//     }

//     const data = await response.json();
//     console.log("[API] Success response:", data);
//     return data;
//   } catch (error) {
//     console.error("[API] Fetch error:", error);
//     throw error;
//   }
// }

// export async function POST(request) {
//   try {
//     console.log("[API] Starting message POST request");
//     const formData = await request.formData();

//     // Log FormData contents
//     console.log("[API] FormData contents:");
//     for (let [key, value] of formData.entries()) {
//       console.log(
//         `${key}: ${value instanceof File ? "File: " + value.name : value}`
//       );
//     }

//     const token = cookies().get("accessToken")?.value;
//     console.log("[API] Token present:", !!token);

//     const response = await fetch(`${API_BASE_URL}/messages`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData,
//     });

//     console.log("[API] Message POST response status:", response.status);

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error("[API] Message POST error:", errorData);
//       throw new Error(errorData.message || "Failed to send message");
//     }

//     const data = await response.json();
//     console.log("[API] Message POST success:", data);
//     return NextResponse.json({ data: data.data });
//   } catch (error) {
//     console.error("[API] Message POST error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to send message" },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request) {
//   try {
//     console.log("[API] Starting message GET request");
//     const searchParams = request.nextUrl.searchParams;
//     const query = searchParams.get("query");
//     const chatId = searchParams.get("chatId");

//     console.log("[API] Search params:", { query, chatId });

//     if (!chatId) {
//       console.error("[API] Missing required params");
//       return NextResponse.json(
//         { error: "ChatId is required" },
//         { status: 400 }
//       );
//     }

//     let endpoint = `/messages/${chatId}`;
//     if (query) {
//       endpoint = `/messages/search?query=${query}&chatId=${chatId}`;
//     }

//     console.log("[API] Fetching from endpoint:", endpoint);
//     const data = await fetchWithAuth(endpoint);

//     return NextResponse.json({ data: data.data });
//   } catch (error) {
//     console.error("[API] Message GET error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to fetch messages" },
//       { status: 500 }
//     );
//   }
// }
