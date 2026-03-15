import { Suspense } from "react";
import ForumFeed from "@/app/forum/components/ForumFeed";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-[180px] pb-10">
        <Suspense fallback={null}>
          <ForumFeed />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
