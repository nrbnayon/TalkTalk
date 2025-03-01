import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const apiResponse = await fetch(`${apiUrl}/api/v1/user/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await apiResponse.json();
    if (!data.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to get user' },
        { status: 400 }
      );
    }

    const result = data || {};
    const token = cookieStore.get('accessToken')?.value;
    const user = { ...result?.data, token } || {};
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get user' },
      { status: 500 }
    );
  }
}
