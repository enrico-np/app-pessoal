import type { Metadata } from "next";
import { Suspense } from "react";
import { readLayout } from "@/features/home/data";
import { EditHome } from "@/features/home/components/edit/EditHome";
import { readSettings } from "@/features/settings/data";

export const metadata: Metadata = { title: "Editar início · App Pessoal" };

async function Editor({ searchParams }: { searchParams: PageProps<"/editar">["searchParams"] }) {
  const [layout, settings, params] = await Promise.all([readLayout(), readSettings(), searchParams]);
  return (
    <EditHome
      layout={layout}
      pinsOrder={settings.pins_order}
      historyCount={settings.history_count}
      openAddPanel={params.adicionar === "1"}
    />
  );
}

// Edit mode is its own route (spec 002 proposed /?editar=1): a Server Component page reads the layout
// directly, and the bottom bar is hidden here (BottomNav HIDDEN_ON).
export default function EditPage({ searchParams }: PageProps<"/editar">) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Carregando…</p>}>
      <Editor searchParams={searchParams} />
    </Suspense>
  );
}
