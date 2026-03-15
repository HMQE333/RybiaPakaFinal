import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionSafe } from "@/lib/auth";
import Page from "@/components/Page";
import { getUser, getUserByEmail, getUserById } from "@/lib/profile";
import ProfileView from "./ProfileView";

async function getSessionProfile() {
  try {
    const headerList = await headers();
    const session = await getSessionSafe(headerList);
    const sessionUser = session?.user;
    if (!sessionUser) {
      return null;
    }

    const rawId = sessionUser.id ?? "";
    const parsed = Number(rawId);
    if (Number.isInteger(parsed) && parsed > 0) {
      const profile = await getUserById(parsed);
      if (profile) {
        return profile;
      }
    }

    const email =
      typeof sessionUser.email === "string" ? sessionUser.email.trim() : "";
    if (email) {
      const profile = await getUserByEmail(email);
      if (profile) {
        return profile;
      }
    }

    const handle =
      (typeof sessionUser.username === "string"
        ? sessionUser.username.trim()
        : "") ||
      (typeof sessionUser.nick === "string" ? sessionUser.nick.trim() : "") ||
      (typeof sessionUser.name === "string" ? sessionUser.name.trim() : "");

    if (handle) {
      return getUser(handle);
    }
  } catch {
    return null;
  }

  return null;
}

export default async function ProfilePage() {
  const user = await getSessionProfile();
  if (!user) {
    redirect("/logowanie");
  }

  return (
    <Page>
      <div className="w-full flex flex-col items-center pt-[170px] pb-20 px-4">
        <div className="w-full max-w-5xl">
          <ProfileView user={user} isOwnProfile />
        </div>
      </div>
    </Page>
  );
}
