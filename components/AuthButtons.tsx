import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs font-semibold text-on-surface-variant">확인 중</span>;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/95 hover:scale-105 active:scale-95 duration-200 inline-block text-center"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.image ? (
        <img
          alt="User Profile Avatar"
          className="h-8 w-8 rounded-full border border-outline-variant object-cover"
          src={session.user.image}
        />
      ) : null}
      <span className="hidden max-w-32 truncate text-xs font-semibold text-on-surface-variant sm:inline">
        {session.user.name ?? session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface-variant transition hover:bg-surface-container-low"
      >
        로그아웃
      </button>
    </div>
  );
}
