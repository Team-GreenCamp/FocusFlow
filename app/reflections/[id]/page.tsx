import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

interface Props {
  params: Promise<{ id: string }>;
}

interface ParsedSection {
  title: string;
  items: string[];
}

function parseMarkdown(md: string) {
  const sections: ParsedSection[] = [];
  const lines = md.split("\n");
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 헤더 매칭 (H1, H2, H3, H4 등 #으로 시작하는 행)
    if (trimmed.startsWith("#")) {
      const titleText = trimmed.replace(/^#+\s*/, "").trim();
      
      // "회고" 성격의 문서 전체 제목(H1/H2 등)은 메인 레이아웃 타이틀로 가므로 개별 섹션에서는 제외합니다.
      const isGlobalTitle = 
        trimmed.startsWith("# ") || 
        (titleText.includes("회고") && (trimmed.startsWith("## ") || titleText.endsWith("회고")));

      if (isGlobalTitle) {
        continue;
      }

      if (currentSection) {
        sections.push(currentSection);
      }
      
      const cleanedTitle = titleText
        .replace(/^[\p{Emoji}\u2000-\u2BFF\s]+/gu, "") // 이모지 제거
        .replace(/^#?\s*/, "") // 남은 샵 기호 제거
        .replace(/^\d+\.\s*/, "") // 리스트 번호 제거
        .trim();

      currentSection = {
        title: cleanedTitle,
        items: []
      };
      continue;
    }

    // 목록 항목 또는 일반 단락 매칭
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      if (currentSection) {
        currentSection.items.push(trimmed.replace(/^[-*]\s*/, "").trim());
      }
    } else {
      if (currentSection) {
        currentSection.items.push(trimmed);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function getSectionStyle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("완료") || t.includes("수행") || t.includes("성공")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/20 dark:border-emerald-500/30",
      icon: "check_circle",
      iconColor: "text-emerald-500",
      accentLine: "bg-emerald-500",
    };
  }
  if (t.includes("잘된") || t.includes("장점") || t.includes("칭찬") || t.includes("만족") || t.includes("피드백") || t.includes("반영")) {
    return {
      bg: "bg-sky-500/5 dark:bg-sky-500/10",
      border: "border-sky-500/20 dark:border-sky-500/30",
      icon: "auto_awesome",
      iconColor: "text-sky-500",
      accentLine: "bg-sky-500",
    };
  }
  // 개선할 점 / 아쉬운 점 / 기타
  return {
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-500/20 dark:border-amber-500/30",
    icon: "lightbulb",
    iconColor: "text-amber-500",
    accentLine: "bg-amber-500",
  };
}

export default async function ReflectionDetailPage({ params }: Props) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  const reflection = await prisma.reflection.findUnique({
    where: { id },
    include: { goal: true },
  });

  if (!reflection || reflection.userId !== userId) {
    notFound();
  }

  const sections = parseMarkdown(reflection.markdown);
  const mainTitle = reflection.goal?.title || "오늘의 업무 회고 피드백";

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(reflection.createdAt));

  return (
    <div className="bg-[#f2f4f6] dark:bg-[#121212] text-[#191f28] dark:text-[#f5f5f7] min-h-screen relative overflow-hidden">
      <Header />

      <main className="relative z-10 pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-3xl mx-auto w-full min-h-screen flex flex-col">
        {/* 상단 축하 문구 */}
        <div className="text-center mt-6 mb-10 flex flex-col items-center">
          <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mb-3">
            업무 종료 및 피드백 완료
          </span>
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-on-surface mb-2 font-bold">
            오늘 하루도 수고하셨습니다!
          </h2>
          <p className="text-on-surface-variant text-sm">
            {formattedDate} 생성된 피드백 리포트입니다.
          </p>
        </div>

        {/* 메인 피드백 리포트 */}
        <section className="glass-card p-6 md:p-8 rounded-3xl border border-outline-variant/30 shadow-xl flex flex-col gap-8 mb-10">
          <div className="border-b border-outline-variant/30 pb-4">
            <span className="text-xs text-secondary font-bold uppercase tracking-wider block mb-1">피드백 대상 업무</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">task_alt</span>
              {mainTitle}
            </h3>
          </div>

          <div className="flex flex-col gap-6">
            {sections.map((section, idx) => {
              const style = getSectionStyle(section.title);
              return (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} p-5 md:p-6 transition-all duration-300 hover:shadow-md`}
                >
                  {/* 좌측 강조 라인 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accentLine}`} />
                  
                  <div className="flex items-center gap-2 mb-4 pl-1">
                    <span className={`material-symbols-outlined ${style.iconColor} text-[22px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {style.icon}
                    </span>
                    <h4 className="font-bold text-on-surface text-base md:text-lg">
                      {section.title}
                    </h4>
                  </div>

                  {section.items.length === 0 ? (
                    <p className="text-sm text-on-surface-variant pl-7">기록된 항목이 없습니다.</p>
                  ) : (
                    <ul className="space-y-3 pl-1">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5 text-sm md:text-body-md text-on-surface-variant leading-relaxed">
                          <span className={`${style.iconColor} text-xs mt-1 shrink-0`}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* 작성한 한 줄 메모 */}
          {reflection.memo && (
            <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-5 mt-2">
              <span className="text-xs text-outline font-bold uppercase tracking-wider block mb-2">내가 남긴 회고 메모</span>
              <p className="text-sm text-on-surface leading-relaxed italic">
                &ldquo; {reflection.memo} &rdquo;
              </p>
            </div>
          )}
        </section>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/"
            className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all text-center"
          >
            새로운 업무 구체화하기
          </Link>
          <Link
            href="/vault"
            className="w-full sm:w-auto border border-outline-variant text-on-surface bg-white/40 dark:bg-black/20 backdrop-blur-sm px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-all text-center"
          >
            회고 보관소로 이동
          </Link>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
