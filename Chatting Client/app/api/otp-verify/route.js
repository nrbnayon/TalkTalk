import { NextResponse } from "next/server";

export async function POST(request) {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    console.error("API_URL is not defined");
    return NextResponse.json(
      { success: false, message: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { email, otp } = await request.json();


    const response = await fetch(`${apiUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, oneTimeCode: otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("External API error:", data);
      return NextResponse.json(
        { success: false, message: data?.message || "OTP verification failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP verification successful",
      userData: data?.data?.userData,
    });
  } catch (error) {
    console.error("OTP verification server error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
