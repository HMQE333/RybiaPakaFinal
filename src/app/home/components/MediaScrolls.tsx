import Marquee from "@/components/Marquee";
import { ensureGalleryTables } from "@/app/api/galeria/_utils";
import prisma from "@/lib/prisma";
import { PARTNER_VIDEOS } from "@/lib/partnerVideos";
import UploadImage from "@/components/UploadImage";

type GalleryImage = {
  id: string;
  imageUrl: string;
  title: string;
};

type PartnerVideoItem = {
  id: string;
  title: string;
};

const getYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }
    const videoId = parsed.searchParams.get("v");
    if (videoId) return videoId;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1];
    }
  } catch {
    return null;
  }
  return null;
};

const buildPartnerVideos = (): PartnerVideoItem[] => {
  return PARTNER_VIDEOS.map((video) => {
    const id = getYouTubeId(video.url);
    if (!id) return null;
    return { id, title: video.title };
  }).filter(Boolean) as PartnerVideoItem[];
};

async function fetchGalleryImages() {
  try {
    await ensureGalleryTables();
    const rows = await prisma.$queryRaw<GalleryImage[]>`
      SELECT "id", "imageUrl", "title"
      FROM "GalleryItem"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 24;
    `;
    return rows.filter((row) => row.imageUrl);
  } catch {
    return [];
  }
}

export default async function MediaScrolls() {
  const images = await fetchGalleryImages();
  const partnerVideos = buildPartnerVideos();

  if (images.length === 0 && partnerVideos.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-[30px] py-10 bg-[var(--background)] overflow-hidden">
      <div className="w-full max-w-7xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-8 text-center">
          Galeria Społeczności
        </h2>
      </div>

      <div className="relative w-full flex flex-col gap-8">
        {images.length > 0 && (
          <Marquee pauseOnHover className="[--duration:40s]">
            {images.map((image) => (
              <div key={image.id} className="mx-4">
                <UploadImage
                  src={image.imageUrl}
                  alt={
                    image.title
                      ? `Zdjęcie: ${image.title}`
                      : "Zdjęcie z galerii"
                  }
                  loading="lazy"
                  decoding="async"
                  className="w-64 h-48 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                  fallbackSrc="/artwork/404_post.png"
                />
              </div>
            ))}
          </Marquee>
        )}

        {partnerVideos.length > 0 && (
          <Marquee reverse pauseOnHover className="[--duration:50s]">
            {partnerVideos.map((video, index) => (
              <div key={`${video.id}-${index}`} className="mx-4">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  className="w-80 h-48 rounded-xl shadow-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            ))}
          </Marquee>
        )}

        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[var(--background)] z-10"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[var(--background)] z-10"></div>
      </div>
    </div>
  );
}
