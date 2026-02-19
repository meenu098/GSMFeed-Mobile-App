import Constants from "expo-constants";
import { Platform } from "react-native";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const extractExpoHostIp = () => {
  const fromExpoConfig = (Constants.expoConfig as any)?.hostUri;
  const fromManifest2 = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  const fromDebuggerHost = (Constants as any)?.manifest?.debuggerHost;
  const hostUri = fromExpoConfig || fromManifest2 || fromDebuggerHost;

  if (typeof hostUri !== "string" || !hostUri.trim()) return null;

  const host = hostUri.split(":")[0]?.trim();
  if (!host || LOCAL_HOSTNAMES.has(host)) return null;
  return host;
};

const resolveNativeLocalhost = (rawUrl: string) => {
  const normalizedRaw = trimTrailingSlash(rawUrl);
  if (Platform.OS === "web") return normalizedRaw;

  try {
    const parsedUrl = new URL(normalizedRaw);
    if (!LOCAL_HOSTNAMES.has(parsedUrl.hostname)) return normalizedRaw;

    const expoHostIp = extractExpoHostIp();
    if (expoHostIp) {
      parsedUrl.hostname = expoHostIp;
      return trimTrailingSlash(parsedUrl.toString());
    }

    if (Platform.OS === "android") {
      parsedUrl.hostname = "10.0.2.2";
      return trimTrailingSlash(parsedUrl.toString());
    }

    return normalizedRaw;
  } catch {
    return normalizedRaw;
  }
};

const resolveApiEndpoint = () => {
  const rawEndpoint =
    process.env.EXPO_PUBLIC_API_ENDPOINT ?? "https://api.gsmfeed.com";
  return resolveNativeLocalhost(rawEndpoint);
};

const apiEndpoint = resolveApiEndpoint();
const appUrl = resolveNativeLocalhost(
  process.env.EXPO_PUBLIC_APP_URL ?? "https://app.gsmfeed.com",
);
const landingUrl =
  trimTrailingSlash(process.env.EXPO_PUBLIC_LANDING_URL ?? "https://gsmfeed.com");
const currentDomain = process.env.EXPO_PUBLIC_CURRENT_DOMAIN ?? "gsmfeed.com";
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
