// app/api/chat/groupremove/route.js
export async function PATCH(request) {
  try {
    const body = await request.json();
    const data = await fetchWithAuth("/chat/groupremove", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json({ data: data.data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to remove user from group" },
      { status: 500 }
    );
  }
}
