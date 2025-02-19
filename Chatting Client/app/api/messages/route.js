// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export async function POST(request) {
  try {
    console.log('[API] Processing message send request');

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
    console.log('[API] Sending form data:', formDataLog);

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log('[API] Backend response status:', response.status);

    if (!response.ok) {
      console.error('[API] Backend error:', data.error || data.message);
      return NextResponse.json(
        { error: data.message || 'Failed to send message' },
        { status: response.status }
      );
    }

    console.log('[API] Message sent successfully');
    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error('[API] Message sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending message' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    console.log('[API] Processing message edit request');

    const formData = await request.formData();
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const messageId = formData.get('messageId');
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required for editing' },
        { status: 400 }
      );
    }

    // Log the complete form data for debugging
    const formDataLog = {};
    for (const [key, value] of formData.entries()) {
      formDataLog[key] =
        value instanceof File
          ? `File: ${value.name} (${value.size} bytes)`
          : value;
    }
    console.log('[API] Edit request data:', formDataLog);

    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/edit`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    // Add response logging
    console.log('[API] Backend response status:', response.status);
    const responseData = await response.json();
    console.log('[API] Backend response:', responseData);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseData.message || 'Failed to edit message',
          details: responseData,
        },
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.json(
      { data: responseData.data },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[API] Message edit error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error while editing message',
        details: error.message,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function GET(request) {
  try {
    console.log('[API] Processing message fetch request');
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
