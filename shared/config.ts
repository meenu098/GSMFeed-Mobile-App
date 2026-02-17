import { Platform } from "react-native";

const resolveApiEndpoint = () => {
  const rawEndpoint =
    process.env.EXPO_PUBLIC_API_ENDPOINT ?? "https://api.gsmfeed.com";

  // Android emulator cannot reach host machine via localhost/127.0.0.1.
  if (Platform.OS !== "android") return rawEndpoint;

  try {
    const parsedUrl = new URL(rawEndpoint);
    if (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1"
    ) {
      parsedUrl.hostname = "10.0.2.2";
      return parsedUrl.toString().replace(/\/$/, "");
    }
    return rawEndpoint;
  } catch {
    return rawEndpoint;
  }
};

const apiEndpoint = resolveApiEndpoint();
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
