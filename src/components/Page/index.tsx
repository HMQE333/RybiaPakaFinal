import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormPage from "./FormPage";

interface PageProps {
  type?: "default" | "form";
  header?: boolean;
  children?: React.ReactNode;
}

export default function Page({
  type = "default",
  header = true,
  children,
}: PageProps) {
  if (type === "form") {
    return <FormPage header={header}>{children}</FormPage>;
  }

  return (
    <div className="w-full min-h-[100svh] flex flex-col">
      {header && <Header />}
      {children}
      <Footer />
    </div>
  );
}
