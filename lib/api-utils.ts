export async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const rawText = await response.text();
  let data = { error: "빈 응답을 받았습니다." } as T & { error?: string };
  if (rawText) {
    try {
      data = JSON.parse(rawText) as T & { error?: string };
    } catch {
      data = { error: "서버가 JSON이 아닌 응답을 반환했습니다." } as T & { error?: string };
    }
  }
  if (!response.ok) {
    throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  }
  return data;
}
