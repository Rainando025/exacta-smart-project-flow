import mysql from "mysql2/promise";
import type { Field, Row } from "./types";
import { askAI } from "@/lib/ai";

export interface SqlConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

export interface SqlTableInfo {
  name: string;
  rowCount: number;
  dataSize: number;
  comment?: string;
}

export interface SqlColumnInfo {
  name: string;
  type: string;
  mappedType: "string" | "number" | "date";
  nullable: boolean;
  isPrimary: boolean;
  defaultValue?: string | null;
}

export interface SqlQueryResult {
  columns: Field[];
  rows: Row[];
  totalRows: number;
  executionTimeMs: number;
  truncated: boolean;
}

function createConnectionOptions(cfg: SqlConnectionConfig): mysql.ConnectionOptions {
  return {
    host: cfg.host.trim(),
    port: Number(cfg.port) || 3306,
    user: cfg.user.trim(),
    password: cfg.password || "",
    database: cfg.database.trim(),
    connectTimeout: 8000,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
    multipleStatements: false,
    dateStrings: true,
  };
}

/**
 * Testa a conexão com o banco MariaDB / MySQL
 */
export async function testSqlConnection(cfg: SqlConnectionConfig): Promise<{
  success: boolean;
  version?: string;
  database?: string;
  error?: string;
}> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(createConnectionOptions(cfg));
    const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT VERSION() AS version, DATABASE() AS current_db");
    const first = rows[0] || {};
    return {
      success: true,
      version: String(first.version || "MariaDB / MySQL"),
      database: String(first.current_db || cfg.database),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Falha ao conectar com o banco de dados.",
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Lista todas as tabelas do banco de dados com contagem estimada de linhas
 */
export async function listSqlTables(cfg: SqlConnectionConfig): Promise<SqlTableInfo[]> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(createConnectionOptions(cfg));
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT 
         TABLE_NAME AS name, 
         COALESCE(TABLE_ROWS, 0) AS rowCount, 
         COALESCE(DATA_LENGTH, 0) AS dataSize,
         TABLE_COMMENT AS comment
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME ASC`,
      [cfg.database.trim()]
    );

    return rows.map((r) => ({
      name: String(r.name),
      rowCount: Number(r.rowCount) || 0,
      dataSize: Number(r.dataSize) || 0,
      comment: r.comment ? String(r.comment) : undefined,
    }));
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Obtém as colunas e tipos de uma tabela específica
 */
export async function describeSqlTable(cfg: SqlConnectionConfig, tableName: string): Promise<SqlColumnInfo[]> {
  // Valida nome da tabela para prevenir injeção
  if (!/^[a-zA-Z0-9_$-]+$/.test(tableName)) {
    throw new Error("Nome de tabela inválido.");
  }

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(createConnectionOptions(cfg));
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT 
         COLUMN_NAME AS name, 
         DATA_TYPE AS rawType, 
         COLUMN_TYPE AS fullType,
         IS_NULLABLE AS isNullable, 
         COLUMN_KEY AS columnKey, 
         COLUMN_DEFAULT AS defaultValue
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [cfg.database.trim(), tableName]
    );

    return rows.map((col) => {
      const raw = String(col.rawType || "").toLowerCase();
      let mappedType: "string" | "number" | "date" = "string";

      if (
        [
          "int",
          "tinyint",
          "smallint",
          "mediumint",
          "bigint",
          "decimal",
          "float",
          "double",
          "numeric",
          "real",
        ].includes(raw)
      ) {
        mappedType = "number";
      } else if (["date", "datetime", "timestamp", "time", "year"].includes(raw)) {
        mappedType = "date";
      }

      return {
        name: String(col.name),
        type: String(col.fullType || col.rawType),
        mappedType,
        nullable: col.isNullable === "YES",
        isPrimary: col.columnKey === "PRI",
        defaultValue: col.defaultValue != null ? String(col.defaultValue) : null,
      };
    });
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Executa uma consulta SQL (somente leitura) e retorna dados formatados para o NEXUS BI
 */
export async function executeSqlQuery(
  cfg: SqlConnectionConfig,
  rawQuery: string,
  maxLimit: number = 5000
): Promise<SqlQueryResult> {
  const query = rawQuery.trim();

  // 1. Validação de segurança para garantir apenas leitura (SELECT, SHOW, DESCRIBE, EXPLAIN, WITH)
  const cleanFirstWord = query.replace(/^(\/\*[\s\S]*?\*\/|--[^\n]*\n|\s)+/, "").split(/\s+/)[0]?.toUpperCase();
  const allowed = ["SELECT", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "WITH"];

  if (!allowed.includes(cleanFirstWord)) {
    throw new Error(
      `Operação '${cleanFirstWord}' não permitida. O módulo de BI aceita apenas consultas de leitura (SELECT, SHOW, DESCRIBE, EXPLAIN).`
    );
  }

  // Verifica palavras proibidas de mutação no texto da consulta
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|RENAME|CREATE|REPLACE|GRANT|REVOKE|FLUSH)\b/i;
  if (forbidden.test(query)) {
    throw new Error("Consultas que alteram dados ou estruturas (INSERT, UPDATE, DELETE, DROP, etc.) não são permitidas.");
  }

  // 2. Garante limite para proteger a memória e a rede
  const limitToUse = Math.min(Math.max(1, maxLimit), 50000);
  let finalQuery = query;

  // Se a consulta não possui cláusula LIMIT explícita no final, adiciona o limite padrão
  if (cleanFirstWord === "SELECT" || cleanFirstWord === "WITH") {
    if (!/\bLIMIT\s+\d+/i.test(finalQuery)) {
      finalQuery = `${finalQuery.replace(/;+\s*$/, "")} LIMIT ${limitToUse}`;
    }
  }

  let conn: mysql.Connection | null = null;
  const start = Date.now();

  try {
    conn = await mysql.createConnection(createConnectionOptions(cfg));

    const [rawRows, fieldsInfo] = await conn.query<mysql.RowDataPacket[]>({
      sql: finalQuery,
      rowsAsArray: false,
    });

    const executionTimeMs = Date.now() - start;

    // Se não houver linhas
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      const columns: Field[] = (fieldsInfo || []).map((f) => ({
        name: f.name,
        type: "string",
      }));
      return {
        columns,
        rows: [],
        totalRows: 0,
        executionTimeMs,
        truncated: false,
      };
    }

    // Mapeia colunas e infere tipos com base nos metadados ou na primeira amostra
    const firstRow = rawRows[0] || {};
    const columnNames = Object.keys(firstRow);

    const columns: Field[] = columnNames.map((name) => {
      // Determina tipo a partir dos valores encontrados
      let inferredType: "string" | "number" | "date" = "string";

      for (const row of rawRows.slice(0, 30)) {
        const val = row[name];
        if (val === null || val === undefined) continue;

        if (typeof val === "number") {
          inferredType = "number";
          break;
        }

        if (typeof val === "string") {
          // Verifica se é data ISO ou padrão MySQL (YYYY-MM-DD...)
          if (/^\d{4}-\d{2}-\d{2}/.test(val) && !isNaN(Date.parse(val))) {
            inferredType = "date";
            break;
          }
          // Verifica se é número em formato string sem separador de milhar exótico
          if (/^-?\d+(\.\d+)?$/.test(val.trim())) {
            inferredType = "number";
            break;
          }
        }
      }

      return {
        name,
        type: inferredType,
      };
    });

    // Sanitiza e normaliza linhas (converte BigInt, Date objects, etc.)
    const rows: Row[] = rawRows.map((r) => {
      const rowObj: Row = {};
      for (const col of columns) {
        let val = r[col.name];

        if (val === null || val === undefined) {
          rowObj[col.name] = null;
        } else if (typeof val === "bigint") {
          rowObj[col.name] = Number(val);
        } else if (col.type === "number") {
          const num = Number(val);
          rowObj[col.name] = isNaN(num) ? null : num;
        } else if (val instanceof Date) {
          rowObj[col.name] = val.toISOString().slice(0, 19).replace("T", " ");
        } else if (typeof val === "object") {
          try {
            rowObj[col.name] = JSON.stringify(val);
          } catch {
            rowObj[col.name] = String(val);
          }
        } else {
          rowObj[col.name] = String(val);
        }
      }
      return rowObj;
    });

    return {
      columns,
      rows,
      totalRows: rows.length,
      executionTimeMs,
      truncated: rows.length >= limitToUse,
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}

/**
 * Gera uma consulta SQL via IA com base na pergunta em linguagem natural e nas colunas da tabela
 */
export async function generateSqlWithAI(params: {
  question: string;
  tableName: string;
  columns: SqlColumnInfo[];
  databaseType?: string;
}): Promise<{ sql: string; explanation: string }> {
  const colDetails = params.columns.map((c) => `- ${c.name} (${c.type})`).join("\n");

  const prompt = `
Você é um especialista em banco de dados MariaDB / MySQL e Business Intelligence.
Escreva uma consulta SQL precisa, otimizada e SOMENTE DE LEITURA (SELECT) para responder à seguinte pergunta:

Pergunta do Usuário: "${params.question}"
Tabela Principal: "${params.tableName}"
Esquema de Colunas:
${colDetails}

Regras Obrigatórias:
1. Gere SOMENTE comando SELECT válido para MariaDB / MySQL.
2. NUNCA use comandos de escrita ou alteração (sem DROP, DELETE, UPDATE, INSERT, ALTER).
3. Use nomes exatos de colunas informados acima.
4. Adicione LIMIT 1000 se não houver agregação que restrinja o resultado.
5. Retorne a resposta em formato JSON estrito:
{
  "sql": "SELECT ... FROM ...",
  "explanation": "Explicação curta em português do que a consulta faz"
}
`;

  try {
    const raw = await askAI(prompt, "sql_query_generation");
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      sql: parsed.sql || `SELECT * FROM \`${params.tableName}\` LIMIT 1000;`,
      explanation: parsed.explanation || "Consulta gerada com base nas colunas da tabela.",
    };
  } catch (e: any) {
    return {
      sql: `SELECT * FROM \`${params.tableName}\` LIMIT 1000;`,
      explanation: `Não foi possível interpretar a pergunta pela IA (${e?.message || "falha na resposta"}). Consulta padrão gerada.`,
    };
  }
}
