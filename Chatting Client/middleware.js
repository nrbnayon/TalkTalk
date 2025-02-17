import { NextResponse } from "next/server";
import { GenerateSlug } from "./utils/GenerateSlug";

const publicRoutes = ["/", "/register", "/login", "/otp-verify"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // If no token, allow public routes
  if (!accessToken) {
    return publicRoutes.includes(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Safe token decoding for server-side
    const tokenParts = accessToken.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const decodedPayload = JSON.parse(
      Buffer.from(tokenParts[1], "base64").toString("utf-8")
    );
    const isTokenExpired = Date.now() >= decodedPayload.exp * 1000;

    // If token is expired, allow public routes
    if (isTokenExpired) {
      return publicRoutes.includes(pathname)
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/", request.url));
    }

    // Generate user-specific route
    const user = GenerateSlug(decodedPayload.name);
    const userRoute = `welcome-${user}`;
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];

    // Redirect to user-specific route if not already on it
    if (firstSegment !== userRoute) {
      const additionalPath = pathSegments.slice(1).join("/");
      const redirectUrl = additionalPath
        ? `/${userRoute}/${additionalPath}`
        : `/${userRoute}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  } catch (error) {
    console.error("Error processing middleware:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
// import { NextResponse } from "next/server";
// import { GenerateSlug } from "./utils/GenerateSlug";

// const publicRoutes = ["/", "/register", "/login", "/otp-verify"];

// export async function middleware(request) {
//   const { pathname } = request.nextUrl;
//   const accessToken = request.cookies.get("accessToken")?.value;

//   // If no token, allow public routes
//   if (!accessToken) {
//     return publicRoutes.includes(pathname)
//       ? NextResponse.next()
//       : NextResponse.redirect(new URL("/", request.url));
//   }

//   try {
//     // Decode token and check expiration
//     const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
//     const isTokenExpired = Date.now() >= decodedToken.exp * 1000;

//     // If token is expired, allow public routes
//     if (isTokenExpired) {
//       return publicRoutes.includes(pathname)
//         ? NextResponse.next()
//         : NextResponse.redirect(new URL("/", request.url));
//     }

//     // Generate user-specific route
//     const user = GenerateSlug(decodedToken.name);
//     const userRoute = `welcome-${user}`;
//     const pathSegments = pathname.split("/").filter(Boolean);
//     const firstSegment = pathSegments[0];

//     // Redirect to user-specific route if not already on it
//     if (firstSegment !== userRoute) {
//       const additionalPath = pathSegments.slice(1).join("/");
//       const redirectUrl = additionalPath
//         ? `/${userRoute}/${additionalPath}`
//         : `/${userRoute}`;
//       return NextResponse.redirect(new URL(redirectUrl, request.url));
//     }
//   } catch (error) {
//     console.error("Error processing middleware:", error);
//     return NextResponse.redirect(new URL("/", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
// };
