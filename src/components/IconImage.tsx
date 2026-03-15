"use client";

import { useEffect, useState } from "react";

import { ICON_PLACEHOLDER } from "@/lib/iconAssets";

type IconImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "auto" | "sync";
};

export default function IconImage({
  src,
  alt,
  width,
  height,
  className,
  loading = "eager",
  decoding = "async",
}: IconImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    if (currentSrc !== ICON_PLACEHOLDER) {
      setCurrentSrc(ICON_PLACEHOLDER);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
    />
  );
}
