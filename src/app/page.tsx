import { Settings } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { IconButton, PageHeader } from "@/components/ui";
import { HistorySection, PanelsSection, PinsSection } from "@/features/home/components/sections";
import { SettingsButton } from "@/features/settings/components/SettingsButton";
import { formatLongDate } from "@/lib/format";

async function Today() {
  await connection();
  return <>{formatLongDate(new Date())}</>;
}

function Divider() {
  return <hr className="border-t border-border" />;
}

function Placeholder({ h }: { h: string }) {
  return <div aria-hidden="true" className={`${h} animate-pulse rounded-card bg-foreground/10`} />;
}

export default function Home() {
  return (
    <>
      <PageHeader
        title="Início"
        subtitle={
          <Suspense fallback=" ">
            <Today />
          </Suspense>
        }
        actions={
          <Suspense fallback={<IconButton label="Ajustes" disabled><Settings aria-hidden="true" /></IconButton>}>
            <SettingsButton />
          </Suspense>
        }
      />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-32">
        <Suspense fallback={<Placeholder h="h-24" />}>
          <PinsSection />
        </Suspense>
        <Divider />
        <Suspense fallback={<Placeholder h="h-40" />}>
          <PanelsSection />
        </Suspense>
        <Divider />
        <Suspense fallback={<Placeholder h="h-32" />}>
          <HistorySection />
        </Suspense>
      </main>
    </>
  );
}
