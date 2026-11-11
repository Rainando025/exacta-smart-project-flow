import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Table as TableIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  Trash2,
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
  Server,
  KeyRound,
  ShieldCheck,
  Search,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import {
  testSqlConnectionFn,
  listSqlTablesFn,
  describeSqlTableFn,
  executeSqlQueryFn,
  generateSqlWithAIFn,
} from "@/lib/analyze/sql.functions";
import type { SqlTableInfo, SqlColumnInfo, SqlQueryResult } from "@/lib/analyze/sql.server";
import type { Dataset, Field, Row } from "@/lib/analyze/types";

export interface SavedSqlConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

const STORAGE_SAVED_CONNECTIONS = "nexus_bi_saved_sql_connections";

interface SqlDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportDataset: (dataset: Dataset, mode: "create" | "append") => void;
  currentPageName?: string;
}

export function SqlDatabaseDialog({
  open,
  onOpenChange,
  onImportDataset,
  currentPageName,
}: SqlDatabaseDialogProps) {
  // Connection Form State
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(3306);
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("root");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);
  const [connectionName, setConnectionName] = useState("");

  // Saved Connections
  const [savedConnections, setSavedConnections] = useState<SavedSqlConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"connection" | "explorer">("connection");

  // State for Tables & Schema
  const [testingConnection, setTestingConnection] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [tables, setTables] = useState<SqlTableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [searchTable, setSearchTable] = useState("");

  // Selected Table & Query
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<SqlColumnInfo[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [queryMode, setQueryMode] = useState<"table" | "custom" | "ai">("table");
  const [customQuery, setCustomQuery] = useState("");
  const [limit, setLimit] = useState(5000);
  const [targetMode, setTargetMode] = useState<"create" | "append">("create");

  // AI SQL Assistant
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [generatingAiSql, setGeneratingAiSql] = useState(false);

  // Preview & Execution
  const [previewData, setPreviewData] = useState<SqlQueryResult | null>(null);
  const [executingQuery, setExecutingQuery] = useState(false);

  // Load saved connections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_CONNECTIONS);
      if (saved) {
        const parsed: SavedSqlConnection[] = JSON.parse(saved);
        setSavedConnections(parsed);
        if (parsed.length > 0 && !selectedConnectionId) {
          const first = parsed[0];
          setSelectedConnectionId(first.id);
          applySavedConnection(first);
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar conexões SQL salvas:", e);
    }
  }, []);

  const applySavedConnection = (conn: SavedSqlConnection) => {
    setHost(conn.host);
    setPort(conn.port);
    setDatabase(conn.database);
    setUser(conn.user);
    setPassword(conn.password || "");
    setSsl(!!conn.ssl);
    setConnectionName(conn.name);
  };

  const handleSaveConnection = () => {
    if (!database.trim() || !host.trim()) {
      toast.error("Informe pelo menos o Host e o Banco de Dados.");
      return;
    }
    const nameToUse = connectionName.trim() || `${database} (${host})`;
    const newConn: SavedSqlConnection = {
      id: `conn-${Date.now()}`,
      name: nameToUse,
      host: host.trim(),
      port: Number(port) || 3306,
      database: database.trim(),
      user: user.trim(),
      password,
      ssl,
    };

    const updated = [newConn, ...savedConnections.filter((c) => c.name !== nameToUse)];
    setSavedConnections(updated);
    setSelectedConnectionId(newConn.id);
    try {
      localStorage.setItem(STORAGE_SAVED_CONNECTIONS, JSON.stringify(updated));
      toast.success("Conexão salva com sucesso!", { description: nameToUse });
    } catch {}
  };

  const handleDeleteSavedConnection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedConnections.filter((c) => c.id !== id);
    setSavedConnections(updated);
    if (selectedConnectionId === id) setSelectedConnectionId("");
    try {
      localStorage.setItem(STORAGE_SAVED_CONNECTIONS, JSON.stringify(updated));
      toast.info("Conexão removida.");
    } catch {}
  };

  const connectionPayload = useMemo(
    () => ({
      host: host.trim(),
      port: Number(port) || 3306,
      database: database.trim(),
      user: user.trim(),
      password,
      ssl,
    }),
    [host, port, database, user, password, ssl]
  );

  const handleTestConnection = async (goToExplorerOnSuccess = false) => {
    if (!host.trim() || !database.trim()) {
      toast.error("Preencha o Host e o Banco de Dados.");
      return;
    }

    setTestingConnection(true);
    setServerVersion(null);
    try {
      const res = await testSqlConnectionFn({ data: connectionPayload });
      if (res.success) {
        setServerVersion(res.version || "MariaDB / MySQL");
        toast.success("Conexão estabelecida com sucesso!", {
          description: `Servidor: ${res.version || "MariaDB/MySQL"} · Banco: ${res.database || database}`,
        });
        if (goToExplorerOnSuccess) {
          setActiveTab("explorer");
          void fetchTables();
        }
      } else {
        toast.error("Erro na conexão SQL", { description: res.error });
      }
    } catch (e: any) {
      toast.error("Falha ao testar conexão", { description: e?.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setTables([]);
    try {
      const data = await listSqlTablesFn({ data: connectionPayload });
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        handleSelectTable(data[0].name);
      }
    } catch (e: any) {
      toast.error("Erro ao listar tabelas", { description: e?.message });
    } finally {
      setLoadingTables(false);
    }
  };

  const handleSelectTable = async (tName: string) => {
    setSelectedTable(tName);
    setLoadingColumns(true);
    setCustomQuery(`SELECT * FROM \`${tName}\` LIMIT ${limit};`);
    setAiQuestion("");
    setAiExplanation(null);
    setPreviewData(null);

    try {
      const cols = await describeSqlTableFn({
        data: { ...connectionPayload, table: tName },
      });
      setColumns(cols);
    } catch (e: any) {
      toast.error("Erro ao ler colunas da tabela", { description: e?.message });
    } finally {
      setLoadingColumns(false);
    }
  };

  const handleGenerateAiSql = async () => {
    if (!aiQuestion.trim() || !selectedTable) {
      toast.error("Digite uma pergunta ou objetivo para a IA.");
      return;
    }

    setGeneratingAiSql(true);
    try {
      const res = await generateSqlWithAIFn({
        data: {
          question: aiQuestion.trim(),
          tableName: selectedTable,
          columns: columns.map((c) => ({
            name: c.name,
            type: c.type,
            mappedType: c.mappedType,
            nullable: c.nullable,
            isPrimary: c.isPrimary,
            defaultValue: c.defaultValue ?? undefined,
          })),
        },
      });

      setCustomQuery(res.sql);
      setAiExplanation(res.explanation);
      setQueryMode("custom");
      toast.success("Consulta SQL gerada com sucesso pela IA!");
    } catch (e: any) {
      toast.error("Falha ao gerar SQL com IA", { description: e?.message });
    } finally {
      setGeneratingAiSql(false);
    }
  };

  const getEffectiveQuery = () => {
    if (queryMode === "table" && selectedTable) {
      return `SELECT * FROM \`${selectedTable}\` LIMIT ${limit};`;
    }
    return customQuery.trim();
  };

  const handlePreviewQuery = async () => {
    const q = getEffectiveQuery();
    if (!q) {
      toast.error("Nenhuma consulta SQL informada.");
      return;
    }

    setExecutingQuery(true);
    try {
      const res = await executeSqlQueryFn({
        data: {
          ...connectionPayload,
          query: q,
          limit: 10,
        },
      });

      setPreviewData(res);
      toast.info(`Pré-visualização gerada (${res.rows.length} registros em ${res.executionTimeMs}ms)`);
    } catch (e: any) {
      toast.error("Erro ao executar consulta", { description: e?.message });
    } finally {
      setExecutingQuery(false);
    }
  };

  const handleImportToBi = async () => {
    const q = getEffectiveQuery();
    if (!q) {
      toast.error("Nenhuma consulta SQL informada.");
      return;
    }

    setExecutingQuery(true);
    try {
      toast.loading("Executando consulta no banco SQL...", { id: "sql-import" });
      const res = await executeSqlQueryFn({
        data: {
          ...connectionPayload,
          query: q,
          limit,
        },
      });

      if (!res.rows.length) {
        toast.dismiss("sql-import");
        toast.warning("A consulta foi executada, mas não retornou nenhuma linha de dados.");
        return;
      }

      const dsName = selectedTable ? `${database}.${selectedTable}` : `${database}.consulta_sql`;
      const dataset: Dataset = {
        name: dsName,
        fields: res.columns,
        rows: res.rows,
        sources: [`SQL: ${database}@${host}:${port}`],
      };

      toast.dismiss("sql-import");
      toast.success("Dados importados com sucesso!", {
        description: `${res.rows.length.toLocaleString("pt-BR")} registros carregados em ${res.executionTimeMs}ms`,
      });

      onImportDataset(dataset, targetMode);
      onOpenChange(false);
    } catch (e: any) {
      toast.dismiss("sql-import");
      toast.error("Falha ao importar dados do banco SQL", { description: e?.message });
    } finally {
      setExecutingQuery(false);
    }
  };

  const filteredTables = useMemo(() => {
    if (!searchTable.trim()) return tables;
    const term = searchTable.toLowerCase();
    return tables.filter(
      (t) => t.name.toLowerCase().includes(term) || (t.comment && t.comment.toLowerCase().includes(term))
    );
  }, [tables, searchTable]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Database className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  Conectar Banco SQL / MariaDB
                  {serverVersion && (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-normal">
                      <CheckCircle2 className="size-3 mr-1" /> {serverVersion}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Conecte seu banco relacional (MariaDB, MySQL) para consultar tabelas e criar dashboards analíticos instantâneos.
                </DialogDescription>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
              <TabsList className="h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="connection" className="text-xs h-7 px-3 gap-1.5">
                  <Server className="size-3.5" /> 1. Conexão
                </TabsTrigger>
                <TabsTrigger value="explorer" className="text-xs h-7 px-3 gap-1.5" disabled={!tables.length && !serverVersion}>
                  <TableIcon className="size-3.5" /> 2. Tabelas & Consultas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-5">
          {activeTab === "connection" && (
            <div className="space-y-5 max-w-2xl mx-auto">
              {/* Presets & Saved Connections */}
              {savedConnections.length > 0 && (
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Save className="size-3.5 text-primary" /> Conexões Salvas
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {savedConnections.length} perfil(is) salvo(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedConnections.map((conn) => (
                      <div
                        key={conn.id}
                        onClick={() => {
                          setSelectedConnectionId(conn.id);
                          applySavedConnection(conn);
                          toast.info(`Perfil "${conn.name}" carregado.`);
                        }}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                          selectedConnectionId === conn.id
                            ? "bg-primary/15 border-primary/40 text-primary font-medium"
                            : "bg-background border-border/70 hover:border-primary/30"
                        }`}
                      >
                        <Database className="size-3 text-muted-foreground group-hover:text-primary" />
                        <span>{conn.name}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedConnection(conn.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition ml-1"
                          title="Remover perfil"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Credentials Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">Host / Endereço IP do Servidor</Label>
                  <Input
                    placeholder="localhost ou 127.0.0.1 ou rds.amazonaws.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Porta</Label>
                  <Input
                    type="number"
                    placeholder="3306"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value) || 3306)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs font-medium">Nome do Banco de Dados (Database Schema)</Label>
                  <Input
                    placeholder="ex: vendas_erp, sistema_exacta, bi_financeiro"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Usuário (User)</Label>
                  <Input
                    placeholder="root ou usuario_bi"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">Senha (Password)</Label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs font-medium">Nome do Perfil para Salvar (Opcional)</Label>
                  <Input
                    placeholder="ex: MariaDB Local, Servidor de Produção"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Security & SSL */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <div>
                    <span className="font-medium text-foreground">Habilitar Conexão SSL / TLS</span>
                    <p className="text-[11px] text-muted-foreground">Recomendado para servidores em nuvem como AWS, DigitalOcean, Hostinger.</p>
                  </div>
                </div>
                <Switch checked={ssl} onCheckedChange={setSsl} />
              </div>

              {/* Actions Footer for Connection */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveConnection}
                  className="text-xs gap-1.5"
                >
                  <Save className="size-3.5" /> Salvar Perfil
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTestConnection(false)}
                    disabled={testingConnection || !database.trim()}
                    className="text-xs gap-1.5"
                  >
                    {testingConnection ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    Testar Conexão
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleTestConnection(true)}
                    disabled={testingConnection || !database.trim()}
                    className="text-xs gap-1.5"
                  >
                    {testingConnection ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
                    Conectar e Listar Tabelas
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "explorer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[65vh]">
              {/* Left Pane: Table Navigator (4 cols) */}
              <div className="lg:col-span-4 flex flex-col border border-border/70 rounded-xl overflow-hidden bg-muted/15">
                <div className="p-3 border-b border-border/60 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <TableIcon className="size-3.5 text-primary" /> Tabelas ({tables.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={fetchTables}
                      disabled={loadingTables}
                      title="Recarregar tabelas"
                    >
                      <RefreshCw className={`size-3 ${loadingTables ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar tabelas..."
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      className="h-8 pl-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 p-2">
                  {loadingTables ? (
                    <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
                      <Loader2 className="size-5 animate-spin mx-auto text-primary" />
                      <p>Carregando catálogo de tabelas...</p>
                    </div>
                  ) : filteredTables.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      Nenhuma tabela encontrada.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTables.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => handleSelectTable(t.name)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                            selectedTable === t.name
                              ? "bg-primary/15 text-primary font-medium border border-primary/30"
                              : "hover:bg-muted/50 text-foreground"
                          }`}
                        >
                          <div className="truncate flex items-center gap-2">
                            <TableIcon className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{t.name}</span>
                          </div>
                          {t.rowCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-1 shrink-0 font-mono">
                              ~{t.rowCount.toLocaleString("pt-BR")}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right Pane: Query Editor & Preview (8 cols) */}
              <div className="lg:col-span-8 flex flex-col border border-border/70 rounded-xl overflow-hidden bg-background">
                {/* Header options: mode selector & limit */}
                <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                    <Button
                      variant={queryMode === "table" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setQueryMode("table")}
                      className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      <TableIcon className="size-3.5" /> Tabela Completa
                    </Button>
                    <Button
                      variant={queryMode === "custom" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setQueryMode("custom")}
                      className="h-7 text-xs px-2.5 gap-1.5"
                    >
                      <Code2 className="size-3.5" /> SQL Livre
                    </Button>
                    <Button
                      variant={queryMode === "ai" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setQueryMode("ai")}
                      className="h-7 text-xs px-2.5 gap-1.5 text-purple-500 hover:text-purple-600"
                    >
                      <Sparkles className="size-3.5" /> Assistente IA
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Limite:</Label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLimit(val);
                        if (queryMode === "table" && selectedTable) {
                          setCustomQuery(`SELECT * FROM \`${selectedTable}\` LIMIT ${val};`);
                        }
                      }}
                      className="h-7 text-xs bg-muted/40 border border-border rounded px-2"
                    >
                      <option value={1000}>1.000 linhas</option>
                      <option value={5000}>5.000 linhas</option>
                      <option value={10000}>10.000 linhas</option>
                      <option value={25000}>25.000 linhas</option>
                      <option value={50000}>50.000 linhas</option>
                    </select>
                  </div>
                </div>

                {/* Sub-body based on queryMode */}
                <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
                  {/* Table details bar */}
                  {selectedTable && (
                    <div className="flex flex-wrap items-center justify-between text-xs bg-muted/30 p-2 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{selectedTable}</span>
                        {columns.length > 0 && (
                          <span className="text-muted-foreground">({columns.length} colunas)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-0.5">
                        {columns.slice(0, 6).map((c) => (
                          <Badge key={c.name} variant="outline" className="text-[10px] h-4 font-mono">
                            {c.name}: {c.mappedType}
                          </Badge>
                        ))}
                        {columns.length > 6 && (
                          <span className="text-[10px] text-muted-foreground">+{columns.length - 6}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Assistant Mode */}
                  {queryMode === "ai" && (
                    <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <Sparkles className="size-4" /> Descreva em português o que você quer analisar
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Quais são os 10 clientes com maior receita nos últimos 6 meses?"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && void handleGenerateAiSql()}
                          className="h-9 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={handleGenerateAiSql}
                          disabled={generatingAiSql || !aiQuestion.trim()}
                          className="h-9 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                        >
                          {generatingAiSql ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                          Gerar SQL
                        </Button>
                      </div>
                      {aiExplanation && (
                        <p className="text-xs text-muted-foreground bg-background/80 p-2.5 rounded-lg border border-purple-500/20">
                          💡 {aiExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* SQL Query Editor Textarea */}
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-xs font-medium">Consulta SQL (Somente Leitura)</Label>
                      <span className="text-[11px] text-muted-foreground">SELECT, JOIN, WHERE, GROUP BY suportados</span>
                    </div>
                    <Textarea
                      value={queryMode === "table" ? `SELECT * FROM \`${selectedTable || "tabela"}\` LIMIT ${limit};` : customQuery}
                      onChange={(e) => {
                        setCustomQuery(e.target.value);
                        if (queryMode === "table") setQueryMode("custom");
                      }}
                      className="font-mono text-xs h-28 resize-none bg-muted/20 border-border/80"
                      placeholder="SELECT * FROM tabela WHERE ..."
                    />
                  </div>

                  {/* Quick Action Preview & Execute */}
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviewQuery}
                      disabled={executingQuery || !selectedTable}
                      className="text-xs gap-1.5"
                    >
                      {executingQuery ? <Loader2 className="size-3 animate-spin" /> : <Eye className="size-3.5" />}
                      Pré-visualizar (10 linhas)
                    </Button>

                    <div className="flex items-center gap-3">
                      {currentPageName && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Label htmlFor="target-mode" className="text-xs text-muted-foreground cursor-pointer">
                            Acrescentar na página atual?
                          </Label>
                          <Switch
                            id="target-mode"
                            checked={targetMode === "append"}
                            onCheckedChange={(c) => setTargetMode(c ? "append" : "create")}
                          />
                        </div>
                      )}

                      <Button
                        size="sm"
                        onClick={handleImportToBi}
                        disabled={executingQuery || !selectedTable}
                        className="text-xs gap-1.5 bg-primary text-primary-foreground font-medium"
                      >
                        {executingQuery ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                        Importar para o BI & Gerar Dashboard
                      </Button>
                    </div>
                  </div>

                  {/* Preview Table Result */}
                  {previewData && (
                    <div className="mt-2 border border-border/70 rounded-lg overflow-hidden bg-muted/10">
                      <div className="p-2 border-b border-border/50 bg-muted/30 flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Pré-visualização dos Dados</span>
                        <span className="text-[11px] text-muted-foreground">
                          {previewData.columns.length} colunas · {previewData.rows.length} linhas
                        </span>
                      </div>
                      <ScrollArea className="max-h-36">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead className="bg-muted/50 border-b border-border text-muted-foreground sticky top-0">
                            <tr>
                              {previewData.columns.map((c) => (
                                <th key={c.name} className="p-2 font-medium border-r border-border/40 whitespace-nowrap">
                                  {c.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-border/20 hover:bg-muted/30">
                                {previewData.columns.map((c) => (
                                  <td key={c.name} className="p-2 border-r border-border/20 whitespace-nowrap truncate max-w-[180px]">
                                    {row[c.name] != null ? String(row[c.name]) : <span className="text-muted-foreground/50">null</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
