import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    const host = location.hostname.toLowerCase();
    const allowed =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "bitcoinsignalfree.com" ||
      host.endsWith(".bitcoinsignalfree.com") ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovable.dev") ||
      host.endsWith(".lovableproject.com");
    if (!allowed) {
      document.documentElement.innerHTML =
        '<body style="margin:0;background:#07080d;color:#f7931a;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;"><div><h1>Acesso nao autorizado</h1><p>Conteudo exclusivo de bitcoinsignalfree.com</p></div></body>';
      return;
    }
    const prevent = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      if (e.key === "F12") e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (k === "i" || k === "j" || k === "c")) e.preventDefault();
      if (e.ctrlKey && (k === "u" || k === "s")) e.preventDefault();
    };
    document.addEventListener("contextmenu", prevent, true);
    document.addEventListener("dragstart", prevent, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("contextmenu", prevent, true);
      document.removeEventListener("dragstart", prevent, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  return (
    <iframe
      src="/painel.html"
      title="BTC — Painel de Sinais Premium"
      style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
    />
  );
}
