// lib\cookies.js
export function setCookie(response, name, value, options = {}) {
  // console.log("Setting cookie 1", response);
  // console.log("Setting cookie 2", name);
  // console.log("Setting cookie 3", value);
  const maxAge = 60 * 60 * 24 * 7;
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge,
    ...options,
  });
}
