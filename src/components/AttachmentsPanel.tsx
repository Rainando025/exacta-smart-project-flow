import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File as FileIcon, Trash2, Download, FolderPlus, Folder } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  storage_path: string;
  folder: string;
  uploaded_by: string;
  created_at: string;
}

interface Props {
  taskId?: string;
  projectId?: string;
  documentId?: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export function AttachmentsPanel({ taskId, projectId, documentId }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Attachment[]>([]);
  const [folders, setFolders] = useState<string[]>(["/"]);
  const [currentFolder, setCurrentFolder] = useState("/");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const scopeColumn = taskId ? "task_id" : (projectId ? "project_id" : "document_id");
  const scopeValue = taskId || projectId || documentId!;
  const basePath = taskId ? `tasks/${taskId}` : (projectId ? `projects/${projectId}` : `documents/${documentId}`);

  const load = async () => {
    const { data } = await supabase
      .from("attachments")
      .select("*")
      .eq(scopeColumn, scopeValue)
      .order("created_at", { ascending: false });
    const list = (data || []) as Attachment[];
    setItems(list);
    const uniqueFolders = Array.from(new Set(["/", ...list.map((i) => i.folder)]));
    setFolders(uniqueFolders);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`attachments-${scopeValue}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attachments", filter: `${scopeColumn}=eq.${scopeValue}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeValue]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} excede 25MB`);
          continue;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const folderPath = currentFolder === "/" ? "" : `${currentFolder.replace(/^\//, "")}/`;
        const path = `${basePath}/${folderPath}${Date.now()}_${safeName}`;

        const { error: upErr } = await supabase.storage
          .from("attachments")
          .upload(path, file, { upsert: false });
        if (upErr) {
          toast.error(`${file.name}: ${upErr.message}`);
          continue;
        }

        const { error: metaErr } = await supabase.from("attachments").insert({
          task_id: taskId || null,
          project_id: projectId || null,
          document_id: documentId || null,
          uploaded_by: user.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          storage_path: path,
          folder: currentFolder,
        });
        if (metaErr) toast.error(metaErr.message);
      }
      toast.success("Arquivos enviados");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const download = async (a: Attachment) => {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(a.storage_path, 60);
    if (error || !data) return toast.error("Não foi possível gerar link");
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (a: Attachment) => {
    if (!confirm(`Excluir "${a.file_name}"?`)) return;
    await supabase.storage.from("attachments").remove([a.storage_path]);
    const { error } = await supabase.from("attachments").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Arquivo excluído");
  };

  const createFolder = () => {
    const name = prompt("Nome da pasta:");
    if (!name) return;
    const clean = "/" + name.trim().replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9 _-]/g, "");
    if (clean === "/") return;
    setFolders((f) => Array.from(new Set([...f, clean])));
    setCurrentFolder(clean);
  };

  const filtered = items.filter((i) => i.folder === currentFolder);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Arquivos</h4>
        <span className="text-xs text-muted-foreground">{items.length} arquivo(s)</span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={currentFolder} onValueChange={setCurrentFolder}>
          <SelectTrigger className="h-9 w-[200px]">
            <Folder className="h-3.5 w-3.5 mr-2 text-accent" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {folders.map((f) => (
              <SelectItem key={f} value={f}>
                {f === "/" ? "Raiz" : f.replace(/^\//, "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={createFolder} size="sm" variant="outline" className="gap-1">
          <FolderPlus className="h-4 w-4" /> Nova pasta
        </Button>
        <Button
          onClick={() => inputRef.current?.click()}
          size="sm"
          disabled={uploading}
          className="bg-gradient-primary text-primary-foreground gap-1 ml-auto"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando…" : "Upload"}
        </Button>
        <Input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <ul className="divide-y rounded-lg border">
        {filtered.length === 0 && (
          <li className="text-xs text-muted-foreground p-4 text-center">Nenhum arquivo nesta pasta.</li>
        )}
        {filtered.map((a) => (
          <li key={a.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition">
            <FileIcon className="h-4 w-4 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{a.file_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatSize(a.file_size)}
                {a.mime_type ? ` • ${a.mime_type}` : ""}
              </p>
            </div>
            <button
              onClick={() => download(a)}
              className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted"
              aria-label="Baixar"
            >
              <Download className="h-4 w-4" />
            </button>
            {(a.uploaded_by === user?.id) && (
              <button
                onClick={() => remove(a)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
