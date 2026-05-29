import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // 캘린더 읽기 권한까지 함께 요청해 일정 기반 피드백을 만들 수 있게 합니다.
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        // 클라이언트와 API에서 같은 사용자 ID로 업무 데이터를 필터링합니다.
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return;
      }

      // 재동의로 받은 최신 scope/access token을 기존 Google 계정 레코드에 반영합니다.
      await prisma.account.updateMany({
        where: {
          provider: "google",
          providerAccountId: account.providerAccountId,
        },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
    },
  },
  pages: {
    signIn: "/",
  },
};
