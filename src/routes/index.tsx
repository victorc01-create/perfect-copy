import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/painel.html"
      title="BTC — Painel de Sinais Premium"
      style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
    />
  );
}
