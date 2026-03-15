import UploadImage from "@/components/UploadImage";
import type { ReviewEntry } from "@/lib/reviewsStore";

const FALLBACK_AVATAR = "/artwork/404_user.png";

interface ReviewProps {
  review: ReviewEntry;
}

export default function Review({ review }: ReviewProps) {
  const avatarUrl = review.avatarUrl || FALLBACK_AVATAR;

  return (
    <figure className="relative w-64 cursor-pointer overflow-hidden rounded-xl border border-[var(--background-3)] bg-[var(--background-2)] p-4 hover:bg-[var(--background-3)]">
      <div className="flex flex-row items-center gap-2">
        <UploadImage
          className="rounded-full"
          width="32"
          height="32"
          alt=""
          src={avatarUrl}
          loading="lazy"
          decoding="async"
          fallbackSrc={FALLBACK_AVATAR}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-[var(--foreground)]">
            {review.name}
          </figcaption>
          <p className="text-xs font-medium text-[var(--foreground-2)]">
            {review.subtitle}
          </p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-[var(--foreground-2)]">
        {review.body}
      </blockquote>
    </figure>
  );
}
