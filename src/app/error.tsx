"use client";
import { Button } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="mb-4 font-heading text-2xl">
        페이지를 불러오지 못했어요.
      </h1>
      <p className="mb-8 text-muted">잠시 후 다시 시도해 주세요.</p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  );
}
