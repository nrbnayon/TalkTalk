// app/api/users/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('searchTerm');

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Construct the API URL with search parameters
    let url = `${apiUrl}/api/v1/user/get-all-users`;
    if (searchTerm) {
      url += `?searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    console.log('Fetching from URL:', url); // Add this for debugging
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Log the response status
    console.log('Response status:', response.status);
    
    // Try to log the response text for debugging
    const responseText = await response.text();
    console.log('Response text preview:', responseText.substring(0, 200));
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid response format from server',
          debug: responseText.substring(0, 500)  // Include some debug info
        },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch users' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data.result || [],
      meta: data.data.meta || {},
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users: ' + error.message 
      },
      { status: 500 }
    );
  }
}