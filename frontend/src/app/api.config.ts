/**
 * Cấu hình Endpoint API cho nhatbook
 * Môi trường: Localhost (Frontend: 5173, Backend: 3000)
 */

const BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:3000";
export const API_BASE_URL = `${BASE}/api`;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  GET_ME: `${API_BASE_URL}/users/me`,
  GET_ADMIN: `${API_BASE_URL}/users/admin`,
  GET_PUBLIC_PROFILE: (id: string) => `${API_BASE_URL}/users/p/${id}`,

  // User Profile
  PROFILE: `${API_BASE_URL}/users/me`,
  UPDATE_AVATAR: `${API_BASE_URL}/users/avatar`,
  GRANT_ROLE: `${API_BASE_URL}/users/grant-role`,
  CHECK_EMAIL: `${API_BASE_URL}/users/check-email`,
  GET_USERS: `${API_BASE_URL}/users`, // Admin only
  TOGGLE_LOCK: (id: string) => `${API_BASE_URL}/users/${id}/toggle-lock`, // Admin only

  // Posts
  GET_POSTS: `${API_BASE_URL}/posts`,
  CREATE_POST: `${API_BASE_URL}/posts`,
  UPLOAD_IMAGE: `${API_BASE_URL}/upload`,
  GET_POST_DETAIL: (id: string) => `${API_BASE_URL}/posts/${id}`,
  UPDATE_POST: (id: string) => `${API_BASE_URL}/posts/${id}`,
  DELETE_POST: (id: string) => `${API_BASE_URL}/posts/${id}`,
  LIKE_POST: (id: string) => `${API_BASE_URL}/posts/${id}/like`,
  GET_LIKES: (id: string) => `${API_BASE_URL}/posts/${id}/likes`,

  // Comments
  CREATE_COMMENT: `${API_BASE_URL}/comments`, // General create
  POST_COMMENT: (postId: string) => `${API_BASE_URL}/posts/${postId}/comments`, // Post specific
  GET_COMMENTS: (postId: string) => `${API_BASE_URL}/posts/${postId}/comments`,
  DELETE_COMMENT: (commentId: string) => `${API_BASE_URL}/comments/${commentId}`,

  // Notifications
  GET_NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  MARK_NOTIFICATIONS_READ: `${API_BASE_URL}/notifications/read`,

  // Chat/Messages
  GET_CONVERSATIONS: `${API_BASE_URL}/messages/conversations`,
  GET_CHAT_HISTORY: `${API_BASE_URL}/messages/history`,
  MARK_MESSAGES_READ: `${API_BASE_URL}/messages/read`,
  SEARCH_USERS_CHAT: `${API_BASE_URL}/messages/search`,

  // Friends
  FRIEND_REQUEST: `${API_BASE_URL}/friends/request`,
  FRIEND_RESPOND: `${API_BASE_URL}/friends/respond`,
  GET_FRIENDS: `${API_BASE_URL}/friends`,
  GET_PENDING_REQUESTS: `${API_BASE_URL}/friends/pending`,
  GET_FRIEND_STATUS: (id: string) => `${API_BASE_URL}/friends/status/${id}`,

  // Shop & Wallet
  GET_WALLET: `${API_BASE_URL}/users/wallet`,
  CHECKIN: `${API_BASE_URL}/users/checkin`,
  GET_INVENTORY: `${API_BASE_URL}/shop/inventory`,
  BUY_ITEM: `${API_BASE_URL}/shop/buy`,
  EQUIP_ITEM: `${API_BASE_URL}/shop/equip`,
  GET_LEADERBOARD: `${API_BASE_URL}/users/leaderboard`,
};
