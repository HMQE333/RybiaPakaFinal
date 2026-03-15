import {
  LucideUsers,
  LucideMessageSquare,
  LucideMessageCircle,
  LucideFlag,
  LucideSettings,
  LucideAlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getAdminStats } from "@/lib/admin";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="stat-card flex items-center gap-4 rounded-2xl border border-white/10 bg-background-2 p-4">
      <div className="rounded-2xl border border-white/10 bg-background-3 p-3 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-sm text-foreground-2">{title}</p>
        <p className="text-xl font-medium">{value}</p>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function ActionButton({ title, description, icon, href }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="interactive-card flex items-start gap-4 rounded-2xl border border-white/10 bg-background-2 p-4 hover:border-accent/40"
    >
      <div className="shrink-0 rounded-2xl border border-white/10 bg-background-3 p-3 text-accent">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-foreground-2">{description}</p>
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Pulpit</h1>
        <p className="text-sm text-foreground-2">
          Zarządzaj społecznością i konfiguracją RybiaPaka.pl.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          Statystyki
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Użytkownicy"
            value={stats.users}
            icon={<LucideUsers size={22} />}
          />
          <StatCard
            title="Posty"
            value={stats.posts}
            icon={<LucideMessageSquare size={22} />}
          />
          <StatCard
            title="Wiadomości (DM)"
            value={stats.messages}
            icon={<LucideMessageCircle size={22} />}
          />
          <StatCard
            title="Aktywne zgłoszenia"
            value={stats.activeReports}
            icon={<LucideFlag size={22} />}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          Skróty
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActionButton
            title="Użytkownicy"
            description="Zmieniaj role użytkowników."
            icon={<LucideUsers size={22} />}
            href="/administracja/uzytkownicy"
          />
          <ActionButton
            title="Zgłoszenia"
            description="Przeglądaj i rozpatruj zgłoszenia użytkowników."
            icon={<LucideFlag size={22} />}
            href="/administracja/zgloszenia"
          />
          <ActionButton
            title="Ustawienia"
            description="Konfiguruj podstawowe ustawienia serwisu."
            icon={<LucideSettings size={22} />}
            href="/administracja/ustawienia"
          />
          <ActionButton
            title="Logi"
            description="Historia działań administracyjnych."
            icon={<LucideAlertCircle size={22} />}
            href="/administracja/logi"
          />
        </div>
      </section>
    </div>
  );
}
