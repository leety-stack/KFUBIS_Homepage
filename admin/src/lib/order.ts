import { pb } from "./pb";

/** 끌어서 놓은 순서대로 sort 값을 10, 20, 30… 으로 다시 저장 (바뀐 것만) */
export async function saveOrder(collection: string, ids: string[], current: Record<string, number>) {
  for (let i = 0; i < ids.length; i++) {
    const s = (i + 1) * 10;
    if (current[ids[i]] !== s) await pb.collection(collection).update(ids[i], { sort: s });
  }
}
export function move<T>(list: T[], from: number, to: number): T[] {
  const a = list.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
}
/** 끌어서 순서 바꾸기용 속성 */
export function dragProps(i: number, drag: { from: number | null; setFrom: (n: number | null) => void; onDrop: (from: number, to: number) => void; enabled: boolean }) {
  if (!drag.enabled) return {};
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => { drag.setFrom(i); e.dataTransfer.effectAllowed = "move"; (e.currentTarget as HTMLElement).classList.add("drag"); },
    onDragEnd: (e: React.DragEvent) => { drag.setFrom(null); (e.currentTarget as HTMLElement).classList.remove("drag"); },
    onDragOver: (e: React.DragEvent) => { if (drag.from !== null) { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add("over"); } },
    onDragLeave: (e: React.DragEvent) => (e.currentTarget as HTMLElement).classList.remove("over"),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.remove("over"); if (drag.from !== null && drag.from !== i) drag.onDrop(drag.from, i); },
  };
}
