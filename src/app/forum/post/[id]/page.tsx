import NotFound from "./not-found";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // renderuj not-found.tsx gdy nie znaleziono postu

  const exists = false; // usuń jak dasz logikę sprawdzania czy post istnieje

  if (!exists) {
    return <NotFound />;
  }
}
