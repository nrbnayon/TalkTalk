// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export async function POST(request) {
  try {
    // Ensure request is multipart/form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      console.error(
        '[API] Invalid content type:',
        request.headers.get('content-type')
      );
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      console.error('[API] No authentication token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Log form data contents
    const formDataLog = {};
    for (const [key, value] of formData.entries()) {
      formDataLog[key] =
        value instanceof File
          ? `File: ${value.name} (${value.size} bytes)`
          : value;
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[API] Backend error:', data.error || data.message);
      return NextResponse.json(
        { error: data.message || 'Failed to send message' },
        { status: response.status }
      );
    }
    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error('[API] Message sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending message' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      console.error('[API] No chatId provided');
      return NextResponse.json(
        { error: 'ChatId is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      console.error('[API] No authentication token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`[API] Fetching messages for chat: ${chatId}`);
    const response = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(`[API] Retrieved ${data.data?.length || 0} messages`);

    if (!response.ok) {
      console.error('[API] Backend error:', data.error || data.message);
      return NextResponse.json(
        { error: data.message || 'Failed to fetch messages' },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error('[API] Message fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching messages' },
      { status: 500 }
    );
  }
}
