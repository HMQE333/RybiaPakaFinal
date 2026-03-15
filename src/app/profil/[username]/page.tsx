import { headers } from "next/headers";

import Page from "@/components/Page";
import NotFound from "./not-found";
import { getUser } from "@/lib/profile";
import { getSessionSafe } from "@/lib/auth";
import ProfileView from "../ProfileView";

async function getViewerId() {
  try {
    const headerList = await headers();
    const session = await getSessionSafe(headerList);
    const rawId = session?.user?.id ?? "";
    const parsed = Number(rawId);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUser(username);
  const viewerId = await getViewerId();

  if (!user) {
    return <NotFound />;
  }

  const isOwnProfile = viewerId === user.id;

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[170px] pb-20 px-4">
        <div className="w-full max-w-5xl">
          <ProfileView user={user} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </Page>
  );
}
