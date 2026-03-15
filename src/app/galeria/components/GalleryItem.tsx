"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2 } from "lucide-react";

import { handleUploadImageError } from "@/lib/imageFallback";

export interface GalleryItemType {
  id: string;
  imageUrl: string | import("next/image").StaticImageData;
  title: string;
  author: string;
  authorAvatar: string | import("next/image").StaticImageData;
  likes: number;
  comments: number;
  category: string;
  description?: string;
  createdAt?: string;
  liked?: boolean;
}

interface GalleryItemProps {
  item: GalleryItemType;
  onSelect?: () => void;
}

export default function GalleryItem({ item, onSelect }: GalleryItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isDataUrl =
    typeof item.imageUrl === "string" && item.imageUrl.startsWith("data:");
  const isRemoteUrl =
    typeof item.imageUrl === "string" &&
    (item.imageUrl.startsWith("http://") ||
      item.imageUrl.startsWith("https://"));
  const disableOptimization = isDataUrl || isRemoteUrl;

  useEffect(() => {
    setImageLoaded(false);
  }, [item.imageUrl]);

  return (
    <button
      onClick={onSelect}
      className="group relative w-full text-left break-inside-avoid rounded-xl overflow-hidden bg-background-2 border border-white/5 hover:border-accent/30 transition-all duration-300"
    >
      <div className="relative w-full aspect-square">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-background-3/70 animate-pulse" />
        )}
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          unoptimized={disableOptimization}
          onLoadingComplete={() => setImageLoaded(true)}
          onError={(event) => {
            handleUploadImageError(
              event.currentTarget,
              "/artwork/404_post.png"
            );
            setImageLoaded(true);
          }}
          className={`object-cover transition-transform transition-opacity duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">
              {item.title}
            </h3>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full overflow-hidden relative">
                <Image
                  src={item.authorAvatar}
                  alt={item.author}
                  fill
                  sizes="24px"
                  className="object-cover"
                  onError={(event) =>
                    handleUploadImageError(
                      event.currentTarget,
                      "/artwork/404_user.png"
                    )
                  }
                />
              </div>
              <span className="text-white/80 text-xs font-medium">
                {item.author}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Heart size={16} />
                  <span className="text-xs font-bold">{item.likes}</span>
                </span>
                <span className="flex items-center gap-1.5 text-white/90">
                  <MessageCircle size={16} />
                  <span className="text-xs font-bold">{item.comments}</span>
                </span>
              </div>

              <span className="text-white/90 p-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                <Share2 size={16} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
