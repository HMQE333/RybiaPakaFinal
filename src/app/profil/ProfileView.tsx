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

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background-3/90 via-background-2/90 to-background-3/80 shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
        {banner.type === "preset" && (
          <div
            className="absolute inset-x-0 top-0 h-24 sm:h-28"
            style={{ background: banner.gradient }}
            aria-hidden
          />
        )}
        {banner.type === "image" && banner.src && (
          <div className="absolute inset-x-0 top-0 h-24 sm:h-28 overflow-hidden">
            <img
              src={banner.src}
              alt="Baner profilu"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_20%,rgba(0,206,0,0.12),transparent_45%)]" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(0,150,255,0.12),transparent_50%)]" />
        {isOwnProfile && (
          <Link
            href="/profil/ustawienia"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background-2/80 text-foreground-2 transition hover:border-accent/40 hover:text-accent"
            aria-label="Ustawienia profilu"
          >
            <Settings size={18} />
          </Link>
        )}
        <div className={`relative p-6 sm:p-7 ${banner.type !== "none" ? "pt-20 sm:pt-24" : ""}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-background-2/70 border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.35)]">
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
                  className="absolute bottom-1 right-1"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate max-w-[70vw]">
                    <span className="text-accent">@{displayName}</span>
                  </h1>
                  {hasRank && <RankBadge rank={user.rank} />}
                </div>
                {user.pronouns && (
                  <div className="mt-0.5 text-xs text-foreground-2 italic">
                    {user.pronouns}
                  </div>
                )}
                <div className="mt-1 text-sm text-foreground-2">
                  Dołączono: {formatJoined(user.joinedAt)}
                </div>
                <div className="mt-3 max-w-2xl">
                  <UserBio bio={user.bio} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
              {showSocialActions && <AddFriendButton />}
              {showSocialActions && <SendMessageButton />}
              {showSocialActions && <ReportButton />}
            </div>
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
