import { S as reactExports, I as jsxRuntimeExports } from "./index.mjs";
import { ak as useAuth, ai as supabase, V as Select, Y as SelectTrigger, Z as SelectValue, W as SelectContent, X as SelectItem, b as Button, a8 as createLucideIcon, aj as toast } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { F as File } from "./paperclip-BgIjAsfH.mjs";
import { D as Download } from "./download-DABr9rdP.mjs";
import { j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
const __iconNode$2 = [
  ["path", { d: "M12 10v6", key: "1bos4e" }],
  ["path", { d: "M9 13h6", key: "1uhe8q" }],
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ]
];
const FolderPlus = createLucideIcon("folder-plus", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ]
];
const Folder = createLucideIcon("folder", __iconNode$1);
const __iconNode = [
  ["path", { d: "M12 3v12", key: "1x0j5s" }],
  ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
];
const Upload = createLucideIcon("upload", __iconNode);
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
function AttachmentsPanel({ taskId, projectId }) {
  const { user } = useAuth();
  const [items, setItems] = reactExports.useState([]);
  const [folders, setFolders] = reactExports.useState(["/"]);
  const [currentFolder, setCurrentFolder] = reactExports.useState("/");
  const [uploading, setUploading] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  const scopeColumn = taskId ? "task_id" : projectId ? "project_id" : "document_id";
  const scopeValue = taskId || projectId || documentId;
  const basePath = taskId ? `tasks/${taskId}` : projectId ? `projects/${projectId}` : `documents/${documentId}`;
  const load = async () => {
    const { data } = await supabase.from("attachments").select("*").eq(scopeColumn, scopeValue).order("created_at", { ascending: false });
    const list = data || [];
    setItems(list);
    const uniqueFolders = Array.from(/* @__PURE__ */ new Set(["/", ...list.map((i) => i.folder)]));
    setFolders(uniqueFolders);
  };
  reactExports.useEffect(() => {
    load();
    const ch = supabase.channel(`attachments-${scopeValue}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "attachments", filter: `${scopeColumn}=eq.${scopeValue}` },
      load
    ).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [scopeValue]);
  const handleUpload = async (files) => {
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
        const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, { upsert: false });
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
          folder: currentFolder
        });
        if (metaErr) toast.error(metaErr.message);
      }
      toast.success("Arquivos enviados");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const download = async (a) => {
    const { data, error } = await supabase.storage.from("attachments").createSignedUrl(a.storage_path, 60);
    if (error || !data) return toast.error("Não foi possível gerar link");
    window.open(data.signedUrl, "_blank");
  };
  const remove = async (a) => {
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
    setFolders((f) => Array.from(/* @__PURE__ */ new Set([...f, clean])));
    setCurrentFolder(clean);
  };
  const filtered = items.filter((i) => i.folder === currentFolder);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-semibold", children: "Arquivos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        items.length,
        " arquivo(s)"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: currentFolder, onValueChange: setCurrentFolder, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectTrigger, { className: "h-9 w-[200px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-3.5 w-3.5 mr-2 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: folders.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: f, children: f === "/" ? "Raiz" : f.replace(/^\//, "") }, f)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: createFolder, size: "sm", variant: "outline", className: "gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FolderPlus, { className: "h-4 w-4" }),
        " Nova pasta"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => inputRef.current?.click(),
          size: "sm",
          disabled: uploading,
          className: "bg-gradient-primary text-primary-foreground gap-1 ml-auto",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
            uploading ? "Enviando…" : "Upload"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          ref: inputRef,
          type: "file",
          multiple: true,
          className: "hidden",
          onChange: (e) => handleUpload(e.target.files)
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "divide-y rounded-lg border", children: [
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "text-xs text-muted-foreground p-4 text-center", children: "Nenhum arquivo nesta pasta." }),
      filtered.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(File, { className: "h-4 w-4 text-accent shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm truncate", children: a.file_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            formatSize(a.file_size),
            a.mime_type ? ` • ${a.mime_type}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => download(a),
            className: "p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted",
            "aria-label": "Baixar",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" })
          }
        ),
        a.uploaded_by === user?.id && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => remove(a),
            className: "p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted",
            "aria-label": "Excluir",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
          }
        )
      ] }, a.id))
    ] })
  ] });
}
export {
  AttachmentsPanel as A
};
