"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import NotFound from "@/app/not-found";
import { CHANNELS } from "@/const/channels";
import { onAuthEvent } from "@/lib/authEvents";
import { readAuthHint, writeAuthHint } from "@/lib/authState";
import { emitMissionEvent } from "@/lib/missionEvents";

import ChatComposer from "./components/ChatComposer";
import ChatHeader from "./components/ChatHeader";
import ChatMessageList from "./components/ChatMessageList";
import type { ChannelMessage, CustomEmoji } from "./types";
import { useSearchParams } from "next/navigation";

const channelSummaries: Record<string, string> = {
  spinning: "Agresywne brania, szybkie zwijanie i testy przynęt drapieżnych.",
  karpiowanie: "Długie zasiadki, taktyka nęcenia i patenty na wielkie karpie.",
  feeder: "Mieszanki zanęt, delikatne sygnały i skuteczne zestawy feederowe.",
  metoda: "Method feeder od A do Z: koszyki, pelety i precyzyjne podania.",
  splawik: "Klasyka spławika: ustawienie gruntu, przynęty i prowadzenie.",
  muchowe: "Muchy, przypony i polowania na ostrożne ryby w klarownej wodzie.",
  podlodowe: "Bezpieczny lód, wędki podlodowe i zimowe miejscówki.",
  morskie: "Słona woda, pilkery, dorsze i wyprawy na pełne morze.",
  memy: "Rybackie żarty, memy i luźne rozmowy o wodzie.",
  gry: "Gry wędkarskie, nowości, patche i wspólne wypady online.",
  administracja: "Tylko administracja: moderacja i decyzje.",
};

const CUSTOM_EMOJI_FILES = [
  "$$$.png",
  "69.png",
  "Agent.png",
  "Agresywny.png",
  "Amur.png",
  "Brak Głosu.png",
  "Bruh.png",
  "Dobrze.png",
  "Drama Alert.png",
  "Dziewczynka.png",
  "Garbusek.png",
  "Gorąco.png",
  "Głodny.png",
  "Hipnoza.png",
  "Karp.png",
  "Klaun.png",
  "Kochający.png",
  "Krab.png",
  "Krewetka.png",
  "Król.png",
  "Kupka.png",
  "Leszcz.png",
  "LGBT.png",
  "Lin.png",
  "Mistrz.png",
  "Muszkieter.png",
  "Myślący.png",
  "Napad.png",
  "Niewyspany.png",
  "Okonek.png",
  "Pistolet.png",
  "Podbite oko.png",
  "Porażka.png",
  "Pęka ze śmiechu.png",
  "Płoć.png",
  "Sandacz.png",
  "Serduszko.png",
  "SIGMA.png",
  "Smutny.png",
  "Sum.png",
  "Szczupak.png",
  "Tołpyga.png",
  "Uśmiechnięty.png",
  "Wkurzony.png",
  "Wymiotujący.png",
  "Zachwycony.png",
  "Zadowolony.png",
  "Zaskoczenie.png",
  "Załamany.png",
  "Zdenerwowany.png",
  "Zestresowany.png",
  "Znudzony.png",
  "Śmiech.png",
  "Źle.png",
];

