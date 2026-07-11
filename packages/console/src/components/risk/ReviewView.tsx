import { useEffect, useState } from "react";
import { READING_ORDER, PROTOCOL } from "@novaperps/shared";

type Review = {
  readingOrder?: typeof READING_ORDER;
  commands?: string[];
  stage?: string;
};

export function ReviewView() {
  const [review, setReview] = useState<Review | null>(null);
  useEffect(() => {
    void fetch("/v1/review")
      .then((r) => r.json())
      .then(setReview)
      .catch(() =>
        setReview({
          readingOrder: READING_ORDER,
          commands: ["npm run server", "npm run contracts:test"],
          stage: PROTOCOL.stage,
        })
      );
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>Senior review path</h2>
          <p>
            {PROTOCOL.name} · {review?.stage ?? PROTOCOL.stage} · no Next.js — Vite console package like Zendarox.
          </p>
        </div>
      </div>
      <h3 style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Reading order</h3>
      {(review?.readingOrder ?? READING_ORDER).map((r, i) => (
        <div key={r.file} className="contract-row" style={{ display: "flex", gap: "0.75rem" }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(0,212,168,.12)",
              color: "var(--cyan)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: "0.78rem",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <div>
            <code>{r.file}</code>
            <p>{r.reason}</p>
          </div>
        </div>
      ))}
      <h3 style={{ fontSize: "0.85rem", margin: "1rem 0 0.5rem" }}>Commands</h3>
      <div className="btn-row">
        {(review?.commands ?? []).map((c) => (
          <code key={c} className="version-chip">
            {c}
          </code>
        ))}
      </div>
    </div>
  );
}
