"use client";

import { signIn } from "next-auth/react";

export default function LoginRequired({ message }: { message: string }) {
  return (
    <section className="glass-card rounded-xl p-8 text-center">
      <span className="material-symbols-outlined text-primary text-4xl" aria-hidden="true">
        account_circle
      </span>
      <h2 className="mt-4 font-headline-md text-headline-md text-on-surface">Google 로그인이 필요합니다</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{message}</p>
      <button
        type="button"
        onClick={() => signIn("google")}
        className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-container hover:text-on-primary-container"
      >
        Google로 시작하기
      </button>
    </section>
  );
}
