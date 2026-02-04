// import { cookies } from "next/headers";
// import type { NextRequest } from "next/server";
// import { NextResponse } from "next/server";
// import CONFIG from "./config";

// export async function middleware(request: NextRequest) {
//   const res = NextResponse.next();

//   const path = request.nextUrl.pathname;

//   // Exclude /public-pricelist from redirection to auth
//   if (path.startsWith("/public-pricelist")) {
//     return res;
//   }

//   const host = request.headers.get("host");

//   if (host === "coolmix-pricelist.gsmfeed.com") {
//     // Rewrite it to the same path you'd have for the app domain
//     const url = request.nextUrl.clone();
//     url.pathname = "/public-pricelist/coolmix-eu";
//     return NextResponse.rewrite(url);
//   }

//   if (host === "coolmix-used-pricelist.gsmfeed.com") {
//     // Rewrite it to the same path you'd have for the app domain
//     const url = request.nextUrl.clone();
//     url.pathname = "/public-pricelist/coolmix-eu";
//     return NextResponse.rewrite(url);
//   }

//   if (host === "coolmix-new-pricelist.gsmfeed.com") {
//     // Rewrite it to the same path you'd have for the app domain
//     const url = request.nextUrl.clone();
//     url.pathname = "/public-pricelist/coolmix-eu-brandnew";
//     return NextResponse.rewrite(url);
//   }

//   if (path.includes("/profile/")) {
//     const headers = new Headers(request.headers);
//     headers.set("x-current-path", request.nextUrl.pathname);
//     return NextResponse.next({
//       request: {
//         headers: headers,
//       },
//     });
//   }

//   if (path.includes("/feed/post/")) {
//     const headers = new Headers(request.headers);
//     headers.set("x-current-path", request.nextUrl.pathname);
//     return NextResponse.next({
//       request: {
//         headers: headers,
//       },
//     });
//   }

//   if (path.split("/")[1] !== "auth" && !request.cookies.has("user")) {
//     return NextResponse.redirect(
//       new URL(`/auth/login?redirectTo=${path.toString()}`, request.url),
//     );
//   }

//   if (
//     request.cookies.has("user") &&
//     path.split("/")[1] !== "onboarding" &&
//     path.split("/")[1] !== "business-registered" &&
//     path.split("/")[1] !== "individual-registered" &&
//     path.split("/")[1] !== "under-review" &&
//     path.split("/")[1] !== "pricing" &&
//     path.split("/")[1] !== "subscription" &&
//     path.split("/")[1] !== "verification" &&
//     path.split("/")[1] !== "kyc-required"
//   ) {
//     const user = JSON.parse(request.cookies.get("user")?.value || "{}");

//     if (!user?.is_onboarding_complete) {
//       return NextResponse.redirect(new URL(`/onboarding`, request.url));
//     }

//     if (user?.is_suspended) {
//       const responseNew = NextResponse.redirect(
//         new URL(`/auth/login`, request.url),
//       );
//       responseNew.cookies.delete("user");
//       return responseNew;
//     }

//     if (user?.has_account_primary_access != 1) {
//       return NextResponse.redirect(new URL(`/under-review`, request.url));
//     }

//     if (user?.kyc_expired) {
//       return NextResponse.redirect(new URL(`/kyc-required`, request.url));
//     }
//   }

//   if (path.split("/")[1] === "under-review") {
//     const user = JSON.parse(request.cookies.get("user")?.value || "{}");
//     if (user?.has_account_primary_access == 1) {
//       return NextResponse.redirect(new URL(`/feed`, request.url));
//     }
//   }

//   if (path.split("/")[1] === "kyc-required") {
//     const user = JSON.parse(request.cookies.get("user")?.value || "{}");
//     if (!user?.kyc_expired) {
//       return NextResponse.redirect(new URL(`/feed`, request.url));
//     }
//   }

//   if (
//     (path.split("/")[1] === "auth" || path.split("/")[1] === "onboarding") &&
//     request.cookies.has("user")
//   ) {
//     const user = JSON.parse(request.cookies.get("user")?.value || "{}");
//     if (user?.is_onboarding_complete) {
//       return NextResponse.redirect(new URL(`/feed`, request.url));
//     }
//   }

//   if (
//     path.split("/")[1] === "verification" &&
//     request.cookies.has("user") &&
//     JSON.parse(request.cookies.get("user")?.value || "{}")?.kyc == 1
//   ) {
//     return NextResponse.redirect(new URL(`/feed`, request.url));
//   }

//   return res;
// }

// export const config = {
//   matcher: ["/((?!api|assets|_next/static|_next/image|favicon.ico).*)"],
// };
