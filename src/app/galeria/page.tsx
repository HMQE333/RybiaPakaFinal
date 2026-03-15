
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  ExternalLink,
  Flag,
  Fish,
  Heart,
  MessageCircle,
  Plus,
  Pencil,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { RankBadge } from "@/components/Profile";
import CategoryBar from "./components/CategoryBar";
import CreateGalleryModal from "./components/CreateGalleryModal";
import EditGalleryModal from "./components/EditGalleryModal";
import GalleryGrid from "./components/GalleryGrid";
import type {
  CreateGalleryPayload,
  EditGalleryPayload,
  GalleryItemWithMeta,
} from "./components/galleryTypes";
import { CHANNELS } from "@/const/channels";
import { onAuthEvent } from "@/lib/authEvents";
import { readAuthHint, writeAuthHint } from "@/lib/authState";
import { emitMissionEvent } from "@/lib/missionEvents";
import { handleUploadImageError } from "@/lib/imageFallback";

type ApiGalleryItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  category: string;
  createdAt: string;
  likes: number;
  comments: number;
  liked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  author?: {
    id: number;
    name: string;
    avatar: string | null;
  };
};

type ApiComment = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  likes: number;
  liked?: boolean;
  canDelete?: boolean;
  author?: {
    id: number;
    name: string;
    avatar: string | null;
  };
};

type ApiProfile = {
  username: string;
  age: number | null;
  avatar?: string;
  methods: string[];
  postsCount: number;
  commentsCount: number;
  messagesCount: number;
  voivodeship: string | null;
  rank: string;
  joinedAt: string;
  bio?: string | null;
  status?: "online" | "offline";
};

type FlatComment = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  likes: number;
  liked?: boolean;
  time: string;
  createdAt: string;
  parentId: string | null;
  canDelete?: boolean;
};

type Comment = Omit<FlatComment, "parentId"> & { replies?: Comment[] };

const CATEGORY_NAMES = [
  "Wszystkie",
  "Życiówki",
  "Krajobraz",
  ...CHANNELS.filter((c) => c.id !== "memy" && c.id !== "gry").map(
    (c) => c.name
  ),
  "Sumowe",
];

const CREATE_CATEGORIES = CATEGORY_NAMES.filter(
  (category) => category !== "Wszystkie"
);

const REPORTED_COMMENT_STORAGE_KEY = "rybiapaka:gallery:reported-comments";

const REPORT_OPTIONS = [
  {
    id: "content",
    label: "Treść nieodpowiednia",
    description: "Wulgaryzmy, nękanie, niebezpieczne treści.",
  },
  {
    id: "spam",
    label: "Spam / reklama",
    description: "Niechciane linki lub promocje.",
  },
  {
    id: "other",
    label: "Inny powód",
    description: "Pozostałe naruszenia.",
  },
];

const FALLBACK_AVATAR = "/artwork/404_user.png";

const fishTrail = [
  { top: "6%", duration: "18s", delay: "0s" },
  { top: "18%", duration: "21s", delay: "2s" },
  { top: "30%", duration: "19s", delay: "1s" },
  { top: "45%", duration: "22s", delay: "3s" },
  { top: "60%", duration: "20s", delay: "4s" },
  { top: "74%", duration: "23s", delay: "5s" },
  { top: "88%", duration: "19s", delay: "6s" },
];

