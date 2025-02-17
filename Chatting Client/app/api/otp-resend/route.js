// app\api\otp-verify\route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    console.log("API_URL is not defined");
    return NextResponse.json(
      { success: false, message: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { email } = await request.json();

    const response = await fetch(`${apiUrl}/api/v1/auth/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("External API error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "OTP send failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP sent successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("OTP send server error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}
