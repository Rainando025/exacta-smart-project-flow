import { I as jsxRuntimeExports } from "./index.mjs";
import { A as AppShell } from "./AppShell-OCwEkoGu.mjs";
import { C as CalendarScheduler } from "./CalendarScheduler-DvubtSUY.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./router-Bktayy9l.mjs";
import "./input-nTKCBTY6.mjs";
import "./users-C5uEgJff.mjs";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
import "./calendar-B9iwqwlp.mjs";
import "./textarea-CGvy_XFp.mjs";
import "./funnel-DDdTvvLZ.mjs";
import "./pen-line-CFs4a1Rv.mjs";
import "./calendar-DYvPAJmB.mjs";
function CalendarPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-[calc(100vh-64px)] overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "p-4 border-b border-white/5 bg-card/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-accent font-bold uppercase tracking-widest", children: "Planejamento Estratégico" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-xl font-bold", children: "Calendário Inteligente" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarScheduler, { isTeam: true }) })
  ] }) });
}
export {
  CalendarPage as component
};
