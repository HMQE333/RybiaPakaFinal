import Link from "next/link";
import { MessageSquare, FileText, MessageCircle, Settings } from "lucide-react";

import {
  RankBadge,
  StatCard,
  TagPill,
  AddFriendButton,
  ReportButton,
  OnlineStatusDot,
  SendMessageButton,
  UserBio,
} from "@/components/Profile";
import UploadImage from "@/components/UploadImage";
import { resolveBannerStyle } from "@/lib/presetBanners";

import type { Profile } from "@/lib/profile";

function formatJoined(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    return "Nieznana data";
  }
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

type ProfileViewProps = {
  user: Profile;
  isOwnProfile?: boolean;
};

export default function ProfileView({
  user,
  isOwnProfile = false,
}: ProfileViewProps) {
  const displayName = user.username?.trim() || "Użytkownik";
  const voivodeshipLabel = user.voivodeship ?? "Nie podano";
  const ageLabel = user.ageRange ? user.ageRange : "Nie podano";
  const methods = user.methods ?? [];
  const hasMethods = methods.length > 0;
  const hasRank = Boolean(user.rank && user.rank.trim().length > 0);
  const showSocialActions = !isOwnProfile;

  const banner = resolveBannerStyle(user.bannerUrl);
  const hasBanner = banner.type !== "none";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 shadow-[0_12px_50px_rgba(0,0,0,0.35)] overflow-hidden">

        {/* ── Banner section ── */}
        <div className={`relative ${hasBanner ? "h-36 sm:h-44" : "h-20 sm:h-24"}`}>
          {banner.type === "preset" && (
            <div
              className="absolute inset-0"
              style={{ background: banner.gradient }}
              aria-hidden
            />
          )}
          {banner.type === "image" && banner.src && (
            <div className="absolute inset-0">
              <img
                src={banner.src}
                alt="Baner profilu"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!hasBanner && (
            <div className="absolute inset-0 bg-gradient-to-br from-background-3 via-background-2 to-background-3" />
          )}
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_45%)]" aria-hidden />
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" aria-hidden />

          {isOwnProfile && (
            <Link
              href="/profil/ustawienia"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-sm text-white/80 transition hover:border-accent/50 hover:text-accent hover:bg-black/60"
              aria-label="Ustawienia profilu"
            >
              <Settings size={16} />
            </Link>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="px-6 pb-6 sm:px-7 sm:pb-7">

          {/* Avatar row — negative margin pulls avatar up over the banner */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-5">
            <div
              className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-full overflow-hidden
                         ring-4 ring-background-3
                         bg-background-3 shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
            >
              <UploadImage
                src={user.avatar ?? "/artwork/404_user.png"}
                alt={`Avatar ${displayName}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                fallbackSrc="/artwork/404_user.png"
              />
              <OnlineStatusDot
                status={user.status}
                className="absolute bottom-1.5 right-1.5"
              />
            </div>

            {showSocialActions && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-1">
                <AddFriendButton targetUsername={user.username ?? undefined} targetId={user.id} />
                <SendMessageButton targetId={user.id} />
                <ReportButton />
              </div>
            )}
          </div>

          {/* Username + rank */}
          <div className="flex flex-wrap items-center gap-2 leading-none">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate max-w-[70vw]">
              <span className="text-accent">@{displayName}</span>
            </h1>
            {hasRank && <RankBadge rank={user.rank} />}
          </div>

          {/* Pronouns */}
          {user.pronouns && (
            <p className="mt-1 text-xs text-foreground-2 italic">
              {user.pronouns}
            </p>
          )}

          {/* Join date */}
          <p className="mt-1.5 text-sm text-foreground-2">
            Dołączono: {formatJoined(user.joinedAt)}
          </p>

          {/* Bio */}
          <div className="mt-3 max-w-2xl">
            <UserBio bio={user.bio} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-background-3/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="text-xs text-foreground-2">Województwo</div>
          <div className="mt-1 text-base font-medium text-foreground">
            {voivodeshipLabel}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background-3/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="text-xs text-foreground-2">Wiek</div>
          <div className="mt-1 text-base font-medium text-foreground">
            {ageLabel}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-background-3/70 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
        <h2 className="text-sm text-foreground-2 mb-2">Metody połowów</h2>
        {hasMethods ? (
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <TagPill key={m} label={m} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-2">
            Nie dodano metod połowu.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-background-3/70 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.3)]">
        <h2 className="text-sm text-foreground-2 mb-3">Aktywność</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Posty"
            value={user.postsCount}
            icon={<FileText size={18} />}
          />
          <StatCard
            label="Komentarze"
            value={user.commentsCount}
            icon={<MessageCircle size={18} />}
          />
          <StatCard
            label="Wiadomości"
            value={user.messagesCount}
            icon={<MessageSquare size={18} />}
          />
        </div>
      </div>
    </div>
  );
}
