// Dashboard-ul pentru organizatori (admini)
// Permite: crearea conferintelor, alocarea reviewerilor,
// monitorizarea articolelor si a statusurilor recenziilor
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";
import { ConferencesAPI } from "../services/conferences";
import { UsersAPI } from "../services/users";
import StatusBanner from "../components/StatusBanner";
import { getErrorMessage } from "../utils/http";

export default function OrganizerDashboard() {
  const user = getCurrentUser();
  const qc = useQueryClient();

  // State pentru banner-ul de notificari
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const clearBanner = () => setBanner({ type: "info", message: "" });
  const showError = (e, fallback) =>
    setBanner({ type: "error", message: getErrorMessage(e, fallback) });
  const showSuccess = (msg) => setBanner({ type: "success", message: msg });

  // Query-uri pentru date initiale
  const conferencesQuery = useQuery({
    queryKey: ["conferences"],
    queryFn: ConferencesAPI.list,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: UsersAPI.list,
  });

  const conferences = Array.isArray(conferencesQuery.data) ? conferencesQuery.data : [];
  const allUsers = Array.isArray(usersQuery.data) ? usersQuery.data : [];

  // Extragem doar utilizatorii cu rol de reviewer
  const reviewers = useMemo(
    () => allUsers.filter((u) => u.role === "reviewer"),
    [allUsers]
  );

  // Filtram doar conferintele organizate de userul curent
  const myConferences = useMemo(() => {
    if (!user?.id) return conferences;
    return conferences.filter((c) => c.organizerId === user.id);
  }, [conferences, user]);

  // Conferinta selectata pentru administrare
  const [selectedConferenceId, setSelectedConferenceId] = useState(null);

  useEffect(() => {
    if (!selectedConferenceId && myConferences.length > 0) {
      setSelectedConferenceId(String(myConferences[0].id));
    }
  }, [myConferences, selectedConferenceId]);

  // Query pentru detaliile conferintei selectate
  const conferenceDetailsQuery = useQuery({
    queryKey: ["conference", selectedConferenceId],
    queryFn: () => ConferencesAPI.get(selectedConferenceId),
    enabled: !!selectedConferenceId,
  });

  // Query pentru articolele din conferinta selectata
  const papersQuery = useQuery({
    queryKey: ["conferencePapers", selectedConferenceId],
    queryFn: () => ConferencesAPI.papers(selectedConferenceId),
    enabled: !!selectedConferenceId,
  });

  const selectedConference = conferenceDetailsQuery.data || null;
  const assignedReviewers = Array.isArray(selectedConference?.reviewers)
    ? selectedConference.reviewers
    : [];

  // State pentru formularul de creare conferinta
  const [title, setTitle] = useState("New Conference");
  const [location, setLocation] = useState("București");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  });

  const createConferenceMutation = useMutation({
    mutationFn: async () => {
      clearBanner();
      const t = title?.trim() || "";
      const loc = location?.trim() || "";

      if (t.length < 3) throw new Error("Titlul trebuie să aibă minim 3 caractere.");
      if (loc.length < 2) throw new Error("Locația trebuie să aibă minim 2 caractere.");
      if (!date) throw new Error("Data este obligatorie.");
      if (!user?.id) throw new Error("Nu ești autentificat.");

      return ConferencesAPI.create({
        title: t,
        location: loc,
        date,
        organizerId: user.id,
      });
    },
    onSuccess: async () => {
      showSuccess("Conferință creată cu succes!");
      await qc.invalidateQueries({ queryKey: ["conferences"] });
      const fresh = await ConferencesAPI.list();
      const list = Array.isArray(fresh) ? fresh : [];
      const mine = user?.id ? list.filter((c) => c.organizerId === user.id) : list;
      const newest = mine.reduce((acc, c) => (!acc || c.id > acc.id ? c : acc), null);
      if (newest) setSelectedConferenceId(String(newest.id));
    },
    onError: (e) => showError(e, "Eroare la creare conferință."),
  });

  // State pentru assign reviewers
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [reviewerFilter, setReviewerFilter] = useState("");

  useEffect(() => {
    if (!selectedConferenceId) return;
    const ids = assignedReviewers.map((r) => r.id);
    setSelectedReviewerIds(ids);
  }, [selectedConferenceId, conferenceDetailsQuery.data]);

  const assignReviewersMutation = useMutation({
    mutationFn: async () => {
      clearBanner();
      if (!selectedConferenceId) throw new Error("Selectează o conferință.");
      if (selectedReviewerIds.length < 2)
        throw new Error("Selectează minim 2 revieweri.");

      return ConferencesAPI.assignReviewers(
        selectedConferenceId,
        selectedReviewerIds.map(Number)
      );
    },
    onSuccess: async () => {
      showSuccess("Revieweri salvați cu succes!");
      await qc.invalidateQueries({ queryKey: ["conference", selectedConferenceId] });
    },
    onError: (e) => showError(e, "Eroare la alocare revieweri."),
  });

  function toggleReviewer(id) {
    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredReviewers = useMemo(() => {
    const q = reviewerFilter.trim().toLowerCase();
    if (!q) return reviewers;
    return reviewers.filter((r) => {
      const hay = `${r.id} ${r.name || ""} ${r.email || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reviewers, reviewerFilter]);

  const papers = Array.isArray(papersQuery.data) ? papersQuery.data : [];

  if (!user) return null;

  const isLoadingTop = conferencesQuery.isLoading || usersQuery.isLoading;

  const canCreate =
    !createConferenceMutation.isPending &&
    !!title?.trim() &&
    !!location?.trim() &&
    !!date;

  const canSaveReviewers =
    !!selectedConferenceId &&
    !assignReviewersMutation.isPending &&
    selectedReviewerIds.length >= 2;

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Organizator Dashboard</h1>
        <p className="page-subtitle">Gestionează conferințele și reviewerii</p>
      </div>

      <StatusBanner type={banner.type} message={banner.message} onClose={clearBanner} />

      {isLoadingTop && (
        <div className="loading" style={{ marginBottom: "1rem" }}>
          <span className="spinner"></span>
          <span>Se încarcă datele...</span>
        </div>
      )}

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Conferences Section */}
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Conferințele Mele</h3>

            {myConferences.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>Nu ai conferințe încă. Creează una mai jos.</p>
            ) : (
              <div className="form-group">
                <label>Selectează conferință</label>
                <select
                  value={selectedConferenceId || ""}
                  onChange={(e) => setSelectedConferenceId(e.target.value)}
                >
                  {myConferences.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      #{c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="section-divider"></div>

            <h4 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Creează conferință nouă</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Titlu</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Numele conferinței"
                />
              </div>

              <div className="form-group">
                <label>Locație</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="București"
                />
              </div>

              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <button
                onClick={() => createConferenceMutation.mutate()}
                disabled={!canCreate}
              >
                {createConferenceMutation.isPending ? (
                  <>
                    <span className="spinner"></span>
                    Se creează...
                  </>
                ) : (
                  "Creează conferință"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Reviewers Section */}
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Alocă Revieweri</h3>

            {!selectedConferenceId && (
              <p style={{ color: "var(--text-muted)" }}>Selectează o conferință din stânga.</p>
            )}

            {selectedConferenceId && conferenceDetailsQuery.isLoading && (
              <div className="loading">
                <span className="spinner"></span>
                <span>Se încarcă...</span>
              </div>
            )}

            {selectedConferenceId && selectedConference && (
              <>
                <div className="glass-card-static" style={{ marginBottom: "1rem", padding: "1rem" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{selectedConference.title}</strong>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    {selectedConference.location} •  {String(selectedConference.date)}
                  </div>
                </div>

                {reviewers.length === 0 ? (
                  <p style={{ color: "var(--text-muted)" }}>Nu există utilizatori cu rol reviewer.</p>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Caută reviewer</label>
                      <input
                        value={reviewerFilter}
                        onChange={(e) => setReviewerFilter(e.target.value)}
                        placeholder="Nume, email sau ID..."
                      />
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setSelectedReviewerIds(reviewers.map((r) => r.id))}
                      >
                        Selectează tot
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setSelectedReviewerIds([])}
                      >
                        Resetează
                      </button>
                    </div>

                    <div className="reviewer-list">
                      {filteredReviewers.map((r) => (
                        <label key={r.id} className="reviewer-item">
                          <input
                            type="checkbox"
                            checked={selectedReviewerIds.includes(r.id)}
                            onChange={() => toggleReviewer(r.id)}
                          />
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                              {r.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {r.email}
                            </div>
                          </div>
                        </label>
                      ))}
                      {filteredReviewers.length === 0 && (
                        <p style={{ color: "var(--text-muted)" }}>Niciun reviewer găsit.</p>
                      )}
                    </div>

                    <button
                      onClick={() => assignReviewersMutation.mutate()}
                      disabled={!canSaveReviewers}
                      style={{ marginTop: "1rem", width: "100%" }}
                    >
                      {assignReviewersMutation.isPending ? (
                        <>
                          <span className="spinner"></span>
                          Se salvează...
                        </>
                      ) : (
                        `Salvează revieweri (${selectedReviewerIds.length})`
                      )}
                    </button>

                    {assignedReviewers.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <h4 style={{ marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          Alocați curent:
                        </h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {assignedReviewers.map((r) => (
                            <span key={r.id} className="badge badge-info">
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Papers Monitoring */}
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">Monitorizare Articole</h3>

            {!selectedConferenceId && (
              <p style={{ color: "var(--text-muted)" }}>Selectează o conferință.</p>
            )}

            {selectedConferenceId && papersQuery.isLoading && (
              <div className="loading">
                <span className="spinner"></span>
                <span>Se încarcă...</span>
              </div>
            )}

            {selectedConferenceId && !papersQuery.isLoading && papers.length === 0 && (
              <div className="empty-state" style={{ padding: "2rem" }}>

                <p style={{ color: "var(--text-muted)", margin: 0 }}>Niciun articol pentru această conferință.</p>
              </div>
            )}

            {papers.length > 0 && (
              <div style={{ display: "grid", gap: "1rem" }}>
                {papers.map((p) => (
                  <PaperMonitorCard key={p.id} paper={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperMonitorCard({ paper }) {
  const reviews = Array.isArray(paper?.reviews) ? paper.reviews : [];

  // Status badge color
  const statusConfig = {
    IN_REVIEW: { class: "badge-warning", label: "În recenzie" },
    APPROVED: { class: "badge-success", label: "Aprobat" },
    REJECTED: { class: "badge-error", label: "Respins" },
    NEEDS_REVISIONS: { class: "badge-info", label: "Necesită revizuiri" },
  };

  const status = statusConfig[paper.status] || { class: "badge-neutral", label: paper.status };

  return (
    <div className="glass-card-static" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            #{paper.id} — {paper.title}
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {paper.author?.name || `Author ID: ${paper.authorId}`}
          </div>
        </div>
        <span className={`badge ${status.class}`}>{status.label}</span>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0.75rem 0" }}>
        {paper.abstract}
      </p>

      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
        Versiune: {paper.currentVersionLink}
      </div>

      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          Reviews ({reviews.length}):
        </div>
        {reviews.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Fără recenzii încă.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ fontSize: "0.875rem", padding: "0.5rem", background: "var(--bg-tertiary)", borderRadius: "8px" }}>
                <strong style={{ color: "var(--text-primary)" }}>
                  {r.reviewer?.name || `Reviewer #${r.reviewerId}`}
                </strong>
                {" — "}
                <span style={{ color: r.verdict === "approved" ? "var(--color-success)" : r.verdict === "rejected" ? "var(--color-error)" : "var(--color-warning)" }}>
                  {r.verdict || "pending"}
                </span>
                {r.comments && (
                  <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    "{r.comments}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
