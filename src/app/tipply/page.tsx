import { redirect } from "next/navigation";
import { forumUrls } from "@/const";

export default function FinancialSupportPage() {
  redirect(forumUrls.tipply);
}
