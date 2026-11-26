import { useEffect, useRef } from "react";
import { fileUrl, toInputDate, type Rec } from "../lib/pb";

export type FieldType = "text" | "area" | "select" | "year" | "bool" | "date" | "image" | "files" | "editor";
export interface FieldDef {
  name: string; label: string; type: FieldType;
  options?: string[]; required?: boolean; full?: boolean; placeholder?: string; help?: string;
  multiple?: boolean; // files
}

/** 폼 값: 일반 값, 새로 고른 파일(File / File[]), 지울 파일 목록(`name-`) */
export type FormVals = Record<string, any>;

export function Field({ f, vals, set, rec, disabled }: { f: FieldDef; vals: FormVals; set: (k: string, v: any) => void; rec?: Rec; disabled?: boolean }) {
  const v = vals[f.name];
  const full = f.full || ["area", "editor", "image", "files", "bool"].includes(f.type);
  const id = "f_" + f.name;
  let input: React.ReactNode;
  switch (f.type) {
    case "select":
      input = <select id={id} value={v ?? ""} disabled={disabled} onChange={(e) => set(f.name, e.target.value)}>{!f.required && <option value="">선택</option>}{f.options!.map((o) => <option key={o}>{o}</option>)}</select>; break;
    case "year": {
      const ys: number[] = []; for (let y = new Date().getFullYear() + 1; y >= 1947; y--) ys.push(y);
      input = <select id={id} value={v || ""} disabled={disabled} onChange={(e) => set(f.name, e.target.value ? Number(e.target.value) : null)}><option value="">연도 선택</option>{ys.map((y) => <option key={y}>{y}</option>)}</select>; break;
    }
    case "date":
      input = <input id={id} type="date" value={toInputDate(v)} disabled={disabled} onChange={(e) => set(f.name, e.target.value)} />; break;
    case "area":
      input = <textarea id={id} value={v ?? ""} disabled={disabled} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />; break;
    case "bool":
      return <div className="f full"><label className="ck"><input type="checkbox" checked={!!v} disabled={disabled} onChange={(e) => set(f.name, e.target.checked)} /> {f.label}</label>{f.help && <span className="help">{f.help}</span>}</div>;
    case "editor":
      input = <Editor value={v ?? ""} onChange={(h) => set(f.name, h)} disabled={disabled} />; break;
    case "image":
      input = <ImageInput f={f} vals={vals} set={set} rec={rec} disabled={disabled} />; break;
    case "files":
      input = <FilesInput f={f} vals={vals} set={set} rec={rec} disabled={disabled} />; break;
    default:
      input = <input id={id} value={v ?? ""} disabled={disabled} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
  }
  return (
    <div className={"f" + (full ? " full" : "")}>
      <label htmlFor={id}>{f.required && <i>* </i>}{f.label}</label>
      {input}
      {f.help && <span className="help">{f.help}</span>}
    </div>
  );
}

function ImageInput({ f, vals, set, rec, disabled }: { f: FieldDef; vals: FormVals; set: (k: string, v: any) => void; rec?: Rec; disabled?: boolean }) {
  const picked: File | undefined = vals[f.name + "__new"];
  const removed = vals[f.name] === "";
  const cur = rec?.[f.name] && !removed ? fileUrl(rec, rec[f.name], "400x300") : "";
  const [preview, setPreview] = usePreview(picked);
  void setPreview;
  return (
    <div className="imgin">
      {(preview || cur) ? <img src={preview || cur} alt="" /> : <div className="noimg">사진 없음</div>}
      <div className="imgbtns">
        <label className="btn sm">{cur || preview ? "바꾸기" : "사진 올리기"}<input type="file" accept="image/*" hidden disabled={disabled} onChange={(e) => { const x = e.target.files?.[0]; if (x) set(f.name + "__new", x); }} /></label>
        {(cur || preview) && <button type="button" className="btn sm ghost" disabled={disabled} onClick={() => { set(f.name + "__new", undefined); set(f.name, ""); }}>지우기</button>}
        <span className="help">JPG·PNG 15MB까지 · PC·모바일 크기 자동 생성</span>
      </div>
    </div>
  );
}
function usePreview(file?: File): [string, (s: string) => void] {
  const ref = useRef("");
  useEffect(() => () => { if (ref.current) URL.revokeObjectURL(ref.current); }, []);
  if (file) { if (ref.current) URL.revokeObjectURL(ref.current); ref.current = URL.createObjectURL(file); return [ref.current, () => {}]; }
  return ["", () => {}];
}

