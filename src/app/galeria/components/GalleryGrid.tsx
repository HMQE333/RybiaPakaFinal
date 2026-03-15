"use client";

import React from "react";
import GalleryItem, { GalleryItemType } from "./GalleryItem";

interface GalleryGridProps {
  items: GalleryItemType[];
  onSelectItem: (item: GalleryItemType) => void;
}

export default function GalleryGrid({ items, onSelectItem }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-xl font-medium text-foreground-2">
          Brak zdjęć w tej kategorii
        </p>
        <p className="text-sm text-foreground-3 mt-2">
          Bądź pierwszy i dodaj swoje zdjęcie!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-20">
      {items.map((item) => (
        <GalleryItem
          key={item.id}
          item={item}
          onSelect={() => onSelectItem(item)}
        />
      ))}
    </div>
  );
}
