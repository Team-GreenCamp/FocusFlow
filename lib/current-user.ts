import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id ?? null;

  if (!userId) {
    const { prisma } = await import("@/lib/prisma");
    const guestEmail = "guest@focusflow.test";
    const guestUser = await prisma.user.findUnique({
      where: { email: guestEmail },
      select: { id: true },
    });

    if (guestUser) {
      userId = guestUser.id;
    } else {
      const newGuest = await prisma.user.create({
        data: {
          name: "게스트 유저",
          email: guestEmail,
          image: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
        },
        select: { id: true },
      });
      userId = newGuest.id;
    }
  }

  return userId;
}
