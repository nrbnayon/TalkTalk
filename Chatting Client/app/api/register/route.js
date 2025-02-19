import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';

  try {
    const formData = await request.formData();

    // Reconstruct the payload
    const payload = {
      data: JSON.parse(formData.get('data')),
      image: formData.get('image'),
    };

    const response = await fetch(`${apiUrl}/api/v1/user/create-user`, {
      method: 'POST',
      body:
        payload.data && payload.image
          ? (() => {
              const multipartForm = new FormData();
              multipartForm.append('data', JSON.stringify(payload.data));
              multipartForm.append('image', payload.image);
              return multipartForm;
            })()
          : JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || 'Registration successful',
      email: data?.data,
    });
  } catch (error) {
    console.error('Registration server error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
