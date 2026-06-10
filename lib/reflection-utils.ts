export interface ParsedSection {
  title: string;
  items: string[];
}

export function parseMarkdown(md: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = md.split("\n");
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 헤더 매칭 (H1, H2, H3, H4 등 #으로 시작하는 행)
    if (trimmed.startsWith("#")) {
      const titleText = trimmed.replace(/^#+\s*/, "").trim();
      
      // "회고" 제목의 경우 전체 템플릿 정보(H1/H2 등)는 제외 목록에 넣어서 레이아웃 타이틀로 중복 출력되는 것을 방지합니다.
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

export function getSectionStyle(title: string) {
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
