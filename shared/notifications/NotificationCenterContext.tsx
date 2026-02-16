import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import CONFIG from "../config";

const POLL_INTERVAL_MS = 60_000;

type NotificationCenterContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationCenterContext = createContext<
  NotificationCenterContextType | undefined
>(undefined);

const isUnread = (value: unknown) => {
  if (typeof value === "boolean") return !value;
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "0" || normalized === "false" || normalized === "no";
  }
  return true;
};

const parseUnreadCount = (payload: any) => {
  const directCount =
    payload?.unread_count ??
    payload?.data?.unread_count ??
    payload?.meta?.unread_count;

  if (typeof directCount === "number" && Number.isFinite(directCount)) {
    return Math.max(0, directCount);
  }

  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.notifications)
      ? payload.notifications
      : Array.isArray(payload?.data?.notifications)
        ? payload.data.notifications
        : [];

  return items.reduce(
    (count: number, item: any) => count + (isUnread(item?.is_read) ? 1 : 0),
    0,
  );
};

export const NotificationCenterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        if (isMountedRef.current) setUnreadCount(0);
        return;
      }

      const user = JSON.parse(userString);
      if (!user?.token) {
        if (isMountedRef.current) setUnreadCount(0);
        return;
      }

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/notifications?offset=0`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) return;

      const json = await response.json();
      if (!isMountedRef.current) return;
      setUnreadCount(parseUnreadCount(json));
    } catch {
      // Silently keep the previous badge count on transient network failures.
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refreshUnreadCount();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          refreshUnreadCount();
        }
      },
    );

    const intervalId = setInterval(() => {
      refreshUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnreadCount, setUnreadCount }),
    [unreadCount, refreshUnreadCount],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
};

export const useNotificationCenter = () => {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error(
      "useNotificationCenter must be used within NotificationCenterProvider",
    );
  }
  return context;
};
