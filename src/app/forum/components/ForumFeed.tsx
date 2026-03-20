"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import PostDetailModal from "./PostDetailModal";
import EditPostModal from "./EditPostModal";
import { formatTimeAgo } from "./time";
import { parseThreadContent } from "./threadContent";
import {
  Search,
  Plus,
  Flame,
  Clock3,
  MessageSquare,
  Sparkles,
  RefreshCcw,
  Archive,
} from "lucide-react";
import { onAuthEvent } from "@/lib/authEvents";
import { readAuthHint, writeAuthHint } from "@/lib/authState";
import { emitMissionEvent } from "@/lib/missionEvents";

type ForumPost = {
  id: number;
  author: string;
  avatar: string;
  createdAt: string;
  title: string;
  content: string;
  rawContent?: string;
  meta?: { label: string; value: string }[];
  pollOptions?: string[];
  likes: number;
  liked?: boolean;
  comments: number;
  tag?: string;
  canDelete?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  archived?: boolean;
  reactionCounts?: Record<string, number>;
  myReactions?: string[];
};

type ForumComment = {
  id: number;
  author: string;
  avatar: string;
  createdAt: string;
  content: string;
  likes: number;
  liked?: boolean;
  parentId?: number | null;
  replies?: ForumComment[];
  canDelete?: boolean;
};

type ApiThread = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  board?: { id: number; name: string } | null;
  author?: { id: number; name: string; avatar: string | null } | null;
  comments?: number;
  likes?: number;
  liked?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  archived?: boolean;
  reactionCounts?: Record<string, number>;
  myReactions?: string[];
};

type ApiComment = {
  id: number;
  content: string;
  createdAt: string;
  parentId?: number | null;
  author?: { id: number; name: string; avatar: string | null } | null;
  likes?: number;
  liked?: boolean;
  canDelete?: boolean;
};

const FALLBACK_AUTHOR = "Gość";
const FALLBACK_AVATAR = "/artwork/avatar_default.svg";
const ARCHIVE_TAG = "Archiwum";

const CATEGORIES = [
  "Spinning",
  "Grunt / Feeder",
  "Spławik",
  "Muchowe",
  "Trolling",
  "Podlodowe",
  "Morskie",
  "Karpiowe",
  "Drapieżniki",
  "Białoryb",
  "Sprzęt i testy",
  "Przynęty i zanęty",
  "Relacje z łowisk",
  "Poradniki",
  "Organizacja wypraw",
  "Ogłoszenia",
  "Ogólne",
];

function mapThread(thread: ApiThread): ForumPost {
  const parsed = parseThreadContent(thread.content);
  const archived =
    Boolean(thread.archived) ||
    thread.board?.name?.trim().toLowerCase() === ARCHIVE_TAG.toLowerCase();
  return {
    id: thread.id,
    title: thread.title,
    content: parsed.body,
    rawContent: thread.content,
    meta: parsed.meta,
    pollOptions: parsed.pollOptions,
    createdAt: thread.createdAt,
    author: thread.author?.name ?? FALLBACK_AUTHOR,
    avatar: thread.author?.avatar ?? FALLBACK_AVATAR,
    likes: thread.likes ?? 0,
    liked: thread.liked ?? false,
    comments: thread.comments ?? 0,
    tag: thread.board?.name,
    canDelete: thread.canDelete ?? false,
    canEdit: thread.canEdit ?? false,
    canArchive: thread.canArchive ?? false,
    archived,
    reactionCounts: thread.reactionCounts ?? {},
    myReactions: thread.myReactions ?? [],
  };
}

function mapComment(comment: ApiComment): ForumComment {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: comment.author?.name ?? FALLBACK_AUTHOR,
    avatar: comment.author?.avatar ?? FALLBACK_AVATAR,
    likes: comment.likes ?? 0,
    liked: comment.liked ?? false,
    parentId: comment.parentId ?? null,
    canDelete: comment.canDelete ?? false,
  };
}

