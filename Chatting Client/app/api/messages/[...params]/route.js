// app/api/messages/[...params]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

async function fetchWithAuth(url, options = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred while fetching the data.',
    }));
    throw new Error(
      error.message || 'An error occurred while fetching the data.'
    );
  }

  return response.json();
}

// Handle all message routes with dynamic parameters
export async function GET(request, { params }) {
  const pathSegments = await Promise.resolve(params.params);

  // Handle chat messages: /api/messages/{chatId}
  if (pathSegments.length === 1) {
    const chatId = pathSegments[0];

    try {
      const data = await fetchWithAuth(`/messages/${chatId}`);
      return NextResponse.json({ data: data.data });
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch messages' },
        { status: 500 }
      );
    }
  }

  // Handle unseen message count: /api/messages/{chatId}/unseen
  if (pathSegments.length === 2 && pathSegments[1] === 'unseen') {
    const chatId = pathSegments[0];

    try {
      const data = await fetchWithAuth(`/messages/${chatId}/unseen`);
      return NextResponse.json({ data: data.data });
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to get unseen message count' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const pathSegments = await Promise.resolve(params.params);

  if (pathSegments.length === 1) {
    const messageId = pathSegments[0];

    try {
      await fetchWithAuth(`/messages/${messageId}`, {
        method: 'DELETE',
      });
      return NextResponse.json({ success: true, messageId });
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete message' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
}
// Updated POST method for reactions
export async function POST(request, { params }) {
  const pathSegments = await Promise.resolve(params.params);

  if (pathSegments.length === 2 && pathSegments[1] === 'react') {
    const messageId = pathSegments[0];
    try {
      const body = await request.json();
      // Updated to match your backend route
      const data = await fetchWithAuth(`/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return NextResponse.json({ data: data.data });
    } catch (error) {
      console.error('Reaction error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to toggle reaction' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
}


// Updated PATCH method with better pin toggle handling
export async function PATCH(request, { params }) {
  const pathSegments = await Promise.resolve(params.params);

  if (pathSegments.length === 2) {
    const messageId = pathSegments[0];
    const action = pathSegments[1];

    // Handle edit: /api/messages/{messageId}/edit
    if (action === 'edit') {
      try {
        const body = await request.json();
        const { messageId, content } = body;

        if (!messageId || !content) {
          return NextResponse.json(
            { error: 'MessageId and content are required' },
            { status: 400 }
          );
        }

        const data = await fetchWithAuth(`/messages/${messageId}/edit`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        return NextResponse.json({ data: data.data });
      } catch (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to edit message' },
          { status: 500 }
        );
      }
    }

    // Updated pin handling
    if (action === 'pin') {
      try {
        const body = await request.json();
        const { chatId } = body;

        if (!chatId) {
          return NextResponse.json(
            { error: 'chatId is required' },
            { status: 400 }
          );
        }

        const data = await fetchWithAuth(`/messages/${messageId}/pin`, {
          method: 'PATCH',
          body: JSON.stringify({ chatId }),
        });

        console.log('Pin toggle response:', data);
        return NextResponse.json({ data: data.data });
      } catch (error) {
        console.error('Pin toggle error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to toggle pin status' },
          { status: 500 }
        );
      }
    }

    // Handle read status
    if (action === 'read') {
      try {
        const data = await fetchWithAuth(`/messages/${messageId}/read`, {
          method: 'PATCH',
        });
        return NextResponse.json({ data: data.data });
      } catch (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to mark message as read' },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ error: 'Invalid route' }, { status: 404 });
}
