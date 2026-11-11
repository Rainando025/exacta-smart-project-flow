import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeString } from "@/lib/security/sanitizer";
import type { SqlTableInfo, SqlColumnInfo, SqlQueryResult } from "./sql.server";

const connectionSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535).default(3306),
  database: z.string().min(1).max(128),
  user: z.string().min(1).max(128),
  password: z.string().max(255).optional().default(""),
  ssl: z.boolean().optional().default(false),
});

export const testSqlConnectionFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const rateCheck = checkRateLimit("sql_test_conn", 20, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Muitas tentativas de conexão. Aguarde alguns segundos.");
    }
    return connectionSchema.parse(input);
  })
  .handler(async ({ data }): Promise<{ success: boolean; version?: string; database?: string; error?: string }> => {
    const { testSqlConnection } = await import("./sql.server");
    return await testSqlConnection(data);
  });

export const listSqlTablesFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const rateCheck = checkRateLimit("sql_list_tables", 30, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Limite de requisições excedido. Aguarde alguns segundos.");
    }
    return connectionSchema.parse(input);
  })
  .handler(async ({ data }): Promise<SqlTableInfo[]> => {
    const { listSqlTables } = await import("./sql.server");
    return await listSqlTables(data);
  });

export const describeSqlTableFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const schema = connectionSchema.extend({
      table: z.string().min(1).max(128),
    });
    return schema.parse(input);
  })
  .handler(async ({ data }): Promise<SqlColumnInfo[]> => {
    const { describeSqlTable } = await import("./sql.server");
    return await describeSqlTable(data, sanitizeString(data.table));
  });

export const executeSqlQueryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const rateCheck = checkRateLimit("sql_execute_query", 30, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Limite de execuções de SQL excedido. Aguarde alguns segundos.");
    }
    const schema = connectionSchema.extend({
      query: z.string().min(1).max(10000),
      limit: z.number().int().min(1).max(50000).optional().default(5000),
    });
    return schema.parse(input);
  })
  .handler(async ({ data }): Promise<SqlQueryResult> => {
    const { executeSqlQuery } = await import("./sql.server");
    return await executeSqlQuery(data, data.query, data.limit);
  });

export const generateSqlWithAIFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const rateCheck = checkRateLimit("sql_ai_gen", 15, 60000);
    if (!rateCheck.allowed) {
      throw new Error("Limite de gerações de SQL com IA atingido.");
    }
    const schema = z.object({
      question: z.string().min(3).max(500),
      tableName: z.string().min(1).max(128),
      columns: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          mappedType: z.enum(["string", "number", "date"]),
          nullable: z.boolean(),
          isPrimary: z.boolean(),
          defaultValue: z.string().nullable().optional(),
        })
      ),
    });
    return schema.parse(input);
  })
  .handler(async ({ data }): Promise<{ sql: string; explanation: string }> => {
    const { generateSqlWithAI } = await import("./sql.server");
    return await generateSqlWithAI(data);
  });
