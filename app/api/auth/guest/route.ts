import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST() {
  try {
    const guestEmail = "guest@focusflow.test";
    
    // 1. 게스트 사용자 조회 혹은 생성
    let user = await prisma.user.findUnique({
      where: { email: guestEmail },
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "게스트 유저",
          email: guestEmail,
          image: "https://api.dicebear.com/7.x/bottts/svg?seed=guest", // 게스트용 봇 아바타
        },
      });
    }
    
    // 2. 가짜 세션 토큰 생성
    const sessionToken = crypto.randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30일 유지
    
    // 3. DB에 세션 저장
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });
    
    // 4. 쿠키 헤더 설정
    const response = NextResponse.json({ success: true });
    
    // NextAuth의 세션 쿠키 이름은 프로덕션/개발 환경에 따라 다릅니다.
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires,
    });
    
    return response;
  } catch (error) {
    console.error("게스트 로그인 에러:", error);
    return NextResponse.json({ error: "게스트 로그인 중 오류가 발생했습니다." }, { status: 500 });
  }
}
