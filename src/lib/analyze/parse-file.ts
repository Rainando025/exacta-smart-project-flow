import * as XLSX from "xlsx";
import type { Dataset, Row } from "./types";
import { inferFields } from "./aggregate";

export function parseCsvText(text: string): Row[] {
  const delim = detectDelimiter(text);
  const lines = splitRows(text);
  if (!lines.length) return [];
  const header = (lines[0] ?? []).map((h, i) => h.trim() || `col_${i + 1}`);
  return lines.slice(1).map((cells) => {
    const row: Row = {};
    header.forEach((h, i) => {
      const raw = (cells[i] ?? "").trim();
      row[h] = raw === "" ? null : raw;
    });
    return row;
  });

  function detectDelimiter(t: string) {
    const first = t.split(/\r?\n/)[0] ?? "";
    const counts: Array<[string, number]> = [";", ",", "\t", "|"].map((d) => [d, first.split(d).length]);
    counts.sort((a, b) => b[1] - a[1]);
    const best = counts[0];
    return best && best[1] > 1 ? best[0] : ",";
  }

  function splitRows(t: string): string[][] {
    const out: string[][] = [];
    let cur: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i] as string;
      if (quoted) {
        if (c === '"') {
          if (t[i + 1] === '"') {
            field += '"';
            i++;
          } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) {
        cur.push(field);
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        out.push(cur);
        cur = [];
        field = "";
      } else if (c !== "\r") field += c;
    }
    if (field !== "" || cur.length) {
      cur.push(field);
      out.push(cur);
    }
    return out.filter((r) => r.some((v) => v.trim() !== ""));
  }
}

export function parseWorkbook(buf: ArrayBuffer): Row[] {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return [];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
  return json.map((r) => {
    const row: Row = {};
    Object.entries(r).forEach(([k, v]) => {
      row[String(k).trim()] = v === null || v === undefined ? null : (v as string | number);
    });
    return row;
  });
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function buildDataset(name: string, rows: Row[]): Dataset {
  const clean = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== ""));
  return { name, rows: clean, fields: inferFields(clean) };
}

function rowKey(r: Row): string {
  return Object.keys(r)
    .sort()
    .map((k) => `${k}=${String(r[k] ?? "")}`)
    .join("|");
}

/** Acumula novos registros em um dataset existente, sem duplicar linhas idênticas. */
export function mergeDataset(
  base: Dataset,
  name: string,
  rows: Row[],
): { dataset: Dataset; added: number; duplicates: number } {
  const clean = rows.filter((r) => Object.values(r).some((v) => v !== null && v !== ""));
  const seen = new Set(base.rows.map(rowKey));
  const fresh: Row[] = [];
  let duplicates = 0;
  for (const r of clean) {
    const k = rowKey(r);
    if (seen.has(k)) {
      duplicates++;
      continue;
    }
    seen.add(k);
    fresh.push(r);
  }
  const allRows = [...base.rows, ...fresh];
  const sources = Array.from(new Set([...(base.sources ?? [base.name]), name]));
  return {
    dataset: {
      name: sources.length > 1 ? `${sources.length} arquivos` : name,
      rows: allRows,
      fields: inferFields(allRows),
      sources,
    },
    added: fresh.length,
    duplicates,
  };
}
