// components/community/types.ts

export type PostCategory = "questions" | "resources" | "testimonies" | "other";
export type PostStatus = "pending" | "approved" | "rejected";
export type CommentStatus = "pending" | "approved" | "rejected";

export interface CommunityPost {
  id: string;
  uid: string;
  title: string;
  content: string;
  categories: PostCategory[];
  createdAt: Date;
  updatedAt: Date;
  lastEditableAt: Date;
  likeCount: number;
  commentCount: number;
  status: PostStatus;
  isDeleted: boolean;
  // Client-side enriched data
  hasUserLiked?: boolean;
  authorUsername?: string; // user-xxxxx format
}

export interface PostComment {
  id: string;
  uid: string;
  content: string;
  createdAt: Date;
  parentCommentId: string | null;
  likeCount: number;
  status: CommentStatus;
  // Client-side enriched data
  hasUserLiked?: boolean;
  authorUsername?: string;
  replies?: PostComment[]; // For nested display
}

export interface PostLike {
  createdAt: Date;
}

export interface CommentLike {
  createdAt: Date;
}
