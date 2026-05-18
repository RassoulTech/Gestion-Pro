"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Une erreur est survenue</h2>
          <button
            onClick={() => reset()}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.5rem", background: "#000", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