const humanizeEmojiName = (fileName: string) => {
  const base = fileName.replace(/\.[^/.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
};

const getLegacyEmojiId = (fileName: string) => {
  const base = fileName.replace(/\.[^/.]+$/, "");
  const parsed = Number(base);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const slugifyEmojiLabel = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const CUSTOM_EMOJIS: CustomEmoji[] = CUSTOM_EMOJI_FILES.map(
  (fileName, index) => {
    const label = humanizeEmojiName(fileName);
    const slug = slugifyEmojiLabel(label) || `emotka_${index + 1}`;
    return {
      id: index + 1,
      label,
      src: `/emojis/${encodeURIComponent(fileName)}`,
      code: `:${slug}:`,
      legacyId: getLegacyEmojiId(fileName),
    };
  }
);

const CUSTOM_EMOJI_BY_ID = new Map<number, CustomEmoji>(
  CUSTOM_EMOJIS.filter((emoji) => typeof emoji.legacyId === "number").map(
    (emoji) => [emoji.legacyId as number, emoji]
  )
);
const CUSTOM_EMOJI_BY_CODE = new Map<string, CustomEmoji>(
  CUSTOM_EMOJIS.map((emoji) => [emoji.code, emoji])
);

const FALLBACK_AVATAR = "/artwork/404_user.png";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get("kanal");

  const activeChannel = useMemo(
    () => CHANNELS.find((channel) => channel.id === channelId),
    [channelId]
  );

  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const oldestCreatedAtRef = useRef<string | null>(null);
  const isLoadingOlderRef = useRef(false);
  const initialAuthHint = readAuthHint();
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialAuthHint ?? false
  );
  const [authReady, setAuthReady] = useState(initialAuthHint === true);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [adminActionId, setAdminActionId] = useState<string | null>(null);
  const [revealedMessageIds, setRevealedMessageIds] = useState<
    Record<string, boolean>
  >({});

  const isAdminViewer = viewerRole === "ADMIN" || viewerRole === "OWNER";

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthEvent((event) => {
      if (event.type === "logout") {
        setIsAuthenticated(false);
        setAuthReady(true);
        setViewerRole(null);
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

  if (!activeChannel) {
    return <NotFound />;
  }

  const ChannelIcon = activeChannel.icon;
  const channelSummary =
    channelSummaries[activeChannel.id] ??
    "Rozmowy społeczności o wędkarstwie.";

  const formatTimestamp = useCallback((isoDate: string) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, []);

  const resolveEmojiFromMatch = useCallback(
    (idMatch?: string, codeMatch?: string) => {
      let emoji: CustomEmoji | undefined;

      if (idMatch) {
        const numericId = Number(idMatch);
        emoji = CUSTOM_EMOJI_BY_ID.get(numericId);
        if (
          !emoji &&
          Number.isFinite(numericId) &&
          numericId > 0 &&
          numericId <= CUSTOM_EMOJIS.length
        ) {
          emoji = CUSTOM_EMOJIS[numericId - 1];
        }
      } else if (codeMatch) {
        emoji = CUSTOM_EMOJI_BY_CODE.get(`:${codeMatch.toLowerCase()}:`);
      }

      return emoji;
    },
    []
  );

  const getEmojiOnlyCount = useCallback(
    (text: string) => {
      if (!text) return 0;

      const pattern = /:rp(\d+):|:([a-z0-9_]+):/gi;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let emojiCount = 0;
      let leftover = "";

      while ((match = pattern.exec(text)) !== null) {
        const start = match.index;
        if (start > lastIndex) {
          leftover += text.slice(lastIndex, start);
        }

        const emoji = resolveEmojiFromMatch(match[1], match[2]);
        if (emoji) {
          emojiCount += 1;
        } else {
          leftover += match[0];
        }

        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < text.length) {
        leftover += text.slice(lastIndex);
      }

      return leftover.replace(/\s+/g, "").length === 0 ? emojiCount : 0;
    },
    [resolveEmojiFromMatch]
  );

  const renderMessageText = useCallback(
    (text: string) => {
      if (!text) return null;

      const emojiOnlyCount = getEmojiOnlyCount(text);
      const singleEmojiOnly = emojiOnlyCount === 1;
      const emojiSize = singleEmojiOnly ? 40 : 20;
      const emojiWrapperClass = singleEmojiOnly
        ? "inline-flex h-10 w-10 align-text-bottom"
        : "inline-flex h-5 w-5 align-text-bottom";
      const emojiImageClass = singleEmojiOnly ? "h-10 w-10" : "h-5 w-5";

      const parts: ReactNode[] = [];
      const pattern = /:rp(\d+):|:([a-z0-9_]+):/gi;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        const start = match.index;
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }

        const emoji = resolveEmojiFromMatch(match[1], match[2]);
        if (emoji) {
          parts.push(
            <span key={`emoji-${start}`} className={emojiWrapperClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={emoji.src}
                alt={emoji.label}
                width={emojiSize}
                height={emojiSize}
                className={emojiImageClass}
              />
            </span>
          );
        } else {
          parts.push(match[0]);
        }

        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts;
    },
    [getEmojiOnlyCount, resolveEmojiFromMatch]
  );

  const serializeComposerNode = useCallback((node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    const emojiCode = element.dataset?.emojiCode;

    if (emojiCode) {
      return emojiCode;
    }

    if (element.tagName === "BR") {
      return "\n";
    }

    let value = "";
    element.childNodes.forEach((child) => {
      value += serializeComposerNode(child);
    });

    if (element.tagName === "DIV" || element.tagName === "P") {
      value += "\n";
    }

    return value;
  }, []);

  const readComposerValue = useCallback(() => {
    const composer = composerRef.current;
    if (!composer) return "";

    let value = "";
    composer.childNodes.forEach((child) => {
      value += serializeComposerNode(child);
    });

    return value.replace(/\u00a0/g, " ");
  }, [serializeComposerNode]);

  const updateMessageInputFromComposer = useCallback(() => {
    if (!isAuthenticated || accessDenied) return;
    setMessageInput(readComposerValue());
  }, [accessDenied, isAuthenticated, readComposerValue]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const insertEmoji = useCallback(
    (emoji: CustomEmoji) => {
      if (!isAuthenticated || accessDenied) return;
      const composer = composerRef.current;
      if (!composer) return;

      const selection = window.getSelection();
      if (!selection) return;

      if (
        selection.rangeCount === 0 ||
        !composer.contains(selection.anchorNode)
      ) {
        const range = document.createRange();
        range.selectNodeContents(composer);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const wrapper = document.createElement("span");
      wrapper.setAttribute("contenteditable", "false");
      wrapper.dataset.emojiCode = emoji.code;
      wrapper.className = "inline-flex h-5 w-5 align-text-bottom";

      const img = document.createElement("img");
      img.src = emoji.src;
      img.alt = emoji.label;
      img.width = 20;
      img.height = 20;
      img.className = "h-5 w-5";

      wrapper.appendChild(img);
      range.insertNode(wrapper);
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      selection.removeAllRanges();
      selection.addRange(range);

      composer.focus();
      updateMessageInputFromComposer();
      setEmojiOpen(false);
    },
    [accessDenied, isAuthenticated, updateMessageInputFromComposer]
  );

  useEffect(() => {
    if (!emojiOpen) return;

    const handleOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (emojiMenuRef.current?.contains(target)) return;
      if (emojiButtonRef.current?.contains(target)) return;
      setEmojiOpen(false);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [emojiOpen]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-admin-menu]")) return;
      if (target.closest("[data-admin-menu-button]")) return;
      setOpenMenuId(null);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!isAuthenticated || accessDenied) {
      setEmojiOpen(false);
    }
    if (!isAuthenticated || accessDenied || !isAdminViewer) {
      setOpenMenuId(null);
    }
  }, [accessDenied, isAuthenticated, isAdminViewer]);

  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      const res = await fetch(
        `/api/dyskusje/messages?kanal=${encodeURIComponent(activeChannel.id)}`,
        { cache: "no-store", credentials: "include" }
      );

      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthReady(true);
        setViewerRole(null);
        writeAuthHint(false);
        setMessages([]);
        setError("Zaloguj się, aby zobaczyć ten kanał.");
        return;
      }
      if (res.status === 403) {
        setAuthReady(true);
        setViewerRole(null);
        setMessages([]);
        setAccessDenied(true);
        setError("Brak dostępu do tego kanału.");
        return;
      }
      if (!res.ok) {
        setIsAuthenticated(false);
        setAuthReady(true);
        setViewerRole(null);
        writeAuthHint(false);
        setMessages([]);
        setError("Nie udało się pobrać wiadomości. Spróbuj ponownie.");
        return;
      }

      const data = await res.json();
      const authed = Boolean(data?.viewer?.authenticated);
      setIsAuthenticated(authed);
      setAuthReady(true);
      setViewerRole(data?.viewer?.role ?? null);
      writeAuthHint(authed);
      const normalized = Array.isArray(data?.messages)
        ? data.messages.map((msg: ChannelMessage) => ({
            ...msg,
            hiddenAt: msg.hiddenAt ?? null,
            author: {
              id: msg.author?.id ?? null,
              name: msg.author?.name ?? "Gość",
              avatar: msg.author?.avatar ?? null,
              role: msg.author?.role ?? null,
            },
          }))
        : [];
      setMessages(normalized);
      setHasOlder(Boolean(data?.hasOlder));
      oldestCreatedAtRef.current = normalized.length > 0 ? normalized[0].createdAt : null;
    } catch {
      setIsAuthenticated(false);
      setAuthReady(true);
      setViewerRole(null);
      writeAuthHint(false);
      setMessages([]);
      setError("Wystąpił błąd podczas ładowania wiadomości.");
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeChannel || isLoadingOlderRef.current || !hasOlder) return;
    const cursor = oldestCreatedAtRef.current;
    if (!cursor) return;

    isLoadingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const url = `/api/dyskusje/messages?kanal=${encodeURIComponent(activeChannel.id)}&before=${encodeURIComponent(cursor)}`;
      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();
      const older = Array.isArray(data?.messages)
        ? data.messages.map((msg: ChannelMessage) => ({
            ...msg,
            hiddenAt: msg.hiddenAt ?? null,
            author: {
              id: msg.author?.id ?? null,
              name: msg.author?.name ?? "Gość",
              avatar: msg.author?.avatar ?? null,
              role: msg.author?.role ?? null,
            },
          }))
        : [];

      if (older.length === 0) {
        setHasOlder(false);
        return;
      }

      const el = listRef.current;
      const prevScrollHeight = el ? el.scrollHeight : 0;

      setMessages((prev) => [...older, ...prev]);
      setHasOlder(Boolean(data?.hasOlder));
      oldestCreatedAtRef.current = older[0].createdAt;

      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
    } finally {
      setLoadingOlder(false);
      isLoadingOlderRef.current = false;
    }
  }, [activeChannel, hasOlder]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 80 && !isLoadingOlderRef.current && hasOlder) {
        void loadOlderMessages();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasOlder, loadOlderMessages]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, scrollToBottom]);

  const toggleRevealMessage = useCallback((messageId: string) => {
    setRevealedMessageIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const handleSend = useCallback(async () => {
    if (!activeChannel) return;
    if (accessDenied) {
      setError("Brak dostępu do tego kanału.");
      return;
    }
    if (!isAuthenticated) {
      setError("Zaloguj się, aby napisać wiadomość.");
      return;
    }

    const draft = readComposerValue();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/dyskusje/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kanal: activeChannel.id,
          text,
        }),
      });

      if (res.status === 401) {
        setError("Zaloguj się, aby napisać wiadomość.");
        return;
      }

      if (res.status === 403) {
        setAccessDenied(true);
        setError("Brak dostępu do tego kanału.");
        return;
      }

      if (!res.ok) {
        setError("Nie udało się wysłać wiadomości. Spróbuj ponownie.");
        return;
      }

      const data = await res.json();
      if (data?.message) {
        const normalized = {
          ...data.message,
          hiddenAt: data.message.hiddenAt ?? null,
          author: {
            id: data.message.author?.id ?? null,
            name: data.message.author?.name ?? "Gość",
            avatar: data.message.author?.avatar ?? null,
            role: data.message.author?.role ?? null,
          },
        } as ChannelMessage;

        setMessages((prev) => [...prev, normalized]);
        setMessageInput("");
        if (composerRef.current) {
          composerRef.current.innerHTML = "";
        }
        emitMissionEvent("discussion");
      }
    } catch {
      setError("Wystąpił błąd podczas wysyłania wiadomości.");
    } finally {
      setSending(false);
    }
  }, [accessDenied, activeChannel, isAuthenticated, readComposerValue, sending]);

  const handleHideMessage = useCallback(
    async (message: ChannelMessage, shouldHide: boolean) => {
      if (!isAdminViewer || adminActionId) return;
      setAdminActionId(message.id);
      setError(null);

      try {
        const res = await fetch(`/api/dyskusje/messages/${message.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: shouldHide ? "hide" : "unhide" }),
        });

        if (res.status === 401) {
          setError("Zaloguj się, aby zarządzać wiadomościami.");
          return;
        }
        if (res.status === 403) {
          setError("Brak uprawnień do moderacji.");
          return;
        }
        if (!res.ok) {
          setError("Nie udało się zmienić widoczności wiadomości.");
          return;
        }

        const data = await res.json();
        const nextHiddenAt =
          typeof data?.message?.hiddenAt === "string"
            ? data.message.hiddenAt
            : null;

        setMessages((prev) =>
          prev.map((item) =>
            item.id === message.id
              ? { ...item, hiddenAt: nextHiddenAt }
              : item
          )
        );
        if (!nextHiddenAt) {
          setRevealedMessageIds((prev) => {
            if (!prev[message.id]) return prev;
            const next = { ...prev };
            delete next[message.id];
            return next;
          });
        }
        setOpenMenuId(null);
      } catch {
        setError("Wystąpił błąd podczas zmiany widoczności wiadomości.");
      } finally {
        setAdminActionId(null);
      }
    },
    [adminActionId, isAdminViewer]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!isAdminViewer || adminActionId) return;
      setAdminActionId(messageId);
      setError(null);

      try {
        const res = await fetch(`/api/dyskusje/messages/${messageId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (res.status === 401) {
          setError("Zaloguj się, aby zarządzać wiadomościami.");
          return;
        }
        if (res.status === 403) {
          setError("Brak uprawnień do moderacji.");
          return;
        }
        if (!res.ok) {
          setError("Nie udało się usunąć wiadomości.");
          return;
        }

        setMessages((prev) => prev.filter((item) => item.id !== messageId));
        setRevealedMessageIds((prev) => {
          if (!prev[messageId]) return prev;
          const next = { ...prev };
          delete next[messageId];
          return next;
        });
        setOpenMenuId(null);
      } catch {
        setError("Wystąpił błąd podczas usuwania wiadomości.");
      } finally {
        setAdminActionId(null);
      }
    },
    [adminActionId, isAdminViewer]
  );

  const handleComposerKey = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isAuthenticated || accessDenied) return;
      if (event.key === "Enter") {
        event.preventDefault();
        if (!event.shiftKey) {
          handleSend();
        }
      }
    },
    [accessDenied, handleSend, isAuthenticated]
  );

  const handleComposerInput = useCallback(() => {
    updateMessageInputFromComposer();
  }, [updateMessageInputFromComposer]);

  const placeholderText = accessDenied
    ? "Brak dostępu do tego kanału."
    : authReady
      ? isAuthenticated
        ? "Napisz wiadomość..."
        : "Zaloguj się, aby napisać wiadomość."
      : "Ładuję...";
  return (
    <div className="relative flex h-screen w-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-80px] top-[-40px] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,206,0,0.2),transparent_55%)] blur-3xl" />
        <div className="absolute right-[-40px] top-[20%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,133,0,0.25),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(0,206,0,0.12),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative flex h-full w-full flex-1 min-h-0 flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dyskusje"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-background-3 px-4 py-2 text-sm text-foreground transition hover:border-accent/60 hover:bg-background-4"
          >
            <ArrowLeft
              size={16}
              className="text-foreground-2 group-hover:text-accent"
            />
            <span className="font-medium">Wróć do dyskusji</span>
          </Link>
        </div>

        <div className="flex-1 min-h-0">
          <section className="relative flex h-full flex-1 min-h-0 flex-col rounded-3xl border border-white/10 bg-background-3/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_10%,rgba(0,206,0,0.08),transparent_35%)]" />
            <div className="relative flex h-full min-h-0 flex-col">
              <ChatHeader
                name={activeChannel.name}
                accent={activeChannel.accent}
                summary={channelSummary}
                Icon={ChannelIcon}
              />

              <ChatMessageList
                listRef={listRef}
                loading={loading}
                accessDenied={accessDenied}
                messages={messages}
                isAdminViewer={isAdminViewer}
                openMenuId={openMenuId}
                adminActionId={adminActionId}
                revealedMessageIds={revealedMessageIds}
                fallbackAvatar={FALLBACK_AVATAR}
                formatTimestamp={formatTimestamp}
                renderMessageText={renderMessageText}
                onToggleMenu={setOpenMenuId}
                onHideMessage={handleHideMessage}
                onDeleteMessage={handleDeleteMessage}
                onToggleReveal={toggleRevealMessage}
                hasOlder={hasOlder}
                loadingOlder={loadingOlder}
                onLoadOlder={loadOlderMessages}
              />

              <ChatComposer
                emojiOpen={emojiOpen}
                onToggleEmoji={() => setEmojiOpen((prev) => !prev)}
                emojiButtonRef={emojiButtonRef}
                emojiMenuRef={emojiMenuRef}
                composerRef={composerRef}
                customEmojis={CUSTOM_EMOJIS}
                insertEmoji={insertEmoji}
                isAuthenticated={isAuthenticated}
                accessDenied={accessDenied}
                messageInput={messageInput}
                placeholderText={placeholderText}
                onComposerInput={handleComposerInput}
                onComposerKey={handleComposerKey}
                onSend={handleSend}
                sending={sending}
                authReady={authReady}
                error={error}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center text-sm text-foreground-2">Ładowanie czatu</div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}