function buildCommentTree(flat: ForumComment[]) {
  const byId = new Map<number, ForumComment & { replies: ForumComment[] }>();
  flat.forEach((comment) => {
    byId.set(comment.id, { ...comment, replies: [] });
  });

  const roots: ForumComment[] = [];

  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      const parent = byId.get(comment.parentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function insertComment(
  comments: ForumComment[],
  newComment: ForumComment,
  parentId?: number | null
) {
  if (!parentId) {
    return [...comments, newComment];
  }

  const insertInto = (
    items: ForumComment[]
  ): { items: ForumComment[]; inserted: boolean } => {
    let inserted = false;
    const next = items.map((item) => {
      if (item.id === parentId) {
        inserted = true;
        return {
          ...item,
          replies: [...(item.replies ?? []), newComment],
        };
      }
      if (item.replies?.length) {
        const result = insertInto(item.replies);
        if (result.inserted) {
          inserted = true;
          return { ...item, replies: result.items };
        }
      }
      return item;
    });
    return { items: next, inserted };
  };

  const result = insertInto(comments);
  return result.inserted ? result.items : [...comments, newComment];
}

function updateCommentLike(
  comments: ForumComment[],
  commentId: number,
  liked: boolean,
  likes: number
): ForumComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return { ...comment, liked, likes };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateCommentLike(comment.replies, commentId, liked, likes),
      };
    }
    return comment;
  });
}

function countCommentTree(comment: ForumComment): number {
  if (!comment.replies || comment.replies.length === 0) return 1;
  return (
    1 +
    comment.replies.reduce(
      (sum, reply) => sum + countCommentTree(reply),
      0
    )
  );
}

function removeCommentById(comments: ForumComment[], commentId: number) {
  let removedCount = 0;
  const next = comments.reduce<ForumComment[]>((acc, comment) => {
    if (comment.id === commentId) {
      removedCount += countCommentTree(comment);
      return acc;
    }
    if (comment.replies?.length) {
      const result = removeCommentById(comment.replies, commentId);
      if (result.removedCount > 0) {
        removedCount += result.removedCount;
        acc.push({ ...comment, replies: result.comments });
        return acc;
      }
    }
    acc.push(comment);
    return acc;
  }, []);

  return { comments: next, removedCount };
}

