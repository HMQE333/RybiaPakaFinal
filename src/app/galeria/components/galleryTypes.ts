import type { GalleryItemType } from "./GalleryItem";

export type GalleryItemWithMeta = GalleryItemType & {
  createdAt: string;
  liked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type CreateGalleryPayload = {
  title: string;
  description: string;
  category: string;
  imageFile?: File | null;
  imageUrl?: string;
};

export type EditGalleryPayload = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
};
