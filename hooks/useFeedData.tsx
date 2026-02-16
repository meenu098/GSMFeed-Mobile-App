import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const REQUEST_TIMEOUT_MS = 12000;

export const useFeedData = (rootUrl: string) => {
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const fetchFeed = useCallback(
    async (pageNum = 1) => {
      if (isLoadingRef.current) return;
      setIsLoading(true);
      setError(null);

      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) {
          setError("Session not found. Please login again.");
          setIsLoading(false);
          return;
        }
        const userObj = JSON.parse(userString);
        const token = userObj.token;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, REQUEST_TIMEOUT_MS);

        const response = await fetch(`${rootUrl}?page=${pageNum}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const res = await response.json();

        if (res.status) {
          setFeed((prev) =>
            pageNum === 1 ? res.data.data : [...prev, ...res.data.data],
          );
          setError(null);
        } else {
          setError(res?.message || "Unable to load feed.");
        }
      } catch (error: any) {
        if (error?.name === "AbortError") {
          setError("Request timed out. Check backend connection and try again.");
        } else {
          setError("Unable to connect to server. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [rootUrl],
  );

  return { feed, isLoading, error, fetchFeed };
};
