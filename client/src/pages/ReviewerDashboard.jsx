// Dashboard-ul pentru revieweri
// Permite: vizualizarea articolelor alocate, trimiterea recenziilor
// (approved/changes_requested/rejected) cu comentarii
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../components/StatusBanner";
import { getErrorMessage } from "../utils/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";
import { UsersAPI } from "../services/users";
import { PapersAPI } from "../services/papers";

export default function ReviewerDashboard() {
  const user = getCurrentUser();
  const qc = useQueryClient();

  // State pentru banner-ul de notificari
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const clearBanner = () => setBanner({ type: "info", message: "" });
  const showSuccess = (message) => setBanner({ type: "success", message });
  const showError = (err, fallback) =>
    setBanner({ type: "error", message: getErrorMessage(err, fallback) });

  // Articolul selectat pentru vizualizare detalii si trimitere review
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  // Query pentru articolele alocate acestui reviewer
  const papersQuery = useQuery({
    queryKey: ["reviewerPapers", user?.id],
    queryFn: () => UsersAPI.papersForReviewer(user.id),
    enabled: !!user?.id,
  });

  // Gasim articolul selectat in lista
  const selectedPaper = useMemo(() => {
    const arr = Array.isArray(papersQuery.data) ? papersQuery.data : [];
    return arr.find((p) => p.id === selectedPaperId) || null;
  }, [papersQuery.data, selectedPaperId]);

  // Mutatie pentru trimiterea unui review
  const reviewMutation = useMutation({
    mutationFn: ({ paperId, verdict, comments }) =>
      PapersAPI.review(paperId, { reviewerId: user.id, verdict, comments }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["reviewerPapers", user.id] });
      if (selectedPaperId) {
        await qc.invalidateQueries({ queryKey: ["paper", selectedPaperId] });
      }
      showSuccess("Review trimis cu succes!");
    },
    onError: (e) => {
      showError(e, "Eroare la trimiterea review-ului.");
    },
  });

  // Query pentru detaliile complete ale articolului selectat
  const paperDetailsQuery = useQuery({
    queryKey: ["paper", selectedPaperId],
    queryFn: () => PapersAPI.get(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  if (!user) return null;

  const papers = Array.isArray(papersQuery.data) ? papersQuery.data : [];

  // Status badge config
  const statusConfig = {
    IN_REVIEW: { class: "badge-warning", label: "În recenzie" },
    APPROVED: { class: "badge-success", label: "Aprobat" },
    REJECTED: { class: "badge-error", label: "Respins" },
    NEEDS_REVISIONS: { class: "badge-info", label: "Necesită revizuiri" },
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Reviewer Dashboard</h1>
        <p className="page-subtitle">Recenzează articolele alocate</p>
      </div>

      <StatusBanner type={banner.type} message={banner.message} onClose={clearBanner} />

      {papersQuery.isLoading && (
        <div className="loading" style={{ marginBottom: "1rem" }}>
          <span className="spinner"></span>
          <span>Se încarcă articolele...</span>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Papers List */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Articole Alocate</h3>

          {!papersQuery.isLoading && papers.length === 0 && (
            <div className="empty-state" style={{ padding: "2rem" }}>

              <p style={{ color: "var(--text-muted)", margin: 0 }}>Niciun articol alocat.</p>
            </div>
          )}

          {papers.length > 0 && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {papers.map((p) => {
                const status = statusConfig[p.status] || { class: "badge-neutral", label: p.status };
                const isActive = selectedPaperId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPaperId(p.id)}
                    className={`paper-card ${isActive ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                      <div className="paper-title" style={{ fontSize: "1rem" }}>
                        #{p.id} — {p.title}
                      </div>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </div>
                    {p.author?.name && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        {p.author.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paper Details & Review Form */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Detalii & Recenzie</h3>

          {!selectedPaperId && (
            <p style={{ color: "var(--text-muted)" }}>Selectează un articol din listă.</p>
          )}

          {selectedPaperId && paperDetailsQuery.isLoading && (
            <div className="loading">
              <span className="spinner"></span>
              <span>Se încarcă...</span>
            </div>
          )}

          {selectedPaperId && paperDetailsQuery.data && (
            <PaperReviewPanel
              paper={paperDetailsQuery.data}
              reviewerId={user.id}
              onSubmit={(verdict, comments) =>
                reviewMutation.mutate({ paperId: selectedPaperId, verdict, comments })
              }
              submitting={reviewMutation.isPending}
              statusConfig={statusConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PaperReviewPanel({ paper, reviewerId, onSubmit, submitting, statusConfig }) {
  const [verdict, setVerdict] = useState("approved");
  const [comments, setComments] = useState("");

  useEffect(() => {
    const reviews = Array.isArray(paper?.reviews) ? paper.reviews : [];
    const mine = reviews.find((r) => r.reviewerId === reviewerId);
    if (mine) {
      setVerdict(mine.verdict || "approved");
      setComments(mine.comments || "");
    } else {
      setVerdict("approved");
      setComments("");
    }
  }, [paper?.id, reviewerId]);

  const status = statusConfig[paper.status] || { class: "badge-neutral", label: paper.status };

  // Verdict options with colors
  const verdictOptions = [
    { value: "approved", label: "✅ Aprobat", color: "var(--color-success)" },
    { value: "changes_requested", label: "🔄 Necesită modificări", color: "var(--color-warning)" },
    { value: "rejected", label: "❌ Respins", color: "var(--color-error)" },
  ];

  return (
    <div>
      {/* Paper Info */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <h4 style={{ color: "var(--text-primary)", margin: 0 }}>{paper.title}</h4>
          <span className={`badge ${status.class}`}>{status.label}</span>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
          {paper.abstract}
        </p>

        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Versiune curentă: <strong style={{ color: "var(--text-primary)" }}>{paper.currentVersionLink}</strong>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Review Form */}
      <h5 style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>Trimite Recenzie</h5>

      <div className="form-grid" style={{ maxWidth: "400px" }}>
        <div className="form-group">
          <label>Verdict</label>
          <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            {verdictOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label.replace(/^[^\w]+/, '')}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Comentarii</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Scrie feedback-ul tău aici..."
            rows={4}
          />
        </div>

        <button onClick={() => onSubmit(verdict, comments)} disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner"></span>
              Se trimite...
            </>
          ) : (
            "Trimite recenzie"
          )}
        </button>
      </div>

      {/* Existing Reviews */}
      {Array.isArray(paper.reviews) && paper.reviews.length > 0 && (
        <>
          <div className="section-divider"></div>
          <h5 style={{ color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Recenzii existente ({paper.reviews.length})
          </h5>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {paper.reviews.map((r) => {
              const isMyReview = r.reviewerId === reviewerId;

              return (
                <div
                  key={r.id}
                  style={{
                    padding: "0.75rem",
                    background: isMyReview ? "rgba(139, 92, 246, 0.1)" : "var(--bg-tertiary)",
                    borderRadius: "8px",
                    border: isMyReview ? "1px solid var(--color-primary)" : "1px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {r.reviewer?.name || `Reviewer #${r.reviewerId}`}
                      </strong>
                      {isMyReview && (
                        <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>Tu</span>
                      )}
                    </div>
                    <span className={`badge ${r.verdict === "approved" ? "badge-success" : r.verdict === "rejected" ? "badge-error" : "badge-warning"}`}>
                      {r.verdict || "pending"}
                    </span>
                  </div>
                  {r.comments && (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                      "{r.comments}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