const formatRelativeTime = (iso: string) => {
  const parsed = new Date(iso);
  const diff = Date.now() - parsed.getTime();
  if (!Number.isFinite(diff)) return "";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "teraz";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 dzień";
  if (days < 7) return `${days} dni`;
  if (days < 14) return "tydzień temu";

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} tyg.`;

  const months = Math.floor(days / 30);
  return `${months} mies.`;
};

const formatAddedAt = (iso?: string) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return null;

  const dateString = parsed.toLocaleDateString("pl-PL");
  const diffDays = Math.max(
    0,
    Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24))
  );
  let rel = "";
  if (diffDays === 0) rel = "dzisiaj";
  else if (diffDays === 1) rel = "wczoraj";
  else if (diffDays < 7) rel = `${diffDays} dni temu`;
  else if (diffDays < 14) rel = "tydzień temu";
  else if (diffDays < 30) rel = `${Math.floor(diffDays / 7)} tyg. temu`;
  else rel = `${Math.floor(diffDays / 30)} mies. temu`;

  return `Dodano: ${dateString} (${rel})`;
};

const formatJoinedDate = (iso?: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
};

const mapGalleryItem = (item: ApiGalleryItem): GalleryItemWithMeta => ({
  id: item.id,
  imageUrl: item.imageUrl,
  title: item.title,
  author: item.author?.name ?? "Gość",
  authorAvatar: item.author?.avatar ?? FALLBACK_AVATAR,
  likes: item.likes ?? 0,
  comments: item.comments ?? 0,
  category: item.category,
  description: item.description ?? "",
  createdAt: item.createdAt,
  liked: item.liked ?? false,
  canEdit: item.canEdit ?? false,
  canDelete: item.canDelete ?? false,
});

const buildCommentTree = (flat: FlatComment[]) => {
  const byId = new Map<string, (Comment & { parentId?: string | null })>();

  flat.forEach((comment) => {
    byId.set(comment.id, { ...comment, replies: [] });
  });

  const roots: Array<Comment & { parentId?: string | null }> = [];

  byId.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      const parent = byId.get(comment.parentId);
      if (parent) {
        parent.replies = parent.replies ?? [];
        parent.replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  const strip = (comment: Comment & { parentId?: string | null }): Comment => {
    const { parentId, ...rest } = comment;
    if (rest.replies?.length) {
      rest.replies = rest.replies.map(strip);
    }
    return rest;
  };

  return roots.map(strip);
};

const insertComment = (
  comments: Comment[],
  newComment: Comment,
  parentId?: string | null
): Comment[] => {
  if (!parentId) {
    return [...comments, newComment];
  }

  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), newComment],
      };
    }
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: insertComment(comment.replies, newComment, parentId),
      };
    }
    return comment;
  });
};

const updateCommentLike = (
  comments: Comment[],
  commentId: string,
  liked: boolean,
  likes: number
): Comment[] =>
  comments.map((comment) => {
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

const countCommentTree = (comment: Comment): number => {
  if (!comment.replies || comment.replies.length === 0) return 1;
  return (
    1 +
    comment.replies.reduce(
      (sum, reply) => sum + countCommentTree(reply),
      0
    )
  );
};

const removeCommentById = (comments: Comment[], commentId: string) => {
  let removedCount = 0;
  const next = comments.reduce<Comment[]>((acc, comment) => {
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
};

const findCommentById = (
  comments: Comment[],
  commentId: string
): Comment | null => {
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
};

function GalleryPageInner() {
  const searchParams = useSearchParams();
  const initialAuthor = searchParams.get("autor");

  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(
    initialAuthor
  );
  const [items, setItems] = useState<GalleryItemWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemWithMeta | null>(
    null
  );
  const initialAuthHint = readAuthHint();
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuthHint ?? false
  );
  const [authReady, setAuthReady] = useState(initialAuthHint === true);
  const [authorInfo, setAuthorInfo] = useState<ApiProfile | null>(null);
  const [authorInfoLoading, setAuthorInfoLoading] = useState(false);
  const [authorInfoError, setAuthorInfoError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(
    () => new Set()
  );
  const [revealedReportedCommentIds, setRevealedReportedCommentIds] = useState<
    Set<string>
  >(() => new Set());
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareMenuUrl, setShareMenuUrl] = useState("");
  const [reportMenu, setReportMenu] = useState<{
    targetType: "gallery-item" | "gallery-comment";
    targetId: string;
    anchor: { x: number; y: number };
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const itemsRef = useRef<GalleryItemWithMeta[]>([]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const openEditModal = useCallback((item: GalleryItemWithMeta) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
    setShareMenuOpen(false);
    setReportMenu(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  }, []);
  const hasItems = items.length > 0;
  const replyTarget = useMemo(
    () => (replyTo ? findCommentById(comments, replyTo) : null),
    [comments, replyTo]
  );
  const authorDisplayName = authorInfo?.username || selectedAuthor?.trim() || "";
  const authorHandle = authorDisplayName ? authorDisplayName.toLowerCase() : "";
  const authorAvatar =
    authorInfo?.avatar && authorInfo.avatar.trim().length > 0
      ? authorInfo.avatar
      : authorInfo
      ? FALLBACK_AVATAR
      : null;
  const canSystemShare =
    typeof navigator !== "undefined" && Boolean(navigator.share);

  const authorMeta = useMemo(() => {
    if (!authorInfo) return null;
    const joined = formatJoinedDate(authorInfo.joinedAt);
    const parts = [
      authorInfo.voivodeship ? `Region: ${authorInfo.voivodeship}` : null,
      authorInfo.age !== null ? `Wiek: ${authorInfo.age}` : null,
      joined ? `Dołączył: ${joined}` : null,
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(" | ") : null;
  }, [authorInfo]);

  useEffect(() => {
    return onAuthEvent((event) => {
      if (event.type === "logout") {
        setIsAuthenticated(false);
        setAuthReady(true);
        setSelectedItemId(null);
        setReportedCommentIds(new Set());
        setRevealedReportedCommentIds(new Set());
        writeAuthHint(false);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(REPORTED_COMMENT_STORAGE_KEY);
          } catch {}
        }
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

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(REPORTED_COMMENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const ids = parsed.filter((id) => typeof id === "string");
      setReportedCommentIds(new Set(ids));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ids = Array.from(reportedCommentIds);
      if (ids.length === 0) {
        window.localStorage.removeItem(REPORTED_COMMENT_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(
        REPORTED_COMMENT_STORAGE_KEY,
        JSON.stringify(ids)
      );
    } catch {}
  }, [reportedCommentIds]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showComposer) return;
    const timer = setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [replyTo, selectedItemId, showComposer]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2400);
  }, []);

  useEffect(() => {
    const qpAuthor = searchParams.get("autor");
    if (qpAuthor) {
      setSelectedAuthor(qpAuthor);
    } else {
      setSelectedAuthor(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedAuthor) {
      setAuthorInfo(null);
      setAuthorInfoError(null);
      setAuthorInfoLoading(false);
      return;
    }

    const handle = selectedAuthor.trim();
    if (!handle) {
      setAuthorInfo(null);
      setAuthorInfoError(null);
      setAuthorInfoLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadAuthorProfile = async () => {
      setAuthorInfo(null);
      setAuthorInfoLoading(true);
      setAuthorInfoError(null);

      try {
        const res = await fetch(
          `/api/profile/${encodeURIComponent(handle)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setAuthorInfo(null);
          setAuthorInfoError("Profil autora nie został znaleziony.");
          return;
        }

        if (!res.ok) {
          throw new Error("FAILED_TO_LOAD");
        }

        const data: ApiProfile = await res.json();
        if (controller.signal.aborted) return;
        setAuthorInfo(data);
      } catch {
        if (controller.signal.aborted) return;
        setAuthorInfo(null);
        setAuthorInfoError("Nie udało się wczytać profilu autora.");
      } finally {
        if (!controller.signal.aborted) {
          setAuthorInfoLoading(false);
        }
      }
    };

    loadAuthorProfile();

    return () => controller.abort();
  }, [selectedAuthor]);

  const loadItems = useCallback(async () => {
    const hasExistingItems = itemsRef.current.length > 0;
    if (hasExistingItems) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);

      try {
      const params = new URLSearchParams();
      if (selectedCategory !== "Wszystkie") {
        params.set("category", selectedCategory);
      }
      if (selectedAuthor) {
        params.set("autor", selectedAuthor);
      }
      const qs = params.toString();
      const res = await fetch(`/api/galeria/items${qs ? `?${qs}` : ""}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("FAILED_TO_LOAD");
      }

      const data = (await res.json()) as any;
      const rawItems: ApiGalleryItem[] = Array.isArray(data?.items)
        ? (data.items as ApiGalleryItem[])
        : [];
      const loaded = rawItems.map(mapGalleryItem);
      setItems(loaded);
      const authed = Boolean(data?.viewer?.authenticated);
      setIsAuthenticated(authed);
      setAuthReady(true);
      writeAuthHint(authed);
      setSelectedItemId((current) =>
        current && loaded.some((item) => item.id === current) ? current : null
      );
    } catch {
      setLoadError("Nie udało się wczytać galerii. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setAuthReady(true);
    }
  }, [selectedAuthor, selectedCategory]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const loadComments = useCallback(async (itemId: string) => {
    setCommentsLoading(true);
    setCommentsError(null);

      try {
      const res = await fetch(`/api/galeria/items/${itemId}/comments`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("FAILED_TO_LOAD");
      }

      const data = await res.json();
      const flat: FlatComment[] = Array.isArray(data?.comments)
        ? data.comments.map((comment: ApiComment) => ({
            id: comment.id,
            user: comment.author?.name ?? "Gość",
            avatar: comment.author?.avatar ?? FALLBACK_AVATAR,
            text: comment.content,
            likes: comment.likes ?? 0,
            liked: comment.liked ?? false,
            time: formatRelativeTime(comment.createdAt),
            createdAt: comment.createdAt,
            parentId: comment.parentId,
            canDelete: comment.canDelete ?? false,
          }))
        : [];
      setComments(buildCommentTree(flat));
      const authed = Boolean(data?.viewer?.authenticated);
      setIsAuthenticated(authed);
      setAuthReady(true);
      writeAuthHint(authed);
    } catch {
      setCommentsError("Nie udało się wczytać komentarzy.");
    } finally {
      setCommentsLoading(false);
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    setShareMenuOpen(false);
    setShareMenuUrl("");
    setReportMenu(null);

    if (!selectedItemId) {
      setComments([]);
      setCommentsError(null);
      setCommentsLoading(false);
      setShowComposer(false);
      setCommentDraft("");
      setReplyTo(null);
      return;
    }

    const qpItem = searchParams.get("zdjecie");
    if (qpItem && qpItem !== selectedItemId) {
      setSelectedItemId(qpItem);
      return;
    }

    setReplyTo(null);
    setCommentDraft("");
    setShowComposer(true);
    loadComments(selectedItemId);
  }, [loadComments, searchParams, selectedItemId]);

  useEffect(() => {
    const targetId = searchParams.get("zdjecie");
    if (!targetId) return;
    if (items.some((item) => item.id === targetId)) {
      setSelectedItemId(targetId);
    }
  }, [items, searchParams]);

  const handleCreateItem = useCallback(
    async (payload: CreateGalleryPayload) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby dodać zdjęcie.");
        return false;
      }

      try {
        const formData = new FormData();
        formData.append("title", payload.title);
        formData.append("description", payload.description);
        formData.append("category", payload.category);
        if (payload.imageFile) {
          formData.append("file", payload.imageFile);
        } else if (payload.imageUrl) {
          formData.append("imageUrl", payload.imageUrl);
        }

        const res = await fetch("/api/galeria/items", {
          method: "POST",
          body: formData,
        });

        if (res.status === 401) {
          showToast("Zaloguj się, aby dodać zdjęcie.");
          return false;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_CREATE");
        }

        const data = await res.json();
        if (!data?.item) {
          throw new Error("INVALID_PAYLOAD");
        }

        const created = mapGalleryItem(data.item);
        setItems((prev) => [created, ...prev]);
        setSelectedCategory("Wszystkie");
        setSelectedAuthor(null);
        setSelectedItemId(created.id);
        showToast("Dodano nowe zdjęcie.");
        emitMissionEvent("photo");
        return true;
      } catch {
        showToast("Nie udało się dodać zdjęcia.");
        return false;
      }
    },
    [isAuthenticated, showToast]
  );

  const handleToggleLike = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby polubić zdjęcie.");
        return;
      }

      let previous = { liked: false, likes: 0 };
      let hasPrevious = false;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const liked = Boolean(item.liked);
          const likes = item.likes ?? 0;
          previous = { liked, likes };
          hasPrevious = true;
          const nextLiked = !liked;
          const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));
          return { ...item, liked: nextLiked, likes: nextLikes };
        })
      );

      try {
        const res = await fetch(`/api/galeria/items/${itemId}/like`, {
          method: "POST",
        });
        if (res.status === 401) {
          if (hasPrevious) {
            setItems((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, liked: previous.liked, likes: previous.likes }
                  : item
              )
            );
          }
          showToast("Zaloguj się, aby polubić zdjęcie.");
          return;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_TOGGLE");
        }
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, liked: data.liked, likes: data.likes }
              : item
          )
        );
      } catch {
        if (hasPrevious) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, liked: previous.liked, likes: previous.likes }
                : item
            )
          );
        }
        showToast("Nie udało się zaktualizować polubień.");
      }
    },
    [isAuthenticated, showToast]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
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
        const res = await fetch(`/api/galeria/comments/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (res.status === 401) {
          showToast("Zaloguj się, aby usunąć komentarz.");
          return;
        }
        if (res.status === 403) {
          showToast("Nie masz uprawnień do usunięcia.");
          return;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_DELETE");
        }

        let removedCount = 0;
        setComments((prev) => {
          const result = removeCommentById(prev, commentId);
          removedCount = result.removedCount;
          return result.comments;
        });

        if (removedCount > 0 && selectedItemId) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === selectedItemId
                ? {
                    ...item,
                    comments: Math.max(0, item.comments - removedCount),
                  }
                : item
            )
          );
        }

        showToast("Komentarz usunięty.");
      } catch {
        showToast("Nie udało się usunąć komentarza.");
      }
    },
    [isAuthenticated, selectedItemId, showToast]
  );

  const handleUpdateItem = useCallback(
    async (payload: EditGalleryPayload) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby edytować zdjęcie.");
        return false;
      }

      try {
        const res = await fetch(`/api/galeria/items/${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            description: payload.description,
            category: payload.category,
            imageUrl: payload.imageUrl,
          }),
        });

        if (res.status === 401) {
          showToast("Zaloguj się, aby edytować zdjęcie.");
          return false;
        }
        if (res.status === 403) {
          showToast("Nie masz uprawnień do edycji.");
          return false;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_UPDATE");
        }

        const data = await res.json();
        if (!data?.item) {
          throw new Error("INVALID_PAYLOAD");
        }

        const updated = mapGalleryItem(data.item);
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        showToast("Zdjęcie zaktualizowane.");
        return true;
      } catch {
        showToast("Nie udało się zaktualizować zdjęcia.");
        return false;
      }
    },
    [isAuthenticated, showToast]
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby usunąć zdjęcie.");
        return;
      }

      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "Czy na pewno chcesz usunąć to zdjęcie?"
        );
        if (!confirmed) return;
      }

      try {
        const res = await fetch(`/api/galeria/items/${itemId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (res.status === 401) {
          showToast("Zaloguj się, aby usunąć zdjęcie.");
          return;
        }
        if (res.status === 403) {
          showToast("Nie masz uprawnień do usunięcia.");
          return;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_DELETE");
        }

        setItems((prev) => prev.filter((item) => item.id !== itemId));
        if (selectedItemId === itemId) {
          setSelectedItemId(null);
        }
        showToast("Zdjęcie usunięte.");
      } catch {
        showToast("Nie udało się usunąć zdjęcia.");
      }
    },
    [isAuthenticated, selectedItemId, showToast]
  );

  const handleOpenComposer = useCallback(
    (replyId?: string) => {
      if (!isAuthenticated) {
        showToast("Zaloguj się, aby dodać komentarz.");
        return;
      }
      if (replyId) {
        setReplyTo(replyId);
      } else {
        setReplyTo(null);
      }
      setShowComposer(true);
      requestAnimationFrame(() => {
        commentInputRef.current?.focus();
        commentInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    },
    [isAuthenticated, showToast]
  );

  const handleAddComment = useCallback(async () => {
    const sanitized = commentDraft.replace(/[\r\n]+/g, " ").trim();
    if (!selectedItemId || !sanitized) return;
    if (!isAuthenticated) {
      showToast("Zaloguj się, aby dodać komentarz.");
      return;
    }

    setCommentSending(true);
    setCommentsError(null);

      try {
      const res = await fetch(
        `/api/galeria/items/${selectedItemId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: sanitized,
            parentId: replyTo,
          }),
        }
      );

      if (res.status === 401) {
        showToast("Zaloguj się, aby dodać komentarz.");
        return;
      }
      if (!res.ok) {
        throw new Error("FAILED_TO_CREATE");
      }

      const data = await res.json();
      if (!data?.comment) {
        throw new Error("INVALID_PAYLOAD");
      }

      const newComment: Comment = {
        id: data.comment.id,
        user: data.comment.author?.name ?? "Gość",
        avatar: data.comment.author?.avatar ?? FALLBACK_AVATAR,
        text: data.comment.content,
        likes: data.comment.likes ?? 0,
        liked: data.comment.liked ?? false,
        time: formatRelativeTime(data.comment.createdAt),
        createdAt: data.comment.createdAt,
      };

      setComments((prev) => insertComment(prev, newComment, replyTo));
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemId
            ? { ...item, comments: item.comments + 1 }
            : item
        )
      );
      setCommentDraft("");
      setReplyTo(null);
      setShowComposer(true);
      requestAnimationFrame(() => {
        commentInputRef.current?.focus();
      });
    } catch {
      setCommentsError("Nie udało się dodać komentarza.");
    } finally {
      setCommentSending(false);
    }
  }, [commentDraft, isAuthenticated, replyTo, selectedItemId, showToast]);

  const handleLikeComment = useCallback(
    async (commentId: string) => {
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
        const res = await fetch(
          `/api/galeria/comments/${commentId}/like`,
          { method: "POST" }
        );
        if (res.status === 401) {
          if (hasPrevious) {
            setComments((prev) =>
              updateCommentLike(prev, commentId, previous.liked, previous.likes)
            );
          }
          showToast("Zaloguj się, aby polubić komentarz.");
          return;
        }
        if (!res.ok) {
          throw new Error("FAILED_TO_TOGGLE");
        }
        const data = await res.json();
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

  const getShareUrl = useCallback((itemId: string) => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("zdjecie", itemId);
    return url.toString();
  }, []);

  const openShareMenu = useCallback(
    (item: GalleryItemWithMeta) => {
      const shareUrl = getShareUrl(item.id);
      setShareMenuUrl(shareUrl);
      setShareMenuOpen((prev) => !prev);
      setReportMenu(null);
    },
    [getShareUrl]
  );

  const handleShareAction = useCallback(
    async (
      item: GalleryItemWithMeta,
      action: "copy" | "open" | "system"
    ) => {
      const shareUrl = shareMenuUrl || getShareUrl(item.id);
      if (!shareUrl) return;

      try {
        if (action === "system") {
          if (navigator?.share) {
            await navigator.share({ title: item.title, url: shareUrl });
          }
        } else if (action === "open") {
          window.open(shareUrl, "_blank", "noopener,noreferrer");
        } else {
          await navigator?.clipboard?.writeText(shareUrl);
          showToast("Link do zdjęcia skopiowany.");
        }
      } catch {
        showToast("Nie udało się udostępnić linku.");
      } finally {
        setShareMenuOpen(false);
      }
    },
    [getShareUrl, shareMenuUrl, showToast]
  );

  const toggleReportMenu = useCallback(
    (
      targetType: "gallery-item" | "gallery-comment",
      targetId: string,
      anchor: { x: number; y: number }
    ) => {
      setShareMenuOpen(false);
      setReportMenu((prev) => {
        if (
          prev &&
          prev.targetType === targetType &&
          prev.targetId === targetId
        ) {
          return null;
        }
        return { targetType, targetId, anchor };
      });
    },
    []
  );

  const handleReport = useCallback(
    async (
      targetType: "gallery-item" | "gallery-comment",
      targetId: string,
      reason: string
    ) => {
      try {
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:
              targetType === "gallery-item"
                ? "Zgłoszenie galerii"
                : "Zgłoszenie komentarza",
            reason,
            targetType,
            targetId,
          }),
        });
        if (!res.ok) {
          throw new Error("FAILED_TO_REPORT");
        }
        showToast("Dziękujemy! Zgłoszenie zostało wysłane do administracji!");
        return true;
      } catch {
        showToast("Nie udało się wysłać zgłoszenia.");
        return false;
      }
    },
    [showToast]
  );

  const handleReportOption = useCallback(
    async (
      targetType: "gallery-item" | "gallery-comment",
      targetId: string,
      reason: string
    ) => {
      setReportMenu(null);
      const ok = await handleReport(targetType, targetId, reason);
      if (!ok) return;
      if (targetType === "gallery-item") {
        setSelectedItemId(null);
        return;
      }
      if (targetType === "gallery-comment") {
        setReportedCommentIds((prev) => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
        setRevealedReportedCommentIds((prev) => {
          if (!prev.has(targetId)) return prev;
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
    },
    [handleReport]
  );

  const handleRevealReportedComment = useCallback((commentId: string) => {
    setRevealedReportedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  const renderReportMenu = useCallback(
    (
      targetType: "gallery-item" | "gallery-comment",
      targetId: string,
      anchor: { x: number; y: number }
    ) => (
      <div
        className="fixed z-[90] w-64 rounded-2xl border border-white/10 bg-background-3/95 p-2 shadow-2xl backdrop-blur"
        style={{
          top: anchor.y + 8,
          left: anchor.x,
          transform: "translateX(-100%)",
        }}
      >
        <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.18em] text-foreground-2">
          Zgłoś treść
        </p>
        <div className="space-y-1">
          {REPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-white/5"
              onClick={() =>
                handleReportOption(targetType, targetId, option.id)
              }
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-foreground-2">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    ),
    [handleReportOption]
  );

  const selectedIndex = selectedItem
    ? items.findIndex((it) => it.id === selectedItem.id)
    : -1;

  const goNext = () => {
    if (!items.length) return;
    if (selectedIndex === -1) {
      setSelectedItemId(items[0].id);
      return;
    }
    const next = (selectedIndex + 1) % items.length;
    setSelectedItemId(items[next].id);
  };

  const goPrev = () => {
    if (!items.length) return;
    if (selectedIndex === -1) {
      setSelectedItemId(items[0].id);
      return;
    }
    const prev = (selectedIndex - 1 + items.length) % items.length;
    setSelectedItemId(items[prev].id);
  };

  const authorProfile = useMemo(() => {
    if (!selectedAuthor) return null;
    const likes = items.reduce((acc, item) => acc + item.likes, 0);
    return { count: items.length, likes };
  }, [items, selectedAuthor]);

  const stats = useMemo(() => {
    const totalComments = items.reduce((acc, item) => acc + item.comments, 0);
    const totalLikes = items.reduce((acc, item) => acc + item.likes, 0);
    return { totalComments, totalLikes, totalItems: items.length };
  }, [items]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-[180px] pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {!selectedAuthor && (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(0,206,0,0.18),transparent_35%)]" />
              <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_80%_10%,rgba(0,206,0,0.12),transparent_35%)]" />
              <div className="relative px-6 md:px-10 py-10 space-y-6">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground-2">
                  <span className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                    Galeria
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/10 bg-background-4 text-foreground-2">
                    Buduj historię z RybiąPaką
                  </span>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      Uchwyć najlepsze ujęcia i pokaż je społeczności
                    </h1>
                    <p className="text-base md:text-lg text-foreground-2">
                      Te same akcenty i vibe co w dyskusjach - filtry, kategorie
                      i szybkie interakcje. Dodaj zdjęcie lub przefiltruj łowy
                      innych.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          if (!authReady) {
                            return;
                          }
                          if (!isAuthenticated) {
                            showToast("Zaloguj się, aby dodać zdjęcie.");
                            return;
                          }
                          setIsCreateModalOpen(true);
                        }}
                        disabled={!authReady || !isAuthenticated}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold shadow-lg shadow-accent/20 hover:bg-accent-2 transition-colors interactive-press disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus size={18} />
                        Dodaj zdjęcie
                      </button>
                      {authReady && !isAuthenticated && (
                        <Link
                          href="/logowanie"
                          className="self-center text-xs text-foreground-2 underline decoration-white/20 underline-offset-4 hover:text-accent hover:decoration-accent/60"
                        >
                          Zaloguj się, aby dodać zdjęcie.
                        </Link>
                      )}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-foreground-2 bg-white/5">
                        <Fish size={16} className="text-accent" />
                        <span>Najlepsze ujęcia</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 min-w-[260px] text-sm">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner stat-card">
                      <p className="text-foreground-2 text-xs uppercase tracking-wide">
                        Zdjęcia
                      </p>
                      <p className="text-3xl font-semibold text-foreground">
                        {stats.totalItems}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner stat-card">
                      <p className="text-foreground-2 text-xs uppercase tracking-wide">
                        Polubienia
                      </p>
                      <p className="text-3xl font-semibold text-foreground">
                        {stats.totalLikes}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner stat-card">
                      <p className="text-foreground-2 text-xs uppercase tracking-wide">
                        Komentarze
                      </p>
                      <p className="text-3xl font-semibold text-foreground">
                        {stats.totalComments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedAuthor && (
            <div className="rounded-2xl border border-white/10 bg-background-3/80 p-4 md:p-5 backdrop-blur">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full sm:w-auto overflow-hidden">
                  <CategoryBar
                    categories={CATEGORY_NAMES}
                    selectedCategory={selectedCategory}
                    onSelectCategory={(cat) => {
                      setSelectedAuthor(null);
                      setSelectedCategory(cat);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedAuthor && (
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3 via-background-2 to-background-3 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,rgba(0,206,0,0.22),transparent_40%),radial-gradient(circle_at_85%_5%,rgba(0,206,0,0.18),transparent_40%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-background-4/80 text-2xl font-semibold text-foreground shadow-[0_0_0_1px_rgba(0,206,0,0.2)] overflow-hidden">
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-transparent" />
                    {authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorAvatar}
                        alt={authorDisplayName || "Avatar"}
                        loading="lazy"
                        decoding="async"
                        className="relative h-full w-full object-cover"
                        onError={(event) =>
                          handleUploadImageError(
                            event.currentTarget,
                            "/artwork/404_user.png"
                          )
                        }
                      />
                    ) : (
                      <span className="relative">
                        {authorDisplayName.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-foreground-2">
                      <span className="rounded-full border border-white/10 bg-background-4/70 px-3 py-1">
                        Profil autora
                      </span>
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
                        Galeria
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {authorInfo?.username
                          ? `@${authorInfo.username}`
                          : authorDisplayName}
                      </h2>
                      {authorInfo?.rank && <RankBadge rank={authorInfo.rank} />}
                    </div>
                    <div className="space-y-1 text-xs text-foreground-2">
                      {authorInfoLoading && <p>Ładuję dane profilu...</p>}
                      {!authorInfoLoading && authorInfoError && (
                        <p className="text-red-400">{authorInfoError}</p>
                      )}
                      {!authorInfoLoading && !authorInfoError && authorMeta && (
                        <p>{authorMeta}</p>
                      )}
                      {!authorInfoLoading &&
                        !authorInfoError &&
                        authorInfo?.bio && (
                          <p className="max-w-[360px]">{authorInfo.bio}</p>
                        )}
                    </div>
                    <Link
                      href={`/galeria?autor=${encodeURIComponent(authorDisplayName || selectedAuthor)}`}
                      className="text-xs uppercase tracking-[0.16em] text-foreground-2 hover:text-accent"
                    >
                      galeria?autor={authorDisplayName || selectedAuthor || ""}
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {authorProfile && (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-background-4/70 px-4 py-3 text-sm shadow-inner">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-2">
                          Zdjęć
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {authorProfile.count}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-background-4/70 px-4 py-3 text-sm shadow-inner">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-2">
                          Polubień
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {authorProfile.likes}
                        </p>
                      </div>
                    </>
                  )}
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                    Tryb portfolio
                  </span>
                  <button
                    className="rounded-full border border-white/15 bg-background-4/60 px-4 py-2 text-xs text-foreground transition hover:border-accent/50 hover:text-accent"
                    onClick={() => setSelectedAuthor(null)}
                  >
                    Wróć do wszystkich
                  </button>
                </div>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2 text-[11px] text-foreground-2">
                <span className="rounded-full border border-white/10 bg-background-4/70 px-3 py-1">
                  Sortowanie: najnowsze
                </span>
                <span className="rounded-full border border-white/10 bg-background-4/70 px-3 py-1">
                  Widok: siatka
                </span>
                <span className="rounded-full border border-white/10 bg-background-4/70 px-3 py-1">
                  Filtr: {selectedCategory}
                </span>
              </div>
            </section>
          )}

          {isLoading && !hasItems && (
            <div className="flex items-center justify-center py-20">
              <div
                className="h-12 w-12 rounded-full border-2 border-white/15 border-t-accent animate-spin"
                role="status"
                aria-label="Ładuję galerię"
              />
            </div>
          )}

          {!hasItems && loadError && (
            <div className="text-center py-14 rounded-2xl border border-white/10 bg-background-3/60 text-foreground-2 space-y-3">
              <p>{loadError}</p>
              <button
                onClick={loadItems}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-foreground hover:text-accent hover:border-accent/40 transition-colors interactive-press"
              >
                Odśwież galerię
              </button>
            </div>
          )}

          {hasItems && (
            <div className="relative">
              {isRefreshing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-background-3/90 px-4 py-2 text-xs text-foreground-2 shadow-lg">
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-accent animate-spin" />
                    Ładuję galerię...
                  </div>
                </div>
              )}
              {loadError && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-background-3/70 px-4 py-3 text-sm text-foreground-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{loadError}</span>
                    <button
                      onClick={loadItems}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-foreground transition-colors hover:text-accent hover:border-accent/40"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                </div>
              )}
              <div
                className={`transition-opacity ${
                  isRefreshing ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <GalleryGrid
                  items={items}
                  onSelectItem={(item) => setSelectedItemId(item.id)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <CreateGalleryModal
        isOpen={isCreateModalOpen}
        isAuthenticated={isAuthenticated}
        authReady={authReady}
        categories={CREATE_CATEGORIES}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateItem}
      />

      <EditGalleryModal
        isOpen={isEditModalOpen}
        item={editingItem}
        categories={CREATE_CATEGORIES}
        onClose={closeEditModal}
        onSubmit={handleUpdateItem}
      />

      {selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-hidden">
          {fishTrail.map((fish, idx) => (
            <span
              key={idx}
              className="fish-animation absolute left-[-18%] text-accent opacity-40"
              style={{
                top: fish.top,
                animationDuration: fish.duration,
                animationDelay: fish.delay,
              }}
            >
              <Fish size={28} />
            </span>
          ))}

          <div className="relative z-10 flex h-[90vh] w-[95%] max-w-6xl flex-col gap-4 overflow-hidden rounded-3xl border border-background-4 bg-background shadow-2xl lg:h-auto lg:flex-row lg:gap-6">
            <div className="relative flex w-full flex-[2] min-h-0 items-center justify-center bg-background-2 lg:flex-1 lg:max-h-[80vh]">
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background-3/80 p-2 text-foreground transition hover:text-accent"
                aria-label="Poprzednie"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background-3/80 p-2 text-foreground transition hover:text-accent"
                aria-label="Następne"
              >
                <ChevronRight size={22} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  typeof selectedItem.imageUrl === "string"
                    ? selectedItem.imageUrl
                    : selectedItem.imageUrl.src
                }
                alt={selectedItem.title}
                loading="lazy"
                decoding="async"
                className="max-h-full w-full object-contain"
                onError={(event) =>
                  handleUploadImageError(
                    event.currentTarget,
                    "/artwork/404_post.png"
                  )
                }
              />
            </div>

            <aside className="w-full flex-1 min-h-0 bg-background-3 border-t border-background-4 flex flex-col lg:max-w-[400px] lg:border-l lg:border-t-0 lg:max-h-[80vh] lg:pr-4">
              <div className="p-4 border-b border-background-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      typeof selectedItem.authorAvatar === "string"
                        ? selectedItem.authorAvatar
                        : selectedItem.authorAvatar.src
                    }
                    alt={selectedItem.author}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-10 rounded-full object-cover border border-background-4"
                    onError={(event) =>
                      handleUploadImageError(
                        event.currentTarget,
                        "/artwork/404_user.png"
                      )
                    }
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setSelectedAuthor(selectedItem.author);
                        setSelectedItemId(null);
                      }}
                      className="text-sm font-semibold text-foreground hover:text-accent text-left"
                    >
                      {selectedItem.author}
                    </button>
                    <Link
                      href={`/galeria?autor=${encodeURIComponent(selectedItem.author)}`}
                      onClick={() => {
                        setSelectedAuthor(selectedItem.author);
                        setSelectedItemId(null);
                      }}
                      className="text-xs text-foreground-2 hover:text-accent"
                    >
                      Zobacz profil galerii
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItem.canEdit && (
                    <button
                      onClick={() => openEditModal(selectedItem)}
                      className="rounded-full border border-background-4 bg-background-3/80 p-2 text-foreground transition hover:border-accent hover:text-accent"
                      aria-label="Edytuj zdjęcie"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {selectedItem.canDelete && (
                    <button
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      className="rounded-full border border-background-4 bg-background-3/80 p-2 text-foreground transition hover:border-accent hover:text-accent"
                      aria-label="Usuń zdjęcie"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="rounded-full border border-background-4 bg-background-3/80 p-2 text-foreground transition hover:border-accent hover:text-accent"
                    aria-label="Zamknij"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-5 space-y-3 border-b border-background-4">
                <p className="text-sm text-foreground leading-relaxed break-words">
                  {selectedItem.description}
                </p>
                {selectedItem.createdAt && (
                  <p className="text-xs text-foreground-2">
                    {formatAddedAt(selectedItem.createdAt)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-background-4">
                <button
                  onClick={() => handleToggleLike(selectedItem.id)}
                  disabled={!authReady || !isAuthenticated}
                  className={
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition " +
                    (selectedItem.liked
                      ? "border-accent text-accent"
                      : "border-background-4 text-foreground") +
                    (!authReady || !isAuthenticated
                      ? " cursor-not-allowed opacity-60"
                      : "")
                  }
                >
                  <Heart
                    size={16}
                    fill={selectedItem.liked ? "currentColor" : "none"}
                  />
                  <span>{selectedItem.likes}</span>
                </button>
                <button
                  className="flex items-center gap-2 rounded-full border border-background-4 px-3 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => handleOpenComposer()}
                  disabled={!authReady || !isAuthenticated}
                >
                  <MessageCircle size={16} />
                  <span>Komentuj</span>
                </button>
                <div className="relative">
                  <button
                    className="flex items-center gap-2 rounded-full border border-background-4 px-3 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent"
                    onClick={() => openShareMenu(selectedItem)}
                  >
                    <Share2 size={16} />
                    <span>Udostępnij</span>
                  </button>
                  {shareMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-background-2/95 p-3 shadow-xl z-20">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-2">
                        Udostępnianie
                      </p>
                      <div className="mt-2 rounded-xl border border-background-4 bg-background px-3 py-2 text-xs text-foreground-2">
                        <span className="block truncate">
                          {shareMenuUrl || getShareUrl(selectedItem.id)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button
                          onClick={() =>
                            handleShareAction(selectedItem, "copy")
                          }
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-background-3/70 px-3 py-2 text-sm text-foreground transition hover:border-accent/40 hover:bg-background-3"
                        >
                          <Copy size={16} />
                          Skopiuj link
                        </button>
                        <button
                          onClick={() =>
                            handleShareAction(selectedItem, "open")
                          }
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-background-3/70 px-3 py-2 text-sm text-foreground transition hover:border-accent/40 hover:bg-background-3"
                        >
                          <ExternalLink size={16} />
                          Otwórz w nowej karcie
                        </button>
                        {canSystemShare && (
                          <button
                            onClick={() =>
                              handleShareAction(selectedItem, "system")
                            }
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-background-3/70 px-3 py-2 text-sm text-foreground transition hover:border-accent/40 hover:bg-background-3"
                          >
                            <Share2 size={16} />
                            Udostępnij systemowo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    className="flex items-center gap-2 rounded-full border border-background-4 px-3 py-2 text-sm text-foreground transition hover:border-accent hover:text-accent"
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      toggleReportMenu("gallery-item", selectedItem.id, {
                        x: rect.right,
                        y: rect.bottom,
                      });
                    }}
                  >
                    <Flag size={16} />
                    <span>Zgłoś</span>
                  </button>
                  {reportMenu?.targetType === "gallery-item" &&
                    reportMenu.targetId === selectedItem.id &&
                    renderReportMenu("gallery-item", selectedItem.id, reportMenu.anchor)}
                </div>
                {authReady && !isAuthenticated && (
                  <Link
                    href="/logowanie"
                    className="text-xs text-foreground-2 underline decoration-white/20 underline-offset-4 hover:text-accent hover:decoration-accent/60"
                  >
                    Zaloguj się, aby reagować.
                  </Link>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Komentarze</p>
                  <p className="text-xs text-foreground-2">
                    Polub, odpowiedz lub zgłoś nadużycie.
                  </p>
                </div>

                {commentsLoading && (
                  <div className="text-sm text-foreground-2">
                    Ładuję komentarze...
                  </div>
                )}

                {!commentsLoading &&
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="space-y-3 rounded-2xl border border-background-4 bg-background-2/60 p-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={comment.avatar}
                          alt={comment.user}
                          loading="lazy"
                          decoding="async"
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(event) =>
                            handleUploadImageError(
                              event.currentTarget,
                              "/artwork/404_user.png"
                            )
                          }
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-accent">
                              {comment.user}
                            </span>
                            <span className="text-xs text-foreground-2">
                              {comment.time}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <p
                              className={`flex-1 text-sm text-foreground break-words ${
                                reportedCommentIds.has(comment.id) &&
                                !revealedReportedCommentIds.has(comment.id)
                                  ? "blur-sm select-none"
                                  : ""
                              }`}
                            >
                              {comment.text}
                            </p>
                            {reportedCommentIds.has(comment.id) && (
                              <button
                                type="button"
                                className="mt-0.5 text-foreground-2 hover:text-accent transition"
                                onClick={() =>
                                  handleRevealReportedComment(comment.id)
                                }
                                aria-label="Pokaż komentarz"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-foreground-2">
                            <button
                              className={`flex items-center gap-1 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                                comment.liked ? "text-accent" : ""
                              }`}
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={!authReady || !isAuthenticated}
                            >
                              <Heart
                                size={14}
                                fill={comment.liked ? "currentColor" : "none"}
                              />
                              <span>{comment.likes}</span>
                            </button>
                            <button
                              className="hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => handleOpenComposer(comment.id)}
                              disabled={!authReady || !isAuthenticated}
                            >
                              Odpowiedz
                            </button>
                            {comment.canDelete && (
                              <button
                                className="flex items-center gap-1 text-foreground-2 hover:text-red-300 transition"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 size={14} />
                                Usuń
                              </button>
                            )}
                            <div className="relative">
                              <button
                                className="hover:text-accent"
                                onClick={(event) => {
                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  toggleReportMenu(
                                    "gallery-comment",
                                    comment.id,
                                    {
                                      x: rect.right,
                                      y: rect.bottom,
                                    }
                                  );
                                }}
                              >
                                Zgłoś
                              </button>
                              {reportMenu?.targetType === "gallery-comment" &&
                                reportMenu.targetId === comment.id &&
                                renderReportMenu(
                                  "gallery-comment",
                                  comment.id,
                                  reportMenu.anchor
                                )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-10 space-y-2">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex items-start gap-3 rounded-xl border border-background-4/70 bg-background-3/50 p-3"
                            >
                              <img
                                src={reply.avatar}
                                alt={reply.user}
                                loading="lazy"
                                decoding="async"
                                className="h-7 w-7 rounded-full object-cover"
                                onError={(event) =>
                                  handleUploadImageError(
                                    event.currentTarget,
                                    "/artwork/404_user.png"
                                  )
                                }
                              />
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-accent">
                                    {reply.user}
                                  </span>
                                  <span className="text-xs text-foreground-2">
                                    {reply.time}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <p
                                    className={`flex-1 text-sm text-foreground break-words ${
                                      reportedCommentIds.has(reply.id) &&
                                      !revealedReportedCommentIds.has(reply.id)
                                        ? "blur-sm select-none"
                                        : ""
                                    }`}
                                  >
                                    {reply.text}
                                  </p>
                                  {reportedCommentIds.has(reply.id) && (
                                    <button
                                      type="button"
                                      className="mt-0.5 text-foreground-2 hover:text-accent transition"
                                      onClick={() =>
                                        handleRevealReportedComment(reply.id)
                                      }
                                      aria-label="Pokaż komentarz"
                                    >
                                      <Eye size={16} />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-foreground-2">
                                  <button
                                    className={`flex items-center gap-1 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                                      reply.liked ? "text-accent" : ""
                                    }`}
                                    onClick={() => handleLikeComment(reply.id)}
                                    disabled={!authReady || !isAuthenticated}
                                  >
                                    <Heart
                                      size={14}
                                      fill={
                                        reply.liked ? "currentColor" : "none"
                                      }
                                    />
                                    <span>{reply.likes}</span>
                                  </button>
                                  <button
                                    className="hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={() => handleOpenComposer(reply.id)}
                                    disabled={!authReady || !isAuthenticated}
                                  >
                                    Odpowiedz
                                  </button>
                                  {reply.canDelete && (
                                    <button
                                      className="flex items-center gap-1 text-foreground-2 hover:text-red-300 transition"
                                      onClick={() => handleDeleteComment(reply.id)}
                                    >
                                      <Trash2 size={14} />
                                      Usuń
                                    </button>
                                  )}
                                  <div className="relative">
                                    <button
                                      className="hover:text-accent"
                                      onClick={(event) => {
                                        const rect =
                                          event.currentTarget.getBoundingClientRect();
                                        toggleReportMenu(
                                          "gallery-comment",
                                          reply.id,
                                          {
                                            x: rect.right,
                                            y: rect.bottom,
                                          }
                                        );
                                      }}
                                    >
                                      Zgłoś
                                    </button>
                                    {reportMenu?.targetType ===
                                      "gallery-comment" &&
                                      reportMenu.targetId === reply.id &&
                                      renderReportMenu(
                                        "gallery-comment",
                                        reply.id,
                                        reportMenu.anchor
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {!commentsLoading &&
                  !commentsError &&
                  comments.length === 0 && (
                    <div className="text-sm text-foreground-2">
                      Nie ma tu jeszcze komentarzy.
                    </div>
                  )}

                {commentsError && (
                  <div className="text-sm text-red-400">
                    <p>{commentsError}</p>
                    {selectedItemId && (
                      <button
                        type="button"
                        onClick={() => loadComments(selectedItemId)}
                        className="mt-2 inline-flex text-xs text-foreground-2 underline decoration-white/20 underline-offset-4 transition hover:text-accent hover:decoration-accent/60"
                      >
                        Spróbuj ponownie
                      </button>
                    )}
                  </div>
                )}

                {showComposer && (
                  <div className="space-y-2 pt-2">
                    {replyTo && (
                      <div className="flex items-center justify-between text-xs text-foreground-2 rounded-lg bg-background-3 px-3 py-2">
                        <span>
                          Odpowiadasz do{" "}
                          <span className="font-semibold text-accent">
                            @{replyTarget?.user ?? "użytkownika"}
                          </span>
                        </span>
                        <button
                          className="text-accent"
                          onClick={() => setReplyTo(null)}
                        >
                          Anuluj
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={commentInputRef}
                      value={commentDraft}
                      onChange={(e) =>
                        setCommentDraft(e.target.value.replace(/[\r\n]+/g, " "))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          if (!commentSending && commentDraft.trim()) {
                            handleAddComment();
                          }
                        }
                      }}
                      placeholder="Dodaj komentarz..."
                      className="w-full rounded-xl border border-background-4 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60 resize-none"
                      rows={3}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {authReady && !isAuthenticated && (
                        <Link
                          href="/logowanie"
                          className="text-xs text-foreground-2 underline decoration-white/20 underline-offset-4 hover:text-accent hover:decoration-accent/60"
                        >
                          Zaloguj się, aby dodać komentarz.
                        </Link>
                      )}
                      <button
                        onClick={handleAddComment}
                        disabled={
                          commentSending ||
                          !commentDraft.trim() ||
                          !authReady ||
                          !isAuthenticated
                        }
                        className="ml-auto rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-2 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {commentSending ? "Wysyłanie..." : "Wyślij"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[120] px-4 py-2 rounded-xl bg-background-4/90 border border-white/10 shadow-2xl text-sm text-foreground animate-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center text-sm text-foreground-2">
          Ładowanie galerii...
        </div>
      }
    >
      <GalleryPageInner />
    </Suspense>
  );
}