function findCommentById(
  comments: ForumComment[],
  commentId: number
): ForumComment | null {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.replies?.length) {
      const match = findCommentById(comment.replies, commentId);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

export default function ForumFeed() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "popular" | "newest" | "unanswered" | "archived"
  >("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initialAuthHint = readAuthHint();
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuthHint ?? false
  );
  const [authReady, setAuthReady] = useState(initialAuthHint === true);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastThreadParamRef = useRef<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    return onAuthEvent((event) => {
      if (event.type === "logout") {
        setIsAuthenticated(false);
        setAuthReady(true);
        setSelectedPostId(null);
        writeAuthHint(false);
      }
      if (event.type === "login") {
        setIsAuthenticated(true);
        setAuthReady(true);
        writeAuthHint(true);
      }
    });
  }, []);

  useEffect(() => {
    if (authReady) return;
    const hint = readAuthHint();
    if (hint === true) {
      setIsAuthenticated(true);
      setAuthReady(true);
    }
  }, [authReady]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastKey(Date.now());
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2400);
  }, []);

  const updateThreadParam = useCallback(
    (postId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (postId) {
        params.set("watek", String(postId));
      } else {
        params.delete("watek");
      }
      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const openPost = useCallback(
    (postId: number) => {
      setSelectedPostId(postId);
      updateThreadParam(postId);
    },
    [updateThreadParam]
  );

  const closePost = useCallback(() => {
    setSelectedPostId(null);
    updateThreadParam(null);
  }, [updateThreadParam]);

  const openEditPost = useCallback((post: ForumPost) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  }, []);

  const closeEditPost = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingPost(null);
  }, []);

  useEffect(() => {
    const raw = searchParams.get("watek");
    if (raw === lastThreadParamRef.current) return;
    lastThreadParamRef.current = raw;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) {
      setSelectedPostId(parsed);
      return;
    }
    setSelectedPostId(null);
  }, [searchParams]);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/forum/threads", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("FAILED_TO_LOAD");
      }
      const data = (await response.json()) as any;
      const rawThreads: ApiThread[] = Array.isArray(data?.threads)
        ? (data.threads as ApiThread[])
        : [];
      const threads = rawThreads.map(mapThread);
      const authed = Boolean(data?.viewer?.authenticated);
      setIsAuthenticated(authed);
      setAuthReady(true);
      writeAuthHint(authed);
      setPosts(threads);
      setSelectedPostId((current) =>
        current && threads.some((post) => post.id === current) ? current : null
      );
    } catch {
      setLoadError("Nie udało się wczytać wątków. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadComments = useCallback(async (threadId: number) => {
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const response = await fetch(`/api/forum/threads/${threadId}/comments`, {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setComments([]);
        setCommentsError("Zaloguj się, aby zobaczyć komentarze.");
        return;
      }
      if (!response.ok) {
        throw new Error("FAILED_TO_LOAD");
      }
      const data = await response.json();
      const loaded = Array.isArray(data?.comments)
        ? data.comments.map(mapComment)
        : [];
      setComments(buildCommentTree(loaded));
    } catch {
      setCommentsError("Nie udało się wczytać komentarzy.");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setComments([]);
      setCommentsError("Zaloguj się, aby zobaczyć komentarze.");
      setCommentsLoading(false);
      return;
    }

    loadComments(selectedPostId);
  }, [isAuthenticated, loadComments, selectedPostId]);

  const handleCreatePost = useCallback(
    async (newPost: { title: string; content: string; tag: string }) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby dodać wątek.");
        return false;
      }

      try {
        const response = await fetch("/api/forum/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: newPost.title,
            content: newPost.content,
            tag: newPost.tag,
          }),
        });

        if (response.status === 401) {
          showToast("Zaloguj się, aby dodać wątek.");
          return false;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_CREATE");
        }

        const data = await response.json();
        if (!data?.thread) {
          throw new Error("INVALID_PAYLOAD");
        }

        const created = mapThread(data.thread);
        setPosts((prev) => [created, ...prev]);
        setActiveFilter("all");
        openPost(created.id);
        showToast("Dodano nowy wątek.");
        emitMissionEvent("post");
        return true;
      } catch {
        showToast("Nie udało się dodać wątku.");
        return false;
      }
    },
    [isAuthenticated, openPost, showToast]
  );

  const handleUpdatePost = useCallback(
    async (payload: { id: number; title: string; content: string }) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby edytować wątek.");
        return false;
      }

      try {
        const response = await fetch(`/api/forum/threads/${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            content: payload.content,
          }),
        });

        if (response.status === 401) {
          showToast("Zaloguj się, aby edytować wątek.");
          return false;
        }
        if (response.status === 403) {
          showToast("Tylko autor może edytować wątek.");
          return false;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_UPDATE");
        }

        const data = await response.json();
        const updated = data?.thread;
        if (!updated) {
          throw new Error("INVALID_PAYLOAD");
        }

        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== payload.id) return post;
            const parsed = parseThreadContent(updated.content);
            return {
              ...post,
              title: updated.title,
              rawContent: updated.content,
              content: parsed.body,
              meta: parsed.meta,
              pollOptions: parsed.pollOptions,
              tag: updated.board?.name ?? post.tag,
            };
          })
        );

        showToast("Wątek zaktualizowany.");
        return true;
      } catch {
        showToast("Nie udało się zaktualizować wątku.");
        return false;
      }
    },
    [isAuthenticated, showToast]
  );

  const handleToggleLike = useCallback(
    async (postId: number) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby polubić wątek.");
        return;
      }

      let previous = { liked: false, likes: 0 };
      let hasPrevious = false;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const liked = Boolean(post.liked);
          const likes = post.likes ?? 0;
          previous = { liked, likes };
          hasPrevious = true;
          const nextLiked = !liked;
          const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));
          return { ...post, liked: nextLiked, likes: nextLikes };
        })
      );
      try {
        const response = await fetch(`/api/forum/threads/${postId}/like`, {
          method: "POST",
          credentials: "include",
        });

        if (response.status === 401) {
          if (hasPrevious) {
            const previousSnapshot = previous;
            setPosts((prev) =>
              prev.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      liked: previousSnapshot.liked,
                      likes: previousSnapshot.likes,
                    }
                  : post
              )
            );
          }
          showToast("Zaloguj się, aby polubić wątek.");
          return;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_TOGGLE");
        }

        const data = await response.json();
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, liked: data.liked, likes: data.likes }
              : post
          )
        );
      } catch {
        if (hasPrevious) {
          const previousSnapshot = previous;
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    liked: previousSnapshot.liked,
                    likes: previousSnapshot.likes,
                  }
                : post
            )
          );
        }
        showToast("Nie udało się zaktualizować polubień.");
      }
    },
    [isAuthenticated, showToast]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby usunąć komentarz.");
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "Czy na pewno chcesz usunąć ten komentarz?"
        );
        if (!confirmed) return;
      }

      try {
        const response = await fetch(`/api/forum/comments/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.status === 401) {
          showToast("Zaloguj się, aby usunąć komentarz.");
          return;
        }
        if (response.status === 403) {
          showToast("Nie masz uprawnień do usunięcia komentarza.");
          return;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_DELETE");
        }

        let removedCount = 0;
        setComments((prev) => {
          const result = removeCommentById(prev, commentId);
          removedCount = result.removedCount;
          return result.comments;
        });

        if (removedCount > 0 && selectedPostId) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === selectedPostId
                ? {
                    ...post,
                    comments: Math.max(0, post.comments - removedCount),
                  }
                : post
            )
          );
        }

        showToast("Komentarz usunięty.");
      } catch {
        showToast("Nie udało się usunąć komentarza.");
      }
    },
    [isAuthenticated, selectedPostId, showToast]
  );

  const handleToggleCommentLike = useCallback(
    async (commentId: number) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby polubić komentarz.");
        return;
      }

      let previous = { liked: false, likes: 0 };
      let hasPrevious = false;
      setComments((prev) => {
        const current = findCommentById(prev, commentId);
        if (!current) {
          return prev;
        }
        const liked = Boolean(current.liked);
        const likes = current.likes ?? 0;
        previous = { liked, likes };
        hasPrevious = true;
        const nextLiked = !liked;
        const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));
        return updateCommentLike(prev, commentId, nextLiked, nextLikes);
      });

      try {
        const response = await fetch(`/api/forum/comments/${commentId}/like`, {
          method: "POST",
          credentials: "include",
        });

        if (response.status === 401) {
          if (hasPrevious) {
            setComments((prev) =>
              updateCommentLike(prev, commentId, previous.liked, previous.likes)
            );
          }
          showToast("Zaloguj się, aby polubić komentarz.");
          return;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_TOGGLE");
        }

        const data = await response.json();
        setComments((prev) =>
          updateCommentLike(prev, commentId, data.liked, data.likes)
        );
      } catch {
        if (hasPrevious) {
          setComments((prev) =>
            updateCommentLike(prev, commentId, previous.liked, previous.likes)
          );
        }
        showToast("Nie udało się zaktualizować reakcji.");
      }
    },
    [isAuthenticated, showToast]
  );
  const handleShare = useCallback(
    (post: ForumPost) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.pathname = "/forum";
      url.searchParams.set("watek", String(post.id));
      const shareUrl = url.toString();
      if (navigator?.share) {
        navigator.share({ title: post.title, url: shareUrl }).catch(() => null);
      }
      navigator?.clipboard?.writeText(shareUrl).catch(() => null);
      showToast("Link do dyskusji skopiowany.");
    },
    [showToast]
  );

  const handleDeletePost = useCallback(
    async (postId: number) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby usunąć wątek.");
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "Czy na pewno chcesz usunąć ten wątek?"
        );
        if (!confirmed) return;
      }

      try {
        const response = await fetch(`/api/forum/threads/${postId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.status === 401) {
          showToast("Zaloguj się, aby usunąć wątek.");
          return;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_DELETE");
        }

        setPosts((prev) => prev.filter((post) => post.id !== postId));
        if (selectedPostId === postId) {
          closePost();
        }
        showToast("Wątek usunięty.");
      } catch {
        showToast("Nie udało się usunąć wątku.");
      }
    },
    [closePost, isAuthenticated, selectedPostId, showToast]
  );

  const handleArchivePost = useCallback(
    async (postId: number) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby archiwizować wątek.");
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "Czy na pewno chcesz zarchiwizować ten wątek?"
        );
        if (!confirmed) return;
      }

      try {
        const response = await fetch(`/api/forum/threads/${postId}`, {
          method: "PATCH",
          credentials: "include",
        });

        if (response.status === 401) {
          showToast("Zaloguj się, aby archiwizować wątek.");
          return;
        }
        if (response.status === 403) {
          showToast("Tylko autor może archiwizować wątek.");
          return;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_ARCHIVE");
        }

        const data = await response.json().catch(() => null);
        const tagName =
          typeof data?.board?.name === "string" && data.board.name.trim()
            ? data.board.name
            : ARCHIVE_TAG;

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, archived: true, tag: tagName }
              : post
          )
        );
        showToast("Wątek przeniesiony do archiwum.");
      } catch {
        showToast("Nie udało się zarchiwizować wątku.");
      }
    },
    [isAuthenticated, showToast]
  );

  const handleAddComment = useCallback(
    async (content: string, parentId?: number | null) => {
      if (!selectedPostId) return false;
      const selected = posts.find((post) => post.id === selectedPostId);
      if (selected?.archived) {
        showToast("Ten wątek jest w archiwum. Nie można dodać odpowiedzi.");
        return false;
      }
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby dodać komentarz.");
        return false;
      }

      try {
        const response = await fetch(
          `/api/forum/threads/${selectedPostId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content, parentId: parentId ?? null }),
          }
        );

        if (response.status === 401) {
          showToast("Zaloguj się, aby dodać komentarz.");
          return false;
        }
        if (!response.ok) {
          throw new Error("FAILED_TO_CREATE");
        }

        const data = await response.json();
        if (!data?.comment) {
          throw new Error("INVALID_PAYLOAD");
        }

        const created = mapComment(data.comment);
        setComments((prev) =>
          insertComment(prev, created, created.parentId ?? null)
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === selectedPostId
              ? { ...post, comments: post.comments + 1 }
              : post
          )
        );
        emitMissionEvent("post");
        return true;
      } catch {
        showToast("Nie udało się dodać komentarza.");
        return false;
      }
    },
    [isAuthenticated, posts, selectedPostId, showToast]
  );

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = query
      ? posts.filter(
          (post) =>
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query)
        )
      : posts;

    const filtered = base.filter((post) => {
      const isArchived = Boolean(post.archived);
      if (activeFilter === "archived") return isArchived;
      if ((activeFilter === "popular" || activeFilter === "newest") && isArchived) {
        return false;
      }
      if (activeFilter === "unanswered") return post.comments === 0;
      return true;
    });

    const resolveTimestamp = (post: ForumPost) => {
      const parsed = Date.parse(post.createdAt);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    if (activeFilter === "popular") {
      return [...filtered].sort((a, b) => b.likes - a.likes);
    }

    if (activeFilter === "newest") {
      return [...filtered].sort(
        (a, b) => resolveTimestamp(b) - resolveTimestamp(a)
      );
    }

    return [...filtered].sort(
      (a, b) => resolveTimestamp(b) - resolveTimestamp(a)
    );
  }, [activeFilter, posts, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.14),transparent_35%)]" />
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_80%_10%,rgba(0,150,255,0.12),transparent_35%)]" />
        <div className="relative p-6 md:p-10 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground-2">
          <span className="px-3 py-1 rounded-full border border-accent/40 bg-accent/10 text-accent">
            Forum
          </span>
          <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
            Społeczność RybiaPaka
          </span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
              Forum, w którym każde branie ma swoją historię
            </h1>
            <p className="text-sm md:text-base text-foreground-2">
              Od spinningu po karpie: raporty z łowisk, testy przynęt,
              strategie i sprzęt, który nie zawodzi. Dodaj swój wątek albo
              wskocz w rozmowę, zanim sygnalizator zapiszczy.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                if (!authReady) {
                  return;
                }
                if (!isAuthenticated) {
                  showToast("Zaloguj się, aby dodać wątek.");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              disabled={!authReady || !isAuthenticated}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors interactive-press hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
            >
              <Plus size={18} />
              Nowy wątek
            </button>
            {authReady && !isAuthenticated && (
              <Link
                href="/logowanie"
                className="text-center text-xs text-foreground-2 underline decoration-white/20 underline-offset-4 transition hover:text-accent hover:decoration-accent/60"
              >
                Zaloguj się, aby dodać wątek.
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-background-3">
            <Flame size={14} className="text-accent" />
            <span>Gorące wątki</span>
          </div>
          <span>Wątki: {posts.length}</span>
          <span>•</span>
          <span>Komentarze: {posts.reduce((acc, post) => acc + post.comments, 0)}</span>
        </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.12),transparent_45%)]" />
        <div className="absolute inset-0 opacity-50 blur-3xl bg-[radial-gradient(circle_at_80%_20%,rgba(0,150,255,0.1),transparent_50%)]" />
        <div className="relative p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide interactive-press border ${
                activeFilter === "all"
                  ? "bg-accent/15 border-accent/40 text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.18)]"
                  : "bg-background-4/60 border-white/10 text-foreground-2 hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Sparkles size={16} className="inline-block mr-2" />
              Wszystkie
            </button>
            <button
              onClick={() => setActiveFilter("popular")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide interactive-press border ${
                activeFilter === "popular"
                  ? "bg-accent/15 border-accent/40 text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.18)]"
                  : "bg-background-4/60 border-white/10 text-foreground-2 hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Flame size={16} className="inline-block mr-2" />
              Popularne
            </button>
            <button
              onClick={() => setActiveFilter("newest")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide interactive-press border ${
                activeFilter === "newest"
                  ? "bg-accent/15 border-accent/40 text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.18)]"
                  : "bg-background-4/60 border-white/10 text-foreground-2 hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Clock3 size={16} className="inline-block mr-2" />
              Najnowsze
            </button>
            <button
              onClick={() => setActiveFilter("unanswered")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide interactive-press border ${
                activeFilter === "unanswered"
                  ? "bg-accent/15 border-accent/40 text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.18)]"
                  : "bg-background-4/60 border-white/10 text-foreground-2 hover:border-white/20 hover:text-foreground"
              }`}
            >
              <MessageSquare size={16} className="inline-block mr-2" />
              Bez odpowiedzi
            </button>
            <button
              onClick={() => setActiveFilter("archived")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide interactive-press border ${
                activeFilter === "archived"
                  ? "bg-accent/15 border-accent/40 text-accent shadow-[0_0_0_1px_rgba(0,206,0,0.18)]"
                  : "bg-background-4/60 border-white/10 text-foreground-2 hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Archive size={16} className="inline-block mr-2" />
              Archiwizowane
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-2"
              size={18}
            />
            <input
              type="text"
              placeholder="Szukaj w wątkach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background-4/70 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-2 focus:outline-none focus:border-accent/60 focus:bg-background-4 transition-colors interactive-press"
            />
          </div>
        </div>
      </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-12 rounded-xl border border-white/10 bg-background-2 text-foreground-2">
            Ładujemy wątki...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="text-center py-12 rounded-xl border border-white/10 bg-background-2 text-foreground-2 space-y-3">
            <p>{loadError}</p>
            <button
              onClick={loadThreads}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-foreground hover:text-accent hover:border-accent/40 transition-colors interactive-press"
            >
              <RefreshCcw size={16} />
              Odśwież listę
            </button>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              {...post}
              timeAgo={formatTimeAgo(post.createdAt)}
              onLike={() => handleToggleLike(post.id)}
              onComment={() => openPost(post.id)}
              onShare={() => handleShare(post)}
              onClick={() => openPost(post.id)}
              onDelete={
                post.canDelete ? () => handleDeletePost(post.id) : undefined
              }
              authenticated={isAuthenticated}
            />
          ))}

        {!isLoading && !loadError && filteredPosts.length === 0 && (
          <div className="text-center py-16 text-foreground-2">
            <p className="text-base">
              {searchQuery.trim()
                ? "Nie znaleźliśmy wątków pasujących do wyszukiwania."
                : "Na razie cisza na forum. Dodaj pierwszy wątek!"}
            </p>
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-accent hover:underline mt-2"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        categories={CATEGORIES}
      />

      <PostDetailModal
        post={selectedPost}
        comments={comments}
        commentsLoading={commentsLoading}
        commentsError={commentsError}
        onRetryComments={
          isAuthenticated && selectedPostId
            ? () => loadComments(selectedPostId)
            : undefined
        }
        onClose={closePost}
        onToggleLike={handleToggleLike}
        onShare={handleShare}
        onAddComment={handleAddComment}
        onLikeComment={handleToggleCommentLike}
        onDeleteComment={handleDeleteComment}
        onDelete={
          selectedPost?.canDelete
            ? () => handleDeletePost(selectedPost.id)
            : undefined
        }
        onEdit={
          selectedPost?.canEdit
            ? () => openEditPost(selectedPost)
            : undefined
        }
        onArchive={
          selectedPost?.canArchive && !selectedPost.archived
            ? () => handleArchivePost(selectedPost.id)
            : undefined
        }
        canComment={isAuthenticated && !selectedPost?.archived}
        authenticated={isAuthenticated}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        post={
          editingPost
            ? {
                id: editingPost.id,
                title: editingPost.title,
                content: editingPost.rawContent ?? editingPost.content,
              }
            : null
        }
        onClose={closeEditPost}
        onSubmit={handleUpdatePost}
      />

      {toastMessage && (
        <div
          key={toastKey}
          className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg bg-background-4/90 border border-white/10 shadow-2xl text-sm text-foreground animate-toast"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}





















