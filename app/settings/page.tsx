"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

export default function SettingsPage() {
  const { data: session } = useSession();

  const [workViewSettings, setWorkViewSettings] = useState({
    calendarDays: 7,
    visibleActiveTasks: 5,
    visibleCalendarEvents: 10,
    visibleCompletedTasks: 5,
  });

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("focusflow-settings");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        workViewSettings?: typeof workViewSettings;
        theme?: "light" | "dark";
        soundEnabled?: boolean;
      };

      if (parsed.workViewSettings) setWorkViewSettings(parsed.workViewSettings);
      if (parsed.theme) setTheme(parsed.theme);
      if (typeof parsed.soundEnabled === "boolean") setSoundEnabled(parsed.soundEnabled);
    } catch {
      setSaveMessage("저장된 설정을 읽지 못했습니다.");
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // 서버 사용자 계정이 붙기 전까지 설정은 브라우저에 저장합니다.
    window.localStorage.setItem(
      "focusflow-settings",
      JSON.stringify({ workViewSettings, theme, soundEnabled }),
    );

    // [기존 주석 보존] 저장하기 버튼을 누를 때 테마 설정을 최종적으로 화면에 반영합니다.
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    setSaveMessage("설정이 이 브라우저에 저장되었습니다.");
  };

  return (
    <div className="bg-[#f2f4f6] dark:bg-[#121212] text-[#191f28] dark:text-[#f5f5f7] min-h-screen">
      {/* Header */}
      <Header />



      {/* Main Content Canvas */}
      <main className="pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-3xl mx-auto w-full min-h-screen">
        <header className="mb-10">
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-on-surface mb-2">
            설정
          </h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg">
            업무 구체화, 회고, 피드백 생성 방식을 사용자에 맞게 조정하세요.
          </p>
        </header>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {saveMessage ? (
            <p className="rounded-md bg-secondary-container px-4 py-3 text-sm font-semibold text-on-secondary-container">
              {saveMessage}
            </p>
          ) : null}

          {/* Profile Section */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_circle</span>
              연동된 Google 계정 정보
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-[#f2f4f6] dark:bg-[#003d2a]/10 overflow-hidden border border-[#edf1f5] dark:border-[#00C896]/10">
                  <img
                    alt="User Profile Avatar"
                    className="w-full h-full object-cover"
                    src={session?.user?.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name ?? "User")}&background=00C896&color=fff`}
                  />
                </div>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    이름
                  </span>
                  <div className="w-full max-w-md bg-[#e0fdf4]/30 dark:bg-[#003d2a]/10 border border-[#00C896]/20 dark:border-[#00C896]/10 rounded-lg px-4 py-2.5 text-on-surface font-medium select-none">
                    {session?.user?.name ?? "로그인 정보 없음"}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    이메일 주소
                  </span>
                  <div className="w-full max-w-md bg-[#e0fdf4]/30 dark:bg-[#003d2a]/10 border border-[#00C896]/20 dark:border-[#00C896]/10 rounded-lg px-4 py-2.5 text-on-surface font-medium select-none">
                    {session?.user?.email ?? "계정 정보가 없습니다."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work View Config Section */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">dashboard</span>
              내 업무 화면 설정
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  캘린더 조회 기간 (일)
                </label>
                <select
                  className="w-full max-w-md bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 rounded-lg px-4 py-2.5 text-on-surface dark:text-[#f5f5f7] focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={workViewSettings.calendarDays}
                  onChange={(e) =>
                    setWorkViewSettings({ ...workViewSettings, calendarDays: parseInt(e.target.value) })
                  }
                >
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={3}>3일</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={7}>7일 (기본)</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={14}>14일</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  진행 중 작업 표시 수
                </label>
                <select
                  className="w-full max-w-md bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 rounded-lg px-4 py-2.5 text-on-surface dark:text-[#f5f5f7] focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={workViewSettings.visibleActiveTasks}
                  onChange={(e) =>
                    setWorkViewSettings({ ...workViewSettings, visibleActiveTasks: parseInt(e.target.value) })
                  }
                >
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={3}>3개</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={5}>5개 (기본)</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={10}>10개</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  캘린더 일정 표시 수
                </label>
                <select
                  className="w-full max-w-md bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 rounded-lg px-4 py-2.5 text-on-surface dark:text-[#f5f5f7] focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={workViewSettings.visibleCalendarEvents}
                  onChange={(e) =>
                    setWorkViewSettings({ ...workViewSettings, visibleCalendarEvents: parseInt(e.target.value) })
                  }
                >
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={5}>5개</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={10}>10개 (기본)</option>
                  <option className="bg-white dark:bg-neutral-800 text-on-surface dark:text-[#f5f5f7]" value={20}>20개</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  완료 업무 표시 수
                </label>
                <input
                  className="w-full max-w-md bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 rounded-lg px-4 py-2.5 text-on-surface dark:text-[#f5f5f7] focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  type="number"
                  min="1"
                  max="20"
                  value={workViewSettings.visibleCompletedTasks}
                  onChange={(e) =>
                    setWorkViewSettings({ ...workViewSettings, visibleCompletedTasks: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* General Preferences */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              일반 설정
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">테마 설정</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">앱 화면 색상 테마</p>
                </div>
                <div className="flex border border-[#00C896]/20 dark:border-[#00C896]/10 rounded-lg overflow-hidden bg-[#e0fdf4]/50 dark:bg-[#003d2a]/20">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`px-3 py-1.5 text-xs font-semibold ${
                      theme === "light" ? "bg-primary text-white" : "text-on-surface-variant"
                    }`}
                  >
                    라이트
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`px-3 py-1.5 text-xs font-semibold ${
                      theme === "dark" ? "bg-primary text-white" : "text-on-surface-variant"
                    }`}
                  >
                    다크
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">효과음 및 소리</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">업무 기록 완료 시 효과음 알림</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-[#003d2a]/30 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all text-center"
          >
            설정 저장하기
          </button>
        </form>
      </main>

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