function FilesInput({ f, vals, set, rec, disabled }: { f: FieldDef; vals: FormVals; set: (k: string, v: any) => void; rec?: Rec; disabled?: boolean }) {
  const existing: string[] = ([] as string[]).concat(rec?.[f.name] || []).filter(Boolean);
  const del: string[] = vals[f.name + "__del"] || [];
  const added: File[] = vals[f.name + "__new"] || [];
  return (
    <div className="filesin">
      {existing.filter((n) => !del.includes(n)).map((n) => (
        <div key={n} className="fi"><a href={fileUrl(rec!, n)} target="_blank" rel="noreferrer">📎 {n.replace(/_[a-z0-9]{10}(\.\w+)$/i, "$1")}</a>{!disabled && <button type="button" className="btn sm ghost" onClick={() => set(f.name + "__del", [...del, n])}>지우기</button>}</div>
      ))}
      {added.map((x, i) => <div key={i} className="fi"><span>➕ {x.name}</span><button type="button" className="btn sm ghost" onClick={() => set(f.name + "__new", added.filter((_, j) => j !== i))}>빼기</button></div>)}
      {!disabled && <label className="drop">파일을 눌러서 선택 · PDF·HWP·ZIP 50MB까지<input type="file" hidden multiple={f.multiple} onChange={(e) => { const xs = Array.from(e.target.files || []); set(f.name + "__new", f.multiple ? [...added, ...xs] : xs.slice(0, 1)); e.target.value = ""; }} /></label>}
    </div>
  );
}

/** 간단한 글 편집기 — 굵게·기울임·제목·목록·링크 */
function Editor({ value, onChange, disabled }: { value: string; onChange: (h: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, [value]);
  const cmd = (c: string, arg?: string) => { document.execCommand(c, false, arg); ref.current && onChange(ref.current.innerHTML); ref.current?.focus(); };
  return (
    <div className="rte">
      <div className="rte-b">
        <button type="button" onClick={() => cmd("bold")}><b>B</b></button>
        <button type="button" onClick={() => cmd("italic")}><i>I</i></button>
        <button type="button" onClick={() => cmd("formatBlock", "h3")}>제목</button>
        <button type="button" onClick={() => cmd("formatBlock", "p")}>본문</button>
        <button type="button" onClick={() => cmd("insertUnorderedList")}>목록</button>
        <button type="button" onClick={() => { const u = prompt("링크 주소"); if (u) cmd("createLink", u); }}>링크</button>
      </div>
      <div ref={ref} className="rte-a" contentEditable={!disabled} suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, t); }} />
    </div>
  );
}

/** 폼 값 → PocketBase 저장 형식 (사진 교체·삭제, 첨부 추가·삭제, 날짜 변환) */
export function buildBody(fields: FieldDef[], vals: FormVals, rec?: Rec): Record<string, any> {
  const body: Record<string, any> = {};
  for (const f of fields) {
    const v = vals[f.name];
    if (f.type === "image") {
      if (vals[f.name + "__new"]) body[f.name] = vals[f.name + "__new"];
      else if (v === "" && rec?.[f.name]) body[f.name] = null;
    } else if (f.type === "files") {
      const added: File[] = vals[f.name + "__new"] || []; const del: string[] = vals[f.name + "__del"] || [];
      if (f.multiple) { if (added.length) body[f.name + "+"] = added; if (del.length) body[f.name + "-"] = del; }
      else { if (added.length) body[f.name] = added[0]; else if (del.length) body[f.name] = null; }
    } else if (f.type === "date") body[f.name] = v && v.length === 10 ? `${v} 00:00:00.000Z` : v || "";
    else body[f.name] = v ?? "";
  }
  return body;
}
export const initVals = (fields: FieldDef[], rec?: Rec): FormVals =>
  Object.fromEntries(fields.map((f) => [f.name, rec ? rec[f.name] : f.type === "bool" ? false : f.type === "select" && f.required ? f.options![0] : ""]));
