// Dashboard-ul pentru autori
// Permite: trimiterea articolelor, vizualizarea articolelor proprii,
// incarcarea versiunilor noi (dupa ce primesti NEEDS_REVISIONS)
import { useEffect, useMemo, useState } from "react";
import StatusBanner from "../components/StatusBanner";
import { getErrorMessage } from "../utils/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";
import { PapersAPI } from "../services/papers";
import { ConferencesAPI } from "../services/conferences";

export default function AuthorDashboard() {
  const user = getCurrentUser();
  const qc = useQueryClient();

  // State pentru banner-ul de notificari
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const clearBanner = () => setBanner({ type: "info", message: "" });
  const showSuccess = (message) => setBanner({ type: "success", message });
  const showError = (err, fallback) =>
    setBanner({ type: "error", message: getErrorMessage(err, fallback) });

  // State pentru formularul de trimitere articol
  const [conferenceId, setConferenceId] = useState("");
  const [title, setTitle] = useState("My Paper Title");
  const [abstract, setAbstract] = useState("Short abstract...");
  const [currentVersionLink, setCurrentVersionLink] = useState("v1.pdf");

  // Tinem evidenta conferintelor la care s-a inregistrat autorul
  const [registeredConferenceIds, setRegisteredConferenceIds] = useState(() => new Set());

  const isRegisteredHere = conferenceId
    ? registeredConferenceIds.has(Number(conferenceId))
    : false;

  // Mutatie pentru inregistrarea autorului la conferinta
  const registerMutation = useMutation({
    mutationFn: async () => {
      clearBanner();
      if (!conferenceId) throw new Error("Selectează o conferință.");
      if (!user?.id) throw new Error("Nu ești autentificat.");
      return ConferencesAPI.registerAuthor(Number(conferenceId), user.id);
    },
    onSuccess: async () => {
      setRegisteredConferenceIds((prev) => {
        const next = new Set(prev);
        next.add(Number(conferenceId));
        return next;
      });
      showSuccess("Te-ai înregistrat cu succes la conferință!");
    },
    onError: (e) => showError(e, "Eroare la înregistrarea autorului."),
  });

  // Query pentru lista de conferinte disponibile
  const conferencesQuery = useQuery({
    queryKey: ["conferences"],
    queryFn: ConferencesAPI.list,
  });

  // Query pentru lista de articole
  const papersQuery = useQuery({
    queryKey: ["papers"],
    queryFn: PapersAPI.list,
  });

  const conferences = Array.isArray(conferencesQuery.data) ? conferencesQuery.data : [];
  const allPapers = Array.isArray(papersQuery.data) ? papersQuery.data : [];
  const myPapers = useMemo(() => allPapers.filter((p) => p.authorId === user?.id), [allPapers, user]);

  useEffect(() => {
    if (!conferenceId && conferences.length > 0) {
      setConferenceId(String(conferences[0].id));
    }
  }, [conferenceId, conferences]);

  // Mutatie pentru trimiterea unui articol nou
  const submitMutation = useMutation({
    mutationFn: () =>
      PapersAPI.submit({
        title,
        abstract,
        currentVersionLink,
        authorId: user.id,
        conferenceId: Number(conferenceId),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["papers"] });
      showSuccess("Articol trimis cu succes! Reviewerii au fost alocați automat.");
    },
    onError: (e) => {
      showError(e, "Eroare la trimiterea articolului.");
    },
  });

  // State pentru articolul selectat
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  // Query pentru detaliile articolului selectat
  const paperDetailsQuery = useQuery({
    queryKey: ["paper", selectedPaperId],
    queryFn: () => PapersAPI.get(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  const [newVersionLink, setNewVersionLink] = useState("v2.pdf");

  // Mutatie pentru incarcarea unei versiuni noi
  const newVersionMutation = useMutation({
    mutationFn: () => PapersAPI.newVersion(selectedPaperId, newVersionLink),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["papers"] });
      await qc.invalidateQueries({ queryKey: ["paper", selectedPaperId] });
      showSuccess("Versiune nouă încărcată! Status resetat la IN_REVIEW.");
    },
    onError: (e) => {
      showError(e, "Eroare la încărcarea versiunii.");
    },
  });

  if (!user) return null;

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
        <h1 className="page-title">Author Dashboard</h1>
        <p className="page-subtitle">Trimite articole și monitorizează recenziile</p>
      </div>

      <StatusBanner type={banner.type} message={banner.message} onClose={clearBanner} />

      {/* Submit Paper Section */}
      <div className="dashboard-section" style={{ marginBottom: "1.5rem" }}>
        <h3 className="dashboard-section-title">Trimite Articol</h3>

        {conferencesQuery.isLoading && (
          <div className="loading">
            <span className="spinner"></span>
            <span>Se încarcă conferințele...</span>
          </div>
        )}

        {!conferencesQuery.isLoading && (
          <>
            {/* Register Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={isRegisteredHere ? "btn-success" : ""}
                onClick={() => registerMutation.mutate()}
                disabled={!conferenceId || registerMutation.isPending || isRegisteredHere}
              >
                {isRegisteredHere ? (
                  "Înregistrat"
                ) : registerMutation.isPending ? (
                  <>
                    <span className="spinner"></span>
                    Se înregistrează...
                  </>
                ) : (
                  "Înregistrează-te la conferință"
                )}
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Trebuie să te înregistrezi înainte de a trimite articolul.
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!conferenceId) return showError(null, "Selectează o conferință.");
                submitMutation.mutate();
              }}
              className="form-grid"
              style={{ maxWidth: "600px" }}
            >
              <div className="form-group">
                <label>Conferință</label>
                <select
                  value={conferenceId}
                  onChange={(e) => setConferenceId(e.target.value)}
                  disabled={conferences.length === 0}
                >
                  {conferences.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      #{c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Titlu articol</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titlul articolului"
                />
              </div>

              <div className="form-group">
                <label>Abstract</label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Descriere scurtă a articolului..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Link versiune (demo)</label>
                <input
                  value={currentVersionLink}
                  onChange={(e) => setCurrentVersionLink(e.target.value)}
                  placeholder="v1.pdf"
                />
              </div>

              <button type="submit" disabled={submitMutation.isPending || !conferenceId}>
                {submitMutation.isPending ? (
                  <>
                    <span className="spinner"></span>
                    Se trimite...
                  </>
                ) : (
                  "Trimite articol"
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Papers Grid */}
      <div className="dashboard-grid">
        {/* My Papers List */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Articolele Mele</h3>

          {papersQuery.isLoading && (
            <div className="loading">
              <span className="spinner"></span>
              <span>Se încarcă...</span>
            </div>
          )}

          {!papersQuery.isLoading && myPapers.length === 0 && (
            <div className="empty-state" style={{ padding: "2rem" }}>

              <p style={{ color: "var(--text-muted)", margin: 0 }}>Nu ai articole încă.</p>
            </div>
          )}

          {myPapers.length > 0 && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {myPapers.map((p) => {
                const status = statusConfig[p.status] || { class: "badge-neutral", label: p.status };
                const isActive = selectedPaperId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPaperId(p.id)}
                    className={`paper-card ${isActive ? "active" : ""}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div className="paper-title" style={{ fontSize: "1rem" }}>
                        #{p.id} — {p.title}
                      </div>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paper Details */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Detalii Articol</h3>

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
            <AuthorPaperDetails
              paper={paperDetailsQuery.data}
              newVersionLink={newVersionLink}
              setNewVersionLink={setNewVersionLink}
              onUpload={() => newVersionMutation.mutate()}
              uploading={newVersionMutation.isPending}
              statusConfig={statusConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AuthorPaperDetails({ paper, newVersionLink, setNewVersionLink, onUpload, uploading, statusConfig }) {
  const canUploadNewVersion = paper.status === "NEEDS_REVISIONS";
  const status = statusConfig[paper.status] || { class: "badge-neutral", label: paper.status };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h4 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>{paper.title}</h4>
        <span className={`badge ${status.class}`}>{status.label}</span>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{paper.abstract}</p>

      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Versiune curentă: <strong style={{ color: "var(--text-primary)" }}>{paper.currentVersionLink}</strong>
      </div>

      {/* Version History */}
      {Array.isArray(paper.versionHistory) && paper.versionHistory.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <h5 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
            Istoric versiuni:
          </h5>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {paper.versionHistory.map((vh, idx) => {
              if (typeof vh === "string") {
                return (
                  <div key={`${vh}-${idx}`} style={{ fontSize: "0.875rem", color: "var(--text-muted)", padding: "0.5rem", background: "var(--bg-tertiary)", borderRadius: "6px" }}>
                    {vh}
                  </div>
                );
              }
              const ver = vh?.version ?? idx + 1;
              const link = vh?.link ?? "(no link)";
              const dateLabel = vh?.date ? new Date(vh.date).toLocaleString() : "";
              return (
                <div key={`v${ver}-${idx}`} style={{ fontSize: "0.875rem", color: "var(--text-muted)", padding: "0.5rem", background: "var(--bg-tertiary)", borderRadius: "6px" }}>
                  <strong style={{ color: "var(--color-primary)" }}>v{ver}</strong>: {link} {dateLabel ? `— ${dateLabel}` : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section-divider"></div>

      {/* Upload New Version */}
      <h5 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>Încarcă versiune nouă</h5>

      {!canUploadNewVersion && (
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Poți încărca o versiune nouă doar dacă statusul este "Necesită revizuiri".
        </p>
      )}

      <div className="form-grid" style={{ maxWidth: "300px" }}>
        <div className="form-group">
          <input
            value={newVersionLink}
            onChange={(e) => setNewVersionLink(e.target.value)}
            placeholder="v2.pdf"
            disabled={!canUploadNewVersion}
          />
        </div>
        <button onClick={onUpload} disabled={!canUploadNewVersion || uploading}>
          {uploading ? (
            <>
              <span className="spinner"></span>
              Se încarcă...
            </>
          ) : (
            "Încarcă versiune"
          )}
        </button>
      </div>

      {/* Reviews */}
      {Array.isArray(paper.reviews) && paper.reviews.length > 0 && (
        <>
          <div className="section-divider"></div>
          <h5 style={{ color: "var(--text-primary)", marginBottom: "0.75rem" }}>Recenzii ({paper.reviews.length})</h5>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {paper.reviews.map((r) => (
              <div key={r.id} style={{ padding: "0.75rem", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {r.reviewer?.name || `Reviewer #${r.reviewerId}`}
                  </strong>
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}
