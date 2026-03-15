"use client";

import type { ComponentPropsWithoutRef } from "react";

import { handleUploadImageError } from "@/lib/imageFallback";

type UploadImageProps = ComponentPropsWithoutRef<"img"> & {
  fallbackSrc: string;
};

export default function UploadImage({
  fallbackSrc,
  onError,
  ...props
}: UploadImageProps) {
  return (
    <img
      {...props}
      onError={(event) => {
        handleUploadImageError(event.currentTarget, fallbackSrc);
        onError?.(event);
      }}
    />
  );
}
