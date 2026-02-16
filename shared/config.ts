const apiEndpoint =
  process.env.EXPO_PUBLIC_API_ENDPOINT ?? "https://api.gsmfeed.com";
const appUrl = process.env.EXPO_PUBLIC_APP_URL ?? "https://app.gsmfeed.com";
const landingUrl =
  process.env.EXPO_PUBLIC_LANDING_URL ?? "https://gsmfeed.com";
const currentDomain =
  process.env.EXPO_PUBLIC_CURRENT_DOMAIN ?? "gsmfeed.com";
const returnUrl =
  process.env.EXPO_PUBLIC_RETURN_URL ??
  `${appUrl.replace(/\/+$/, "")}/membership`;

const CONFIG = {
  API_ENDPOINT: apiEndpoint,
  APP_URL: appUrl,
  LANDING_URL: landingUrl,
  CURRENT_DOMAIN: currentDomain,
  RETURN_URL: returnUrl,
};

export default CONFIG;
