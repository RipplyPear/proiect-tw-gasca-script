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
import { card, grid2, field } from "../ui/styles";

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
  // Lista conferintelor
  const conferencesQuery = useQuery({
    queryKey: ["conferences"],
    queryFn: ConferencesAPI.list,
  });

  // Lista tuturor utilizatorilor (pentru a extrage reviewerii)
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

  // implicit: prima conferință (dacă există)
  useEffect(() => {
    if (!selectedConferenceId && myConferences.length > 0) {
      setSelectedConferenceId(String(myConferences[0].id));
    }
  }, [myConferences, selectedConferenceId]);

  // Query pentru detaliile conferintei selectate (include reviewerii alocati)
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
      showSuccess("Conferință creată.");
      await qc.invalidateQueries({ queryKey: ["conferences"] });

      // selectează “cea mai nouă” conferință a organizatorului
      const fresh = await ConferencesAPI.list();
      const list = Array.isArray(fresh) ? fresh : [];
      const mine = user?.id ? list.filter((c) => c.organizerId === user.id) : list;
      const newest = mine.reduce((acc, c) => (!acc || c.id > acc.id ? c : acc), null);

      if (newest) setSelectedConferenceId(String(newest.id));
    },
    onError: (e) => showError(e, "Eroare la creare conferință."),
  });

  // ---------- Assign reviewers state
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [reviewerFilter, setReviewerFilter] = useState("");

  // pre-bifează alocații existenți
  useEffect(() => {
    if (!selectedConferenceId) return;
    const ids = assignedReviewers.map((r) => r.id);
    setSelectedReviewerIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConferenceId, conferenceDetailsQuery.data]);

  const assignReviewersMutation = useMutation({
    mutationFn: async () => {
      clearBanner();
      if (!selectedConferenceId) throw new Error("Selectează o conferință.");
      if (selectedReviewerIds.length < 2)
        throw new Error("Selectează minim 2 revieweri (recomandat pentru submit papers).");

      return ConferencesAPI.assignReviewers(
        selectedConferenceId,
        selectedReviewerIds.map(Number)
      );
    },
    onSuccess: async () => {
      showSuccess("Revieweri salvați.");
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

  // ---------- Guards
  if (!user) return null;

  const isLoadingTop =
    conferencesQuery.isLoading || usersQuery.isLoading;

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
    <div>
      <h2>Organizer dashboard</h2>

      <StatusBanner
        type={banner.type}
        message={banner.message}
        onClose={clearBanner}
      />

      {isLoadingTop && <p>Loading...</p>}
      {(conferencesQuery.error || usersQuery.error) && (
        <p style={{ color: "crimson" }}>
          Eroare la încărcarea datelor inițiale (conferințe/users).
        </p>
      )}

      <div style={grid2}>
        {/* LEFT */}
        <div style={card}>
          <h3>Conferințe</h3>

          {myConferences.length === 0 ? (
            <p>(Nu ai conferințe încă. Creează una mai jos.)</p>
          ) : (
            <label style={field}>
              Selectează conferință
              <select
                value={selectedConferenceId || ""}
                onChange={(e) => setSelectedConferenceId(e.target.value)}
                disabled={myConferences.length === 0}
              >
                {myConferences.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    #{c.id} — {c.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <hr style={{ margin: "16px 0" }} />

          <h3>Creează conferință</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={field}>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Conference title"
              />
            </label>

            <label style={field}>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="București"
              />
            </label>

            <label style={field}>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <button
              onClick={() => createConferenceMutation.mutate()}
              disabled={!canCreate}
            >
              {createConferenceMutation.isPending ? "Creating..." : "Create conference"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <h3>Alocare revieweri</h3>

            {!selectedConferenceId && <p>Selectează o conferință.</p>}

            {selectedConferenceId && conferenceDetailsQuery.isLoading && (
              <p>Loading conference details...</p>
            )}

            {selectedConferenceId && conferenceDetailsQuery.error && (
              <p style={{ color: "crimson" }}>Eroare la încărcare detalii conferință.</p>
            )}

            {selectedConferenceId && selectedConference && (
              <>
                <p style={{ marginTop: 0 }}>
                  <strong>{selectedConference.title}</strong> — {selectedConference.location} —{" "}
                  {String(selectedConference.date)}
                </p>

                {reviewers.length === 0 ? (
                  <p>(Nu există utilizatori cu rol reviewer.)</p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    <label style={field}>
                      Caută reviewer
                      <input
                        value={reviewerFilter}
                        onChange={(e) => setReviewerFilter(e.target.value)}
                        placeholder="name/email/id..."
                      />
                    </label>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReviewerIds(reviewers.map((r) => r.id))}
                      >
                        Select all
                      </button>
                      <button type="button" onClick={() => setSelectedReviewerIds([])}>
                        Clear
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      {filteredReviewers.map((r) => (
                        <label
                          key={r.id}
                          style={{ display: "flex", gap: 8, alignItems: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedReviewerIds.includes(r.id)}
                            onChange={() => toggleReviewer(r.id)}
                          />
                          <span>
                            #{r.id} — {r.name} ({r.email})
                          </span>
                        </label>
                      ))}
                      {filteredReviewers.length === 0 && <p>(Niciun reviewer găsit.)</p>}
                    </div>

                    <button
                      onClick={() => assignReviewersMutation.mutate()}
                      disabled={!canSaveReviewers}
                      title={
                        selectedReviewerIds.length < 2
                          ? "Selectează minim 2 revieweri."
                          : ""
                      }
                    >
                      {assignReviewersMutation.isPending ? "Saving..." : "Save reviewers"}
                    </button>

                    <div>
                      <h4 style={{ marginBottom: 8 }}>Alocați acum</h4>
                      {assignedReviewers.length === 0 ? (
                        <p>(Niciun reviewer alocat)</p>
                      ) : (
                        <ul style={{ marginTop: 0 }}>
                          {assignedReviewers.map((r) => (
                            <li key={r.id}>
                              #{r.id} — {r.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={card}>
            <h3>Monitorizare articole (conferință)</h3>

            {!selectedConferenceId && <p>Selectează o conferință.</p>}

            {selectedConferenceId && papersQuery.isLoading && <p>Loading papers...</p>}
            {selectedConferenceId && papersQuery.error && (
              <p style={{ color: "crimson" }}>Eroare la încărcare papers.</p>
            )}

            {selectedConferenceId && !papersQuery.isLoading && papers.length === 0 && (
              <p>(Niciun articol pentru conferința selectată)</p>
            )}

            {papers.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
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

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <strong>
          #{paper.id} — {paper.title}
        </strong>
        <span>
          <strong>Status:</strong> {paper.status}
        </span>
      </div>

      <div style={{ marginTop: 6 }}>
        <div>
          <strong>Author:</strong> {paper.author?.name || `authorId=${paper.authorId}`}
        </div>
        <div>
          <strong>Versiune curentă:</strong> {paper.currentVersionLink}
        </div>
        <div style={{ marginTop: 6 }}>{paper.abstract}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Reviews ({reviews.length}):</strong>
        {reviews.length === 0 ? (
          <div>(no reviews)</div>
        ) : (
          <ul style={{ marginTop: 6 }}>
            {reviews.map((r) => (
              <li key={r.id}>
                <strong>{r.reviewer?.name || `reviewerId=${r.reviewerId}`}</strong>:{" "}
                {r.verdict} — {r.comments || "(no comments)"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
