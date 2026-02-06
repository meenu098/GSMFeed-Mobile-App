import { api } from "../client";

export type FeedResponse = {
  status: boolean;
  data?: any;
  message?: string;
};

export const getFeed = (page: number) =>
  api.get<FeedResponse>(`/api/feed/posts?page=${page}`);

export const recordInteraction = (postId: string | number) =>
  api.post<FeedResponse>("/api/feed/post/stat/record-interaction", {
    post_id: postId,
  });

export const reactToPost = (postId: string | number, reaction: string) => {
  const data = new FormData();
  data.append("reaction", reaction);
  return api.post<FeedResponse>(`/api/feed/post/react/${postId}`, data);
};
