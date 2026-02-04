import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

export const useFeedData = (rootUrl: string) => {
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchFeed = useCallback(
    async (pageNum = 1) => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) {
          setIsLoading(false);
          return;
        }
        const userObj = JSON.parse(userString);
        const token = userObj.token;

        const response = await fetch(`${rootUrl}?page=${pageNum}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const res = await response.json();

        if (res.status) {
          setFeed((prev) =>
            pageNum === 1 ? res.data.data : [...prev, ...res.data.data],
          );
          setPage(pageNum);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    },
    [rootUrl],
  );

  return { feed, isLoading, fetchFeed };
};
