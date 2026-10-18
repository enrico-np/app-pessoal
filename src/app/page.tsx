import { Suspense } from "react";
import { Menu, MenuSkeleton } from "@/features/menu/components/Menu";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">App Pessoal</h1>
      <Suspense fallback={<MenuSkeleton />}>
        <Menu />
      </Suspense>
    </main>
  );
}
