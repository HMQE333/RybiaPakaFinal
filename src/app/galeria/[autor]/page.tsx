import { redirect } from "next/navigation";

export default async function GalleryAuthorPage({
  params,
}: {
  params: Promise<{ autor: string }>;
}) {
  const { autor } = await params;
  const target = `/galeria?autor=${encodeURIComponent(autor)}`;
  redirect(target);
}
