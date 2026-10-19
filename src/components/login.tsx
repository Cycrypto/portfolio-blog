"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Asterisk, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button, Field, inputClass, request } from "./ui";
export function Login({ localHint }: { localHint: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main
      id="main"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"
    >
      <Link
        href="/blog"
        className="mb-12 inline-flex items-center gap-2 text-xs text-muted"
      >
        <ArrowLeft size={14} />
        Journal로 돌아가기
      </Link>
      <Asterisk size={32} className="mb-6 text-coral" />
      <p className="mb-3 font-mono text-xs tracking-widest text-accent">
        YOUR WRITING SPACE
      </p>
      <h1 className="mb-4 font-display text-4xl">Welcome back.</h1>
      <p className="mb-8 text-sm leading-relaxed text-muted">
        작성자 전용 공간입니다.
        <br />
        게시글과 시리즈를 관리하려면 로그인해 주세요.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await request("/api/auth", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            router.push("/admin");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-6"
      >
        <Field label="관리자 비밀번호" id="password" error={error}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={busy}
              aria-invalid={!!error}
              aria-describedby={error ? "password-description" : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-0 right-0 flex size-11 items-center justify-center rounded text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Button type="submit" loading={busy} className="w-full">
          로그인
          <ArrowRight size={16} />
        </Button>
      </form>
      {localHint && (
        <div className="mt-8 border-t border-line pt-5 text-xs leading-loose text-muted">
          로컬 개발 로그인:{" "}
          <code className="font-mono text-ink">local-portfolio</code>
          <br />
          개인 비밀번호는 <code className="font-mono">.env.local</code>의
          ADMIN_PASSWORD에 설정하세요.
        </div>
      )}
    </main>
  );
}
