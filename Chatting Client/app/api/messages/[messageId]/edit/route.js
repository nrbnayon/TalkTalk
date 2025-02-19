// app/api/messages/[messageId]/edit/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export async function PATCH(request, { params }) {
  try {
    const { messageId } = params;

    const data = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/edit`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.message || 'Failed to edit message' },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: responseData.data });
  } catch (error) {
    console.error('[API] Message edit error:', error);
    return NextResponse.json(
      { error: 'Internal server error while editing message' },
      { status: 500 }
    );
  }
}
