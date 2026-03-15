import Marquee from "@/components/Marquee";
import { listReviews } from "@/lib/reviewsStore";
import Review from "./Review";

export default async function Reviews() {
  const reviews = await listReviews();
  if (reviews.length === 0) return null;

  return (
    <section className="w-full py-20 bg-[var(--background)] overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
          Co mówią nasi użytkownicy?
        </h2>
        <p className="text-[var(--foreground-2)]">
          Prawdziwe opinie z naszej społeczności.
        </p>
      </div>

      <div className="relative flex h-[250px] w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background">
        <Marquee pauseOnHover className="[--duration:40s]">
          {reviews.map((review) => (
            <Review key={review.id} review={review} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[var(--background)]"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[var(--background)]"></div>
      </div>
    </section>
  );
}
