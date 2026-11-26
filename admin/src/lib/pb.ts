import PocketBase, { type RecordModel } from "pocketbase";

// 개발: vite가 /api 를 PocketBase(8095)로 넘김. 운영: 같은 주소에서 /api 를 서비스
export const pb = new PocketBase(import.meta.env.VITE_PB_URL || window.location.origin);
pb.autoCancellation(false);

export type Rec = RecordModel & Record<string, any>;

/** PocketBase 날짜("2025-11-20 00:00:00.000Z") ↔ 달력 입력("2025-11-20") */
export const toInputDate = (v?: string) => (v ? v.slice(0, 10) : "");
export const fromInputDate = (v: string) => (v ? `${v} 00:00:00.000Z` : "");
export const showDate = (v?: string) => (v ? v.slice(0, 10).replace(/-/g, ".") : "");

export const fileUrl = (rec: Rec, name?: string, thumb?: string) =>
  name ? pb.files.getURL(rec, name, thumb ? { thumb } : undefined) : "";

/** 에러 메시지를 사람이 읽을 수 있게 */
export function errText(e: any): string {
  const d = e?.response?.data;
  if (d && typeof d === "object") {
    const first = Object.entries(d)[0] as [string, any] | undefined;
    if (first) return `${first[0]}: ${first[1]?.message ?? "값을 확인하세요"}`;
  }
  return e?.response?.message || e?.message || "알 수 없는 오류";
}
