// hooks/useCreatePost.ts
import { PostCategory } from "@/components/morphing/community/types";
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

interface CreatePostData {
  title: string;
  content: string;
  categories: PostCategory[];
  openToChat: boolean;
}

export function useCreatePost() {
  const { organizationId } = useOrganization();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (data: CreatePostData): Promise<string | null> => {
    if (!auth.currentUser) {
      setError("You must be logged in to create a post");
      return null;
    }

    if (!organizationId) {
      setError("Organization not loaded");
      return null;
    }

    if (!data.title.trim()) {
      setError("Title is required");
      return null;
    }

    if (!data.content.trim()) {
      setError("Content is required");
      return null;
    }

    if (data.categories.length === 0) {
      setError("Please select at least one category");
      return null;
    }

    setCreating(true);
    setError(null);

    try {
      const now = serverTimestamp();
      const fifteenMinutesLater = new Date();
      fifteenMinutesLater.setMinutes(fifteenMinutesLater.getMinutes() + 15);

      const docRef = await addDoc(
        collection(db, "organizations", organizationId, "communityPosts"),
        {
          uid: auth.currentUser.uid,
          title: data.title.trim(),
          content: data.content.trim(),
          categories: data.categories,
          openToChat: data.openToChat,
          createdAt: now,
          updatedAt: now,
          lastEditableAt: fifteenMinutesLater,
          likeCount: 0,
          commentCount: 0,
          status: "pending", // Will trigger moderation Cloud Function
          isDeleted: false,
        }
      );

      return docRef.id;
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    createPost,
    creating,
    error,
  };
}
