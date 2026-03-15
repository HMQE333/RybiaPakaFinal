import { headers } from "next/headers";

import Page from "@/components/Page";
import { getViewerFromHeaders, isAdminRole } from "@/lib/adminAccess";
import DiscussionHero from "./components/DiscussionHero";
import ChannelGrid from "./components/ChannelGrid";

export default async function DyskusjePage() {
  const viewer = await getViewerFromHeaders(
    await headers()
  ).catch(() => null);
  const isAdmin = viewer ? isAdminRole(viewer.role) : false;

  return (
    <Page>
      <main className="w-full flex flex-col items-center pt-[180px] pb-16 px-4">
        <section className="w-full max-w-6xl space-y-8">
          <DiscussionHero />
          <ChannelGrid isAdmin={isAdmin} />
        </section>
      </main>
    </Page>
  );
}
