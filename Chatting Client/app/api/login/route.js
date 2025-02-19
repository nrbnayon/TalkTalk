import { NextResponse } from "next/server";
import { setCookie } from "@/lib/cookies";

export async function POST(request) {
  const apiUrl = process.env.API_URL || "http://localhost:4000";

  try {
    const { email, password } = await request.json();

    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    console.log("Response data:", responseData)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: responseData.message || "Login failed" },
        { status: response.status }
      );
    }

    const { success, data } = responseData;
    const { accessToken } = data || {};

    const clientResponse = NextResponse.json({
      success: true,
      data: { accessToken },
      message: "Login successful",
    });

    if (accessToken && success) {
      setCookie(clientResponse, "accessToken", accessToken);
    }

    return clientResponse;
    
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
