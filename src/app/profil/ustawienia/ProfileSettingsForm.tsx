"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarPickerDialog from "@/components/AvatarPickerDialog";
import FormButton from "@/components/Form/FormButton";
import UploadImage from "@/components/UploadImage";
import { cn } from "@/utils";
import { DEFAULT_AVATARS, isDefaultAvatar } from "@/lib/avatarDefaults";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings,
  normalizeNotificationSettings,
} from "@/lib/notificationSettings";
import { AGE_RANGES, PRESET_BANNERS, resolveBannerStyle } from "@/lib/presetBanners";

type RegionOption = {
  id: string;
  name: string;
};

type MethodOption = {
  id: string;
  name: string;
};

type SettingsUser = {
  username: string | null;
  nick: string | null;
  email: string;
  bio: string | null;
  age: number | null;
  ageRange: string | null;
  pronouns: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  regionId: string | null;
  methods: string[];
};

type ProfileSettingsFormProps = {
  user: SettingsUser;
  regions: RegionOption[];
  methods: MethodOption[];
  onboarding?: boolean;
};

type StatusTone = "success" | "error";

export default function ProfileSettingsForm({
  user,
  regions,
  methods,
  onboarding = false,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const initialAvatarUrl = (user.avatarUrl ?? "").trim();
  const isStoredAvatar = initialAvatarUrl.startsWith("/uploads/avatars/");
  const [email] = useState(user.email ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [ageRange, setAgeRange] = useState(user.ageRange ?? "");
  const [pronouns, setPronouns] = useState(user.pronouns ?? "");

  const initialBannerUrl = (user.bannerUrl ?? "").trim();
  const [bannerSourceType, setBannerSourceType] = useState<"upload" | "preset" | null>(
    initialBannerUrl.startsWith("preset:")
      ? "preset"
      : initialBannerUrl
        ? "upload"
        : null
  );
  const [bannerPresetId, setBannerPresetId] = useState(
    initialBannerUrl.startsWith("preset:") ? initialBannerUrl.slice("preset:".length) : ""
  );
  const [bannerUploadBlob, setBannerUploadBlob] = useState<Blob | null>(null);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState(
    initialBannerUrl.startsWith("preset:") ? "" : initialBannerUrl
  );
  const [bannerDropActive, setBannerDropActive] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const bannerInitialRef = useRef(initialBannerUrl);
  const bannerBlobUrlRef = useRef<string | null>(null);

  const [avatarUrlInput, setAvatarUrlInput] = useState(
    isStoredAvatar ? "" : initialAvatarUrl
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(initialAvatarUrl);
  const [regionId, setRegionId] = useState(user.regionId ?? "");
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    user.methods ?? []
  );
  const userHandle = (user.nick ?? user.username ?? "").trim();
  const initialAvatarUrlRef = useRef(initialAvatarUrl);
  const [avatarUploadBlob, setAvatarUploadBlob] = useState<Blob | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarSourceType, setAvatarSourceType] = useState<
    "upload" | "url" | null
  >(initialAvatarUrl ? (isStoredAvatar ? "upload" : "url") : null);
  const [avatarUrlCleared, setAvatarUrlCleared] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarDialogTab, setAvatarDialogTab] = useState<"default" | "custom">(
    "default"
  );
  const [pendingDefaultAvatar, setPendingDefaultAvatar] = useState("");
  const [isAvatarDropActive, setIsAvatarDropActive] = useState(false);
  const [avatarSourceUrl, setAvatarSourceUrl] = useState<string | null>(null);
  const [avatarSourceName, setAvatarSourceName] = useState<string | null>(null);
  const [avatarNaturalSize, setAvatarNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);
  const avatarDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("success");
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationLoadError, setNotificationLoadError] = useState<string | null>(
    null
  );

  const methodSet = useMemo(
    () => new Set(selectedMethods.map((method) => method.toLowerCase())),
    [selectedMethods]
  );
  const displayName = userHandle || "Użytkownik";
  const avatarPreview = avatarPreviewUrl.trim() || "/artwork/404_user.png";
  const regionLabel = useMemo(
    () => regions.find((region) => region.id === regionId)?.name ?? "Nie ustawiono",
    [regions, regionId]
  );
  const ageLabel = ageRange.trim() ? ageRange.trim() : (age.trim() ? `${age.trim()} lat` : "Nie ustawiono");

  const currentBannerStyle = useMemo(() => {
    if (bannerSourceType === "preset" && bannerPresetId) {
      return resolveBannerStyle(`preset:${bannerPresetId}`);
    }
    if (bannerSourceType === "upload" && bannerPreviewUrl) {
      return resolveBannerStyle(bannerPreviewUrl);
    }
    return resolveBannerStyle(null);
  }, [bannerSourceType, bannerPresetId, bannerPreviewUrl]);
  const previewMethods = selectedMethods.slice(0, 3);
  const extraMethods = Math.max(0, selectedMethods.length - previewMethods.length);
  const maxAvatarSizeMb = 2;
  const requiredAvatarSize = 500;
  const maxAvatarBytes = maxAvatarSizeMb * 1024 * 1024;
  const cropPreviewSize = 320;
  const minZoom = 1;
  const maxZoom = 2.6;
  const minAge = 13;
  const maxAge = 90;
  const maxBioLength = 240;

  const inputBase =
    "w-full rounded-xl border border-white/10 bg-background-2/70 px-4 py-2 text-sm text-foreground placeholder:text-foreground-2/70 focus:border-accent focus:outline-none";
  const inputDisabled = `${inputBase} bg-background-2/40 text-foreground-2 cursor-not-allowed`;
  const sectionCard =
    "rounded-2xl border border-white/10 bg-background-3/70 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.3)]";
  const notificationOptions = useMemo(
    () =>
      [
        {
          key: "commentReply",
          title: "Odpowiedzi na komentarze",
          description: "Gdy ktoś odpowie na Twój komentarz.",
        },
        {
          key: "commentMention",
          title: "Oznaczenia w komentarzach",
          description: "Gdy ktoś oznaczy Cię w komentarzu.",
        },
        {
          key: "threadMention",
          title: "Oznaczenia w wątkach",
          description: "Gdy ktoś oznaczy Cię w wątku.",
        },
        {
          key: "galleryMention",
          title: "Oznaczenia w galerii",
          description: "Gdy ktoś oznaczy Cię w galerii.",
        },
        {
          key: "newMessage",
          title: "Nowe wiadomości",
          description: "Gdy otrzymasz nową wiadomość.",
        },
      ] as Array<{
        key: keyof NotificationSettings;
        title: string;
        description: string;
      }>,
    []
  );

  useEffect(() => {
    return () => {
      if (avatarSourceUrl) {
        URL.revokeObjectURL(avatarSourceUrl);
      }
    };
  }, [avatarSourceUrl]);

  useEffect(() => {
    return () => {
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotificationSettings = async () => {
      setNotificationLoading(true);
      setNotificationLoadError(null);

      try {
        const res = await fetch("/api/notification-settings", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (active) {
            setNotificationLoadError(
              "Nie udało się wczytać ustawień powiadomień."
            );
          }
          return;
        }

        const data = await res.json().catch(() => null);
        const rawSettings =
          data && typeof data === "object"
            ? data?.settings && typeof data.settings === "object"
              ? data.settings
              : data
            : {};
        const normalized = normalizeNotificationSettings(rawSettings);

        if (active) {
          setNotificationSettings(normalized);
        }
      } catch {
        if (active) {
          setNotificationLoadError(
            "Nie udało się wczytać ustawień powiadomień."
          );
        }
      } finally {
        if (active) {
          setNotificationLoading(false);
        }
      }
    };

    loadNotificationSettings();

    return () => {
      active = false;
    };
  }, []);

  const toggleMethod = (methodName: string) => {
    setSelectedMethods((prev) => {
      if (prev.some((name) => name === methodName)) {
        return prev.filter((name) => name !== methodName);
      }
      return [...prev, methodName];
    });
  };

  const notificationEditable =
    !notificationLoading && !notificationLoadError && !isSaving;

  const toggleNotificationSetting = (key: keyof NotificationSettings) => {
    if (!notificationEditable) return;
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clampValue = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const getCropMetrics = (
    zoomValue: number,
    offsetValue: { x: number; y: number }
  ) => {
    if (!avatarNaturalSize) return null;
    const baseScale = Math.max(
      cropPreviewSize / avatarNaturalSize.width,
      cropPreviewSize / avatarNaturalSize.height
    );
    const scale = baseScale * zoomValue;
    const displayWidth = avatarNaturalSize.width * scale;
    const displayHeight = avatarNaturalSize.height * scale;
    const maxOffsetX = Math.max(0, (displayWidth - cropPreviewSize) / 2);
    const maxOffsetY = Math.max(0, (displayHeight - cropPreviewSize) / 2);
    const offsetX = clampValue(offsetValue.x, -maxOffsetX, maxOffsetX);
    const offsetY = clampValue(offsetValue.y, -maxOffsetY, maxOffsetY);

    return {
      scale,
      displayWidth,
      displayHeight,
      maxOffsetX,
      maxOffsetY,
      offsetX,
      offsetY,
    };
  };

  const clampOffset = (
    nextOffset: { x: number; y: number },
    zoomValue = avatarZoom
  ) => {
    const metrics = getCropMetrics(zoomValue, nextOffset);
    if (!metrics) return nextOffset;
    return { x: metrics.offsetX, y: metrics.offsetY };
  };

  const closeAvatarModal = () => {
    setIsAvatarModalOpen(false);
    setAvatarDialogTab("default");
    setPendingDefaultAvatar("");
    setIsAvatarDropActive(false);
    if (avatarSourceUrl) {
      URL.revokeObjectURL(avatarSourceUrl);
    }
    setAvatarSourceUrl(null);
    setAvatarSourceName(null);
    setAvatarNaturalSize(null);
    setAvatarZoom(minZoom);
    setAvatarOffset({ x: 0, y: 0 });
    setIsAvatarDragging(false);
    avatarDragRef.current = null;
  };

  const openAvatarModal = () => {
    const currentAvatar = avatarPreviewUrl.trim();
    setIsAvatarModalOpen(true);
    setAvatarMessage(null);
    setPendingDefaultAvatar(isDefaultAvatar(currentAvatar) ? currentAvatar : "");
    setAvatarDialogTab(avatarSourceType === "upload" ? "custom" : "default");
  };

  const handleAvatarFileSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusTone("error");
      setStatusMessage("Wybierz plik graficzny.");
      setAvatarMessage("Wybierz plik graficzny.");
      return;
    }

    setAvatarUploadBlob(null);
    setAvatarFileName(null);

    if (avatarSourceUrl) {
      URL.revokeObjectURL(avatarSourceUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarSourceUrl(objectUrl);
    setAvatarSourceName(file.name);
    setAvatarNaturalSize(null);
    setAvatarZoom(minZoom);
    setAvatarOffset({ x: 0, y: 0 });
    setAvatarMessage(null);
    setStatusMessage(null);

    const image = new Image();
    image.onload = () => {
      setAvatarNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      setStatusTone("error");
      setStatusMessage("Nie udało się wczytać pliku.");
      setAvatarMessage("Nie udało się wczytać pliku.");
      URL.revokeObjectURL(objectUrl);
      setAvatarSourceUrl(null);
    };
    image.src = objectUrl;
  };

  const handleAvatarDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsAvatarDropActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleAvatarFileSelect(file);
  };

  const handleAvatarDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsAvatarDropActive(true);
  };

  const handleAvatarDragLeave = () => {
    setIsAvatarDropActive(false);
  };

  const handleAvatarZoomChange = (value: number) => {
    const nextZoom = clampValue(value, minZoom, maxZoom);
    const currentZoom = avatarZoom || minZoom;
    const ratio = currentZoom > 0 ? nextZoom / currentZoom : 1;
    setAvatarOffset((prev) =>
      clampOffset(
        {
          x: prev.x * ratio,
          y: prev.y * ratio,
        },
        nextZoom
      )
    );
    setAvatarZoom(nextZoom);
  };

  const handleAvatarPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!avatarNaturalSize) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    avatarDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: avatarOffset.x,
      originY: avatarOffset.y,
    };
    setIsAvatarDragging(true);
  };

  const handleAvatarPointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!avatarDragRef.current) return;
    const deltaX = event.clientX - avatarDragRef.current.startX;
    const deltaY = event.clientY - avatarDragRef.current.startY;
    const nextOffset = {
      x: avatarDragRef.current.originX + deltaX,
      y: avatarDragRef.current.originY + deltaY,
    };
    setAvatarOffset(clampOffset(nextOffset));
  };

  const handleAvatarPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!avatarDragRef.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    avatarDragRef.current = null;
    setIsAvatarDragging(false);
  };

  const handleAvatarCropReset = () => {
    setAvatarZoom(minZoom);
    setAvatarOffset({ x: 0, y: 0 });
  };

  const handleDefaultAvatarSelect = (url: string) => {
    setPendingDefaultAvatar(url);
    setAvatarMessage(null);
  };

  const handleDefaultAvatarSave = () => {
    const nextAvatar = pendingDefaultAvatar.trim();
    if (!nextAvatar) return;
    setAvatarUrlInput(nextAvatar);
    setAvatarPreviewUrl(nextAvatar);
    setAvatarFileName(null);
    setAvatarUploadBlob(null);
    setAvatarMessage(null);
    setAvatarSourceType("url");
    setAvatarUrlCleared(false);
    closeAvatarModal();
  };

  const handleApplyAvatarCrop = async () => {
    if (!avatarSourceUrl || !avatarNaturalSize || !avatarImageRef.current) {
      setAvatarMessage("Najpierw wybierz obraz.");
      return;
    }

    const metrics = getCropMetrics(avatarZoom, avatarOffset);
    if (!metrics) return;

    const { scale, displayWidth, displayHeight, offsetX, offsetY } = metrics;
    const center = cropPreviewSize / 2;
    const imageX = center - displayWidth / 2 + offsetX;
    const imageY = center - displayHeight / 2 + offsetY;
    const rawSrcX = (0 - imageX) / scale;
    const rawSrcY = (0 - imageY) / scale;
    const srcSize = cropPreviewSize / scale;
    const maxSrcX = Math.max(0, avatarNaturalSize.width - srcSize);
    const maxSrcY = Math.max(0, avatarNaturalSize.height - srcSize);
    const srcX = clampValue(rawSrcX, 0, maxSrcX);
    const srcY = clampValue(rawSrcY, 0, maxSrcY);

    const canvas = document.createElement("canvas");
    canvas.width = requiredAvatarSize;
    canvas.height = requiredAvatarSize;
    const context = canvas.getContext("2d");
    if (!context) {
      setStatusTone("error");
      setStatusMessage("Nie udało się przetworzyć pliku.");
      setAvatarMessage("Nie udało się przetworzyć pliku.");
      return;
    }

    context.drawImage(
      avatarImageRef.current,
      srcX,
      srcY,
      srcSize,
      srcSize,
      0,
      0,
      requiredAvatarSize,
      requiredAvatarSize
    );

    const qualities = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45];
    let finalBlob: Blob | null = null;
    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob) continue;
      finalBlob = blob;
      if (blob.size <= maxAvatarBytes) break;
    }

    if (!finalBlob) {
      setStatusTone("error");
      setStatusMessage("Nie udało się przetworzyć pliku.");
      setAvatarMessage("Nie udało się przetworzyć pliku.");
      return;
    }

    if (finalBlob.size > maxAvatarBytes) {
      const message = `Nie udało się skompresować awatara do ${maxAvatarSizeMb} MB.`;
      setStatusTone("error");
      setStatusMessage(message);
      setAvatarMessage(message);
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("read-error"));
      reader.readAsDataURL(finalBlob);
    }).catch(() => "");

    if (!dataUrl) {
      setStatusTone("error");
      setStatusMessage("Nie udało się wczytać pliku.");
      setAvatarMessage("Nie udało się wczytać pliku.");
      return;
    }

    const currentAvatar = avatarPreviewUrl.trim();
    const initialAvatar = initialAvatarUrlRef.current;
    if (dataUrl === currentAvatar || dataUrl === initialAvatar) {
      setAvatarMessage("Ten sam awatar jest już ustawiony.");
      setStatusTone("error");
      setStatusMessage("Ten sam awatar jest już ustawiony.");
      return;
    }

    setAvatarUploadBlob(finalBlob);
    setAvatarPreviewUrl(dataUrl);
    setAvatarUrlInput("");
    setAvatarFileName(avatarSourceName ?? "avatar.jpg");
    setAvatarMessage(null);
    setStatusMessage(null);
    setAvatarSourceType("upload");
    setAvatarUrlCleared(false);
    closeAvatarModal();
  };

  const validateAvatarSize = (url: string) =>
    new Promise<{
      ok: boolean;
      error?: "size" | "load";
      width?: number;
      height?: number;
    }>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        if (width === requiredAvatarSize && height === requiredAvatarSize) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: "size", width, height });
        }
      };
      image.onerror = () => resolve({ ok: false, error: "load" });
      image.src = url;
    });

  const resolveAvatarErrorMessage = (code?: string) => {
    switch (code) {
      case "MISSING_FILE":
        return "Nie wybrano pliku.";
      case "UNSUPPORTED_FILE_TYPE":
        return "Nieobsługiwany format pliku.";
      case "FILE_TOO_LARGE":
        return `Maksymalny rozmiar pliku to ${maxAvatarSizeMb} MB.`;
      case "INVALID_JSON":
        return "Nieprawidłowe dane awatara.";
      case "UNAUTHORIZED":
        return "Musisz być zalogowany.";
      case "USER_NOT_FOUND":
        return "Nie znaleziono użytkownika.";
      default:
        return "Nie udało się zapisać awatara.";
    }
  };

  const handleBannerFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerMessage("Wybierz plik graficzny.");
      return;
    }
    const maxBannerMb = 5;
    if (file.size > maxBannerMb * 1024 * 1024) {
      setBannerMessage(`Maksymalny rozmiar pliku to ${maxBannerMb} MB.`);
      return;
    }
    if (bannerBlobUrlRef.current) {
      URL.revokeObjectURL(bannerBlobUrlRef.current);
      bannerBlobUrlRef.current = null;
    }
    setBannerMessage(null);
    setBannerUploadBlob(file);
    setBannerFileName(file.name);
    setBannerPresetId("");
    setBannerSourceType("upload");
    const objectUrl = URL.createObjectURL(file);
    bannerBlobUrlRef.current = objectUrl;
    setBannerPreviewUrl(objectUrl);
  };

  const handleBannerPresetSelect = (id: string) => {
    if (bannerBlobUrlRef.current) {
      URL.revokeObjectURL(bannerBlobUrlRef.current);
      bannerBlobUrlRef.current = null;
    }
    setBannerPresetId((prev) => (prev === id ? "" : id));
    setBannerUploadBlob(null);
    setBannerFileName(null);
    setBannerPreviewUrl("");
    setBannerSourceType(bannerPresetId === id ? null : "preset");
    setBannerMessage(null);
  };

  const handleBannerRemove = () => {
    if (bannerBlobUrlRef.current) {
      URL.revokeObjectURL(bannerBlobUrlRef.current);
      bannerBlobUrlRef.current = null;
    }
    setBannerPresetId("");
    setBannerUploadBlob(null);
    setBannerFileName(null);
    setBannerPreviewUrl("");
    setBannerSourceType(null);
    setBannerMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setStatusMessage(null);

    const trimmedBio = bio.trim();
    const trimmedAvatar = avatarUrlInput.trim();
    const rawAge = age.trim();
    const parsedAge = rawAge ? Number(rawAge) : null;
    const avatarUsesUpload = Boolean(avatarUploadBlob);
    const avatarCleared = avatarUrlCleared && !avatarUsesUpload;
    const avatarChanged =
      avatarUsesUpload ||
      avatarCleared ||
      (trimmedAvatar && trimmedAvatar !== initialAvatarUrlRef.current);

    if (rawAge && (!Number.isFinite(parsedAge) || !Number.isInteger(parsedAge))) {
      setStatusTone("error");
      setStatusMessage("Wiek musi byc liczba calkowita.");
      setIsSaving(false);
      return;
    }

    if (parsedAge !== null && (parsedAge < minAge || parsedAge > maxAge)) {
      setStatusTone("error");
      setStatusMessage("Wiek musi byc liczba calkowita w dozwolonym zakresie.");
      setIsSaving(false);
      return;
    }

    if (trimmedBio.length > maxBioLength) {
      setStatusTone("error");
      setStatusMessage(
        `Opis może mieć maksymalnie ${maxBioLength} znaków.`
      );
      setIsSaving(false);
      return;
    }

    if (trimmedAvatar && !avatarUsesUpload) {
      const result = await validateAvatarSize(trimmedAvatar);
      if (!result.ok) {
        let message = `Awatar musi mieć format ${requiredAvatarSize}x${requiredAvatarSize} px.`;
        if (result.error === "size" && result.width && result.height) {
          message = `Awatar musi mieć format ${requiredAvatarSize}x${requiredAvatarSize} px. Twój obraz ma ${result.width}x${result.height} px.`;
        } else if (result.error === "load") {
          message = "Nie udało się wczytać obrazu z linku. Sprawdź URL.";
        }
        setStatusTone("error");
        setStatusMessage(message);
        setAvatarMessage(message);
        setIsSaving(false);
        return;
      }
    }

    let resolvedBannerUrl: string | null =
      bannerSourceType === "preset" && bannerPresetId
        ? `preset:${bannerPresetId}`
        : bannerSourceType === "upload"
          ? bannerPreviewUrl || null
          : null;

    if (bannerUploadBlob && bannerFileName) {
      setBannerMessage(null);
      try {
        const fd = new FormData();
        fd.append("file", new File([bannerUploadBlob], bannerFileName, { type: bannerUploadBlob.type || "image/jpeg" }));
        const res = await fetch("/api/profile/banner", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const code = data?.error;
          setBannerMessage(
            code === "FILE_TOO_LARGE" ? "Plik banera jest za duży (max 5 MB)."
            : code === "UNSUPPORTED_FILE_TYPE" ? "Nieobsługiwany format pliku banera."
            : "Nie udało się zapisać banera."
          );
          setStatusTone("error");
          setStatusMessage("Nie udało się zapisać banera.");
          setIsSaving(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        resolvedBannerUrl = data?.bannerUrl ?? null;
        setBannerUploadBlob(null);
        setBannerFileName(null);
        if (bannerBlobUrlRef.current) {
          URL.revokeObjectURL(bannerBlobUrlRef.current);
          bannerBlobUrlRef.current = null;
        }
        if (resolvedBannerUrl) {
          setBannerPreviewUrl(resolvedBannerUrl);
          setBannerSourceType("upload");
        }
        bannerInitialRef.current = resolvedBannerUrl ?? "";
      } catch {
        setStatusTone("error");
        setStatusMessage("Nie udało się zapisać banera.");
        setIsSaving(false);
        return;
      }
    }

    if (avatarChanged) {
      try {
        if (avatarUsesUpload && avatarUploadBlob) {
          const formData = new FormData();
          const fallbackName = avatarSourceName ?? avatarFileName ?? "avatar.jpg";
          const file = new File([avatarUploadBlob], fallbackName, {
            type: avatarUploadBlob.type || "image/jpeg",
          });
          formData.append("file", file);

          const res = await fetch("/api/profile/avatar", {
            method: "POST",
            credentials: "include",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const message = resolveAvatarErrorMessage(data?.error);
            setStatusTone("error");
            setStatusMessage(message);
            setAvatarMessage(message);
            setIsSaving(false);
            return;
          }

          const data = await res.json().catch(() => ({}));
          const newAvatarUrl =
            typeof data?.avatarUrl === "string" ? data.avatarUrl : "";
          setAvatarUrlInput("");
          setAvatarPreviewUrl(newAvatarUrl || "");
          initialAvatarUrlRef.current = newAvatarUrl || "";
          setAvatarUploadBlob(null);
          setAvatarFileName(null);
          setAvatarMessage(null);
          setAvatarSourceType(newAvatarUrl ? "upload" : null);
          setAvatarUrlCleared(false);
        } else if (trimmedAvatar !== initialAvatarUrlRef.current) {
          const res = await fetch("/api/profile/avatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ avatarUrl: trimmedAvatar || null }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const message = resolveAvatarErrorMessage(data?.error);
            setStatusTone("error");
            setStatusMessage(message);
            setAvatarMessage(message);
            setIsSaving(false);
            return;
          }

          const data = await res.json().catch(() => ({}));
          const newAvatarUrl =
            typeof data?.avatarUrl === "string" ? data.avatarUrl : "";
          setAvatarUrlInput(newAvatarUrl || "");
          setAvatarPreviewUrl(newAvatarUrl || "");
          initialAvatarUrlRef.current = newAvatarUrl || "";
          setAvatarMessage(null);
          setAvatarSourceType(newAvatarUrl ? "url" : null);
          setAvatarUrlCleared(false);
        }
      } catch {
        setStatusTone("error");
        setStatusMessage("Nie udało się zapisać awatara.");
        setAvatarMessage("Nie udało się zapisać awatara.");
        setIsSaving(false);
        return;
      }
    }

    const payload: {
      bio?: string | null;
      age?: number | null;
      ageRange?: string | null;
      pronouns?: string | null;
      bannerUrl?: string | null;
      regionId?: string | null;
    } = {
      bio: trimmedBio || null,
      age: parsedAge !== null ? parsedAge : null,
      ageRange: ageRange.trim() || null,
      pronouns: pronouns.trim() || null,
      bannerUrl: resolvedBannerUrl,
      regionId: regionId || null,
    };

    try {
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.message || data?.error;

        if (code === "USERNAME_IS_ALREADY_TAKEN") {
          setStatusMessage("Ta nazwa użytkownika jest już zajęta.");
        } else if (code === "UNAUTHORIZED") {
          setStatusMessage("Musisz być zalogowany.");
        } else {
          setStatusMessage("Nie udało się zapisać danych profilu.");
        }
        setStatusTone("error");
        return;
      }

      const methodsRes = await fetch("/api/profile/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ methods: selectedMethods }),
      });

      if (!methodsRes.ok) {
        setStatusTone("error");
        setStatusMessage(
          "Dane profilu zapisane, ale metody wędkarskie nie zostały zaktualizowane."
        );
        return;
      }

      if (notificationLoading || notificationLoadError) {
        setStatusTone("error");
        setStatusMessage(
          "Dane profilu zapisane, ale powiadomienia nie zostały zaktualizowane."
        );
        return;
      }

      const notificationRes = await fetch("/api/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings: notificationSettings }),
      });

      if (!notificationRes.ok) {
        setStatusTone("error");
        setStatusMessage(
          "Dane profilu zapisane, ale powiadomienia nie zostały zaktualizowane."
        );
        return;
      }

      setStatusTone("success");
      setStatusMessage("Zapisano zmiany profilu.");
      router.push("/profil");
    } catch {
      setStatusTone("error");
      setStatusMessage("Nie udało się zapisać ustawień profilu.");
    } finally {
      setIsSaving(false);
    }
  };

  const cropMetrics = getCropMetrics(avatarZoom, avatarOffset);
  const cropImageStyle = cropMetrics
    ? {
        width: `${cropMetrics.displayWidth}px`,
        height: `${cropMetrics.displayHeight}px`,
        transform: `translate3d(${cropPreviewSize / 2 - cropMetrics.displayWidth / 2 + cropMetrics.offsetX}px, ${cropPreviewSize / 2 - cropMetrics.displayHeight / 2 + cropMetrics.offsetY}px, 0)`,
      }
    : undefined;

  const avatarCustomContent = avatarSourceUrl ? (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-background-2/70 p-4">
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 touch-none",
              isAvatarDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
              width: cropPreviewSize,
              height: cropPreviewSize,
            }}
            onPointerDown={handleAvatarPointerDown}
            onPointerMove={handleAvatarPointerMove}
            onPointerUp={handleAvatarPointerUp}
            onPointerLeave={handleAvatarPointerUp}
          >
            {cropImageStyle ? (
              <img
                ref={avatarImageRef}
                src={avatarSourceUrl}
                alt="Podglad awatara"
                draggable={false}
                loading="lazy"
                decoding="async"
                className="absolute left-0 top-0 select-none max-w-none max-h-none"
                style={cropImageStyle}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-xs text-foreground-2">
                Ladowanie obrazu...
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_56%,rgba(0,0,0,0.55)_57%)]" />
            <div className="absolute inset-0 rounded-full border-2 border-white/80 pointer-events-none" />
          </div>

          <div className="flex w-full items-center gap-3">
            <span className="text-xs text-foreground-2">Zoom</span>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={avatarZoom}
              onChange={(event) =>
                handleAvatarZoomChange(Number(event.currentTarget.value))
              }
              className="flex-1 accent-accent"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAvatarCropReset}
          className="text-xs text-foreground-2 hover:text-foreground transition-colors"
        >
          Resetuj
        </button>
        <label className="inline-flex items-center justify-center rounded-full border border-white/10 bg-background-2/80 px-4 py-2 text-xs text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors cursor-pointer">
          Zmien plik
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              event.currentTarget.value = "";
              handleAvatarFileSelect(file);
            }}
            className="hidden"
          />
        </label>
      </div>

      {avatarMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {avatarMessage}
        </div>
      )}
    </div>
  ) : (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-background-2/70 p-6 text-center",
          isAvatarDropActive && "border-accent/60 bg-accent/10"
        )}
        onDrop={handleAvatarDrop}
        onDragOver={handleAvatarDragOver}
        onDragLeave={handleAvatarDragLeave}
      >
        <div className="grid place-items-center h-20 w-20 rounded-2xl border border-white/10 bg-background-3/70 text-foreground-2 text-sm">
          +
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            Przeciagnij obraz
          </p>
          <p className="text-xs text-foreground-2">
            Lub wybierz plik z urzadzenia.
          </p>
        </div>
        <label className="inline-flex items-center justify-center rounded-full border border-white/10 bg-background-2/80 px-4 py-2 text-xs text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors cursor-pointer">
          Wybierz plik
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              event.currentTarget.value = "";
              handleAvatarFileSelect(file);
            }}
            className="hidden"
          />
        </label>
        <p className="text-xs text-foreground-2">
          Maksymalnie {maxAvatarSizeMb} MB, {requiredAvatarSize}x
          {requiredAvatarSize} px.
        </p>
      </div>
      {avatarMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {avatarMessage}
        </div>
      )}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {statusMessage && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              statusTone === "success"
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            )}
          >
            {statusMessage}
          </div>
        )}
        {onboarding && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
            <div className="font-semibold">Ustaw avatar po rejestracji</div>
            <div className="mt-1 text-xs text-foreground-2">
              Wybierz jeden z 10 automatycznych lub dodaj wlasny obraz.
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <section className={sectionCard}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Podstawowe dane
                </h3>
                <p className="text-xs text-foreground-2">
                  Nazwa użytkownika i e-mail są stałe. Po nazwie dodaje się
                  użytkowników.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-foreground-2">
                  Nazwa użytkownika
                  <input value={userHandle} disabled className={inputDisabled} />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground-2 md:col-span-2">
                  E-mail
                  <input value={email} disabled className={inputDisabled} />
                </label>
              </div>
            </section>

            <section className={sectionCard}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Dane profilu
                </h3>
                <p className="text-xs text-foreground-2">
                  Dodaj avatar i uzupełnij podstawowe informacje o sobie.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-foreground-2 md:col-span-2">
                  <span className="text-xs text-foreground-2">Avatar</span>
                  <div className="rounded-xl border border-white/10 bg-background-2/60 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-background-3/70">
                        <UploadImage
                          src={avatarPreview}
                          alt={`Avatar ${displayName}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          fallbackSrc="/artwork/404_user.png"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          Wybierz avatar
                        </div>
                        <div className="text-xs text-foreground-2">
                          Domyslny lub wlasny obraz.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openAvatarModal}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background-2/70 px-4 py-2 text-xs text-foreground-2 hover:text-foreground hover:border-white/20 transition-colors"
                      >
                        Zmien avatar
                      </button>
                    </div>
                  </div>
                  {avatarMessage && (
                    <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {avatarMessage}
                    </div>
                  )}
                </label>
                <div className="flex flex-col gap-2 text-sm text-foreground-2">
                  Zakres wiekowy
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map((range) => (
                      <button
                        key={range.value}
                        type="button"
                        onClick={() => setAgeRange((prev) => prev === range.value ? "" : range.value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          ageRange === range.value
                            ? "border-accent/40 bg-accent/15 text-accent"
                            : "border-white/10 bg-background-4/60 text-foreground-2 hover:border-white/20 hover:text-foreground"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-2 text-sm text-foreground-2">
                  Zaimki (opcjonalne)
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(event) => setPronouns(event.target.value)}
                    placeholder="np. on/jego"
                    maxLength={40}
                    className={inputBase}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-foreground-2">
                  Województwo
                  <select
                    value={regionId}
                    onChange={(event) => setRegionId(event.target.value)}
                    className={inputBase}
                  >
                    <option value="">Nie ustawiono</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={sectionCard}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Baner profilu</h3>
                <p className="text-xs text-foreground-2">
                  Wybierz gotowy motyw lub prześlij własne zdjęcie.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {currentBannerStyle.type !== "none" && (
                  <div
                    className="relative h-20 w-full overflow-hidden rounded-xl border border-white/10"
                    style={currentBannerStyle.type === "preset" ? { background: currentBannerStyle.gradient } : undefined}
                  >
                    {currentBannerStyle.type === "image" && currentBannerStyle.src && (
                      <img
                        src={currentBannerStyle.src}
                        alt="Podgląd banera"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleBannerRemove}
                      className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-xs text-foreground-2 hover:text-foreground transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-xs text-foreground-2 mb-2">Gotowe motywy</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_BANNERS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleBannerPresetSelect(preset.id)}
                        className={cn(
                          "relative h-12 overflow-hidden rounded-lg border transition-all",
                          bannerPresetId === preset.id
                            ? "border-accent ring-1 ring-accent"
                            : "border-white/10 hover:border-white/30"
                        )}
                        style={{ background: preset.gradient }}
                        title={preset.label}
                      >
                        <span className="absolute inset-0 grid place-items-center text-[10px] text-white/80 bg-black/20">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-foreground-2 mb-2">Lub prześlij własny plik (max 5 MB)</p>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-background-2/70 px-4 py-3 text-xs text-foreground-2 transition-colors hover:border-white/20 hover:text-foreground",
                      bannerDropActive && "border-accent/60 bg-accent/10"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setBannerDropActive(true); }}
                    onDragLeave={() => setBannerDropActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setBannerDropActive(false);
                      handleBannerFileSelect(e.dataTransfer.files?.[0] ?? null);
                    }}
                  >
                    <span>Wybierz plik banera</span>
                    {bannerFileName && <span className="ml-auto text-foreground-2 truncate max-w-[120px]">{bannerFileName}</span>}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] ?? null;
                        e.currentTarget.value = "";
                        handleBannerFileSelect(file);
                      }}
                    />
                  </label>
                </div>

                {bannerMessage && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {bannerMessage}
                  </div>
                )}
              </div>
            </section>

            <section className={sectionCard}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Opis</h3>
                <p className="text-xs text-foreground-2">
                  Krótki opis pojawi się w Twoim profilu.
                </p>
              </div>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Opowiedz coś o sobie..."
                rows={4}
                maxLength={maxBioLength}
                className={`${inputBase} mt-4 min-h-[120px] resize-none`}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-foreground-2">
                <span>Limit: {maxBioLength} znakow.</span>
                <span>
                  {bio.length}/{maxBioLength}
                </span>
              </div>
            </section>

            <section className={sectionCard}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Metody wędkarskie
                  </h3>
                  <p className="text-xs text-foreground-2">
                    Wybierz metody, które najlepiej Cię opisują.
                  </p>
                </div>
                <span className="text-xs text-foreground-2">
                  {selectedMethods.length} wybranych
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {methods.map((method) => {
                  const isActive = methodSet.has(method.name.toLowerCase());
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer",
                        isActive
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-white/10 bg-background-4/60 text-foreground-2 hover:border-white/20 hover:text-foreground"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleMethod(method.name)}
                        className="hidden"
                      />
                      <span>{method.name}</span>
                    </label>
                  );
                })}
              </div>
            </section>
            <section className={sectionCard}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Powiadomienia
                </h3>
                <p className="text-xs text-foreground-2">
                  Wybierz, kiedy chcesz dostawać powiadomienia.
                </p>
              </div>

              {notificationLoadError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {notificationLoadError}
                </div>
              )}

              {notificationLoading && (
                <div className="mt-4 rounded-xl border border-white/10 bg-background-2/70 px-3 py-2 text-xs text-foreground-2">
                  Ładowanie ustawień powiadomień...
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-background-2/70 px-4 py-3">
                  <div>
                    <div className="text-sm text-foreground">
                      Powiadomienia systemowe (forum)
                    </div>
                    <div className="text-xs text-foreground-2">
                      Zawsze włączone, nie można wyłączyć.
                    </div>
                  </div>
                  <span className="relative inline-flex h-6 w-11 items-center">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      disabled
                      className="sr-only"
                    />
                    <span className="absolute inset-0 rounded-full bg-accent/70" />
                    <span className="absolute left-1 top-1 h-4 w-4 translate-x-5 rounded-full bg-white" />
                  </span>
                </label>

                {notificationOptions.map((option) => {
                  const checked = notificationSettings[option.key];
                  return (
                    <label
                      key={option.key}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-background-2/70 px-4 py-3",
                        !notificationEditable && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div>
                        <div className="text-sm text-foreground">
                          {option.title}
                        </div>
                        <div className="text-xs text-foreground-2">
                          {option.description}
                        </div>
                      </div>
                      <span className="relative inline-flex h-6 w-11 items-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNotificationSetting(option.key)}
                          disabled={!notificationEditable}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "absolute inset-0 rounded-full transition-colors",
                            checked
                              ? "bg-accent/80"
                              : "bg-background-4/80"
                          )}
                        />
                        <span
                          className={cn(
                            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform",
                            checked ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className={sectionCard}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Podgląd profilu
                </h3>
                <Link
                  href="/profil"
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Zobacz profil
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10 bg-background-2/70">
                  <img
                    src={avatarPreview}
                    alt={`Avatar ${displayName}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = "/artwork/404_user.png";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-foreground-2">Nazwa</div>
                  <div className="text-base font-semibold text-foreground truncate">
                    @{displayName}
                  </div>
                  <div className="text-xs text-foreground-2 truncate">
                    {email}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-background-2/70 p-2">
                  <div className="text-[11px] text-foreground-2">
                    Województwo
                  </div>
                  <div className="text-xs font-medium text-foreground truncate">
                    {regionLabel}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-background-2/70 p-2">
                  <div className="text-[11px] text-foreground-2">Wiek</div>
                  <div className="text-xs font-medium text-foreground truncate">
                    {ageLabel}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-background-2/60 px-3 py-2 text-xs text-foreground-2">
                {previewMethods.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <span>Metody:</span>
                    {previewMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full border border-white/10 bg-background-3/70 px-2 py-0.5 text-[11px] text-foreground-2"
                      >
                        {method}
                      </span>
                    ))}
                    {extraMethods > 0 && (
                      <span className="text-[11px] text-foreground-2">
                        +{extraMethods}
                      </span>
                    )}
                  </div>
                ) : (
                  <span>Nie wybrano metod.</span>
                )}
              </div>
            </section>

            <section className={sectionCard}>
              <h3 className="text-sm font-semibold text-foreground">Wskazówki</h3>
              <ul className="mt-3 space-y-2 text-xs text-foreground-2 list-disc list-inside">
                <li>Nazwa użytkownika nie może być zmieniona.</li>
                <li>Wklej bezpośredni link do avatara.</li>
                <li>Wiek i województwo są opcjonalne.</li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground-2">
            Zmiany są widoczne po zapisaniu.
          </p>
          <FormButton
            title={isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
            disabled={isSaving}
            fullWidth={false}
            className="px-6"
          />
        </div>
      </form>

      <AvatarPickerDialog
        open={isAvatarModalOpen}
        activeTab={avatarDialogTab}
        onTabChange={(tab) => {
          setAvatarDialogTab(tab);
          setAvatarMessage(null);
          setIsAvatarDropActive(false);
        }}
        onClose={closeAvatarModal}
        defaultAvatars={DEFAULT_AVATARS}
        selectedDefault={pendingDefaultAvatar}
        onSelectDefault={handleDefaultAvatarSelect}
        onSaveDefault={handleDefaultAvatarSave}
        canSaveDefault={Boolean(pendingDefaultAvatar)}
        onSaveCustom={handleApplyAvatarCrop}
        canSaveCustom={Boolean(avatarSourceUrl)}
        customContent={avatarCustomContent}
      />
    </>
  );
}


