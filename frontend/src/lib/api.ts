const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function register(email: string, password: string) {
  return request<{ message: string; user: { id: string; email: string; createdAt: string } }>("/api/users/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return request<{ message: string; user: { id: string; email: string; createdAt: string } }>("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return request<{ message: string }>("/api/users/logout", { method: "POST" });
}

export async function getProfile() {
  return request<{ user: User }>("/api/users/profile");
}

export async function getThreads(page = 1, limit = 20) {
  return request<{ threads: Thread[]; pagination: Pagination }>(`/api/threads?page=${page}&limit=${limit}`);
}

export async function getThread(id: string) {
  return request<{ thread: ThreadDetail }>(`/api/threads/${id}`);
}

export async function createThread(data: { title: string; url?: string; domain?: string; imageUrl?: string }) {
  return request<{ message: string; thread: Thread }>("/api/threads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getComments(threadId: string) {
  return request<{ comments: Comment[] }>(`/api/threads/${threadId}/comments`);
}

export async function createComment(threadId: string, content: string, parentId?: string) {
  return request<{ message: string; comment: Comment }>(`/api/threads/${threadId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  });
}

export async function voteComment(commentId: string, type: "up" | "down") {
  return request<{ action: string; type: string }>(`/api/comments/${commentId}/vote`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

// Types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  shadowScore: number;
  isBanned: boolean;
}

export interface Thread {
  id: string;
  title: string;
  url: string;
  domain: string;
  imageUrl: string | null;
  createdAt: string;
  creatorId: string;
  _count?: { comments: number; participants: number };
  myPseudonym?: string | null;
  myAvatarColor?: string | null;
}

export interface ThreadDetail extends Thread {
  participants: Participant[];
}

export interface Participant {
  id: string;
  pseudonym: string;
  avatarColor: string;
  joinedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  participantId: string;
  threadId: string;
  parentId: string | null;
  participant: {
    id?: string;
    pseudonym: string;
    avatarColor: string;
  };
  _count?: { replies: number };
  isHidden?: boolean;
  isMe?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
