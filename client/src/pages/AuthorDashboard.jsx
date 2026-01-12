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
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const clearBanner = () => setBanner({ type: "info", message: "" });
  const showSuccess = (message) => setBanner({ type: "success", message });
  const showError = (err, fallback) =>
    setBanner({ type: "error", message: getErrorMessage(err, fallback) });

  // ---- state (submit form)
  const [conferenceId, setConferenceId] = useState(""); // useState(() => (conferences[0]?.id ? String(conferences[0].id) : ""));
  const [title, setTitle] = useState("My Paper Title");
  const [abstract, setAbstract] = useState("Short abstract...");
  const [currentVersionLink, setCurrentVersionLink] = useState("v1.pdf");

  const [registeredConferenceIds, setRegisteredConferenceIds] = useState(() => new Set());

  const isRegisteredHere = conferenceId
    ? registeredConferenceIds.has(Number(conferenceId))
    : false;

  const registerMutation = useMutation({
    mutationFn: async () => {
      clearBanner();
      if (!conferenceId) throw new Error("Selectează o conferință.");
      //return ConferencesAPI.registerAuthor(Number(conferenceId), user.id);
      if (!user?.id) throw new Error("Nu ești autentificat.");
      return ConferencesAPI.registerAuthor(Number(conferenceId), user.id);
    },
    onSuccess: async () => {
      setRegisteredConferenceIds((prev) => {
        const next = new Set(prev);
        next.add(Number(conferenceId));
        return next;
      });
      showSuccess("Autor înregistrat la conferință (demo).");
    },
    onError: (e) => showError(e, "Eroare la înregistrarea autorului."),
  });


  // ---- queries
  const conferencesQuery = useQuery({
    queryKey: ["conferences"],
    queryFn: ConferencesAPI.list,
  });

  const papersQuery = useQuery({
    queryKey: ["papers"],
    queryFn: PapersAPI.list,
  });

  // ---- derived
  const conferences = Array.isArray(conferencesQuery.data) ? conferencesQuery.data : [];
  const allPapers = Array.isArray(papersQuery.data) ? papersQuery.data : [];
  const myPapers = useMemo(() => allPapers.filter((p) => p.authorId === user?.id), [allPapers, user]);



  // // when conferences load, default conferenceId if empty
  // if (!conferenceId && conferences.length > 0) {
  //   // safe: set state only if it's empty
  //   setTimeout(() => setConferenceId(String(conferences[0].id)), 0);
  // }

  // when conferences load, default conferenceId if empty
  useEffect(() => {
    if (!conferenceId && conferences.length > 0) {
      setConferenceId(String(conferences[0].id));
    }
  }, [conferenceId, conferences]);

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
      // alert("Articol trimis. Reviewerii au fost alocați automat.");
      showSuccess("Articol trimis. Reviewerii au fost alocați automat.");
    },
    onError: (e) => {
      // alert(e?.response?.data?.message || "Eroare la trimiterea articolului.");
      showError(e, "Eroare la trimiterea articolului.");
    },
  });

  // ---- details + version upload
  const [selectedPaperId, setSelectedPaperId] = useState(null);

  const paperDetailsQuery = useQuery({
    queryKey: ["paper", selectedPaperId],
    queryFn: () => PapersAPI.get(selectedPaperId),
    enabled: !!selectedPaperId,
  });

  const [newVersionLink, setNewVersionLink] = useState("v2.pdf");

  const newVersionMutation = useMutation({
    mutationFn: () => PapersAPI.newVersion(selectedPaperId, newVersionLink),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["papers"] });
      await qc.invalidateQueries({ queryKey: ["paper", selectedPaperId] });
      //alert("Versiune nouă încărcată. Status resetat la IN_REVIEW.");
      showSuccess("Versiune nouă încărcată. Status resetat la IN_REVIEW.");
    },
    onError: (e) => {
      //alert(e?.response?.data?.message || "Eroare la încărcarea versiunii.");
      showError(e, "Eroare la încărcarea versiunii.");
    },
  });

  if (!user) return null;

  return (
    <div>
      <StatusBanner type={banner.type} message={banner.message} onClose={clearBanner} />

      <h2>Author dashboard</h2>

      <section style={sectionStyle}>
        <h3>Submit paper</h3>

        {conferencesQuery.isLoading && <p>Loading conferences...</p>}
        {conferencesQuery.error && <p style={{ color: "crimson" }}>Eroare la încărcare conferințe.</p>}

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => registerMutation.mutate()}
            disabled={!conferenceId || registerMutation.isPending || isRegisteredHere}
          >
            {isRegisteredHere
              ? "Registered"
              : registerMutation.isPending
                ? "Registering..."
                : "Register to conference"}
          </button>

          <small>
            Cerință: autorul se înregistrează la conferință înainte de trimiterea articolului.
          </small>
        </div>


        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!conferenceId) return showError(null, "Selectează o conferință.");
            submitMutation.mutate();
          }}
          style={{ display: "grid", gap: 10, maxWidth: 520 }}
        >
          <label>
            Conference
            <select value={conferenceId} onChange={(e) => setConferenceId(e.target.value)} disabled={conferences.length === 0}>
              {conferences.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  #{c.id} — {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Abstract
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} />
          </label>

          <label>
            Version link (demo)
            <input value={currentVersionLink} onChange={(e) => setCurrentVersionLink(e.target.value)} placeholder="v1.pdf" />
          </label>

          <button type="submit" disabled={submitMutation.isPending || !conferenceId}>
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        </form>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={sectionStyle}>
          <h3>My papers</h3>

          {papersQuery.isLoading && <p>Loading papers...</p>}
          {papersQuery.error && <p style={{ color: "crimson" }}>Eroare la încărcare articole.</p>}

          {myPapers.length === 0 ? (
            <p>Nu ai articole încă.</p>
          ) : (
            <ul>
              {myPapers.map((p) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setSelectedPaperId(p.id)}
                    style={{
                      cursor: "pointer",
                      fontWeight: selectedPaperId === p.id ? "bold" : "normal",
                    }}
                  >
                    #{p.id} — {p.title} ({p.status})
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={sectionStyle}>
          <h3>Paper details</h3>

          {!selectedPaperId && <p>Selectează un articol din listă.</p>}

          {selectedPaperId && paperDetailsQuery.isLoading && <p>Loading details...</p>}
          {selectedPaperId && paperDetailsQuery.error && <p style={{ color: "crimson" }}>Eroare la detalii articol.</p>}

          {selectedPaperId && paperDetailsQuery.data && (
            <AuthorPaperDetails
              paper={paperDetailsQuery.data}
              newVersionLink={newVersionLink}
              setNewVersionLink={setNewVersionLink}
              onUpload={() => newVersionMutation.mutate()}
              uploading={newVersionMutation.isPending}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function AuthorPaperDetails({ paper, newVersionLink, setNewVersionLink, onUpload, uploading }) {
  const canUploadNewVersion = paper.status === "NEEDS_REVISIONS";

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <p>
        <strong>{paper.title}</strong>
      </p>
      <p>{paper.abstract}</p>

      <p>
        <strong>Status:</strong> {paper.status}
      </p>

      <p>
        <strong>Current version:</strong> {paper.currentVersionLink}
      </p>

      {/* {Array.isArray(paper.versionHistory) && paper.versionHistory.length > 0 && (
        <>
          <p>
            <strong>Version history:</strong>
          </p>
          <ul>
            {paper.versionHistory.map((v, idx) => (
              <li key={`${v}-${idx}`}>{v}</li>
            ))}
          </ul>
        </>
      )} */}

      {Array.isArray(paper.versionHistory) && paper.versionHistory.length > 0 && (
        <>
          <p>
            <strong>Version history:</strong>
          </p>
          <ul>
            {paper.versionHistory.map((vh, idx) => {
              // dacă backend-ul/DB-ul ar întoarce cândva string-uri
              if (typeof vh === "string") {
                return <li key={`${vh}-${idx}`}>{vh}</li>;
              }

              const ver = vh?.version ?? idx + 1;
              const link = vh?.link ?? "(no link)";
              const dateLabel = vh?.date ? new Date(vh.date).toLocaleString() : "";

              return (
                <li key={`v${ver}-${idx}`}>
                  <strong>v{ver}</strong>: {link} {dateLabel ? `— ${dateLabel}` : ""}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <hr />

      <h4>Upload new version</h4>
      {!canUploadNewVersion && <p>Poți încărca versiune nouă doar dacă status este NEEDS_REVISIONS.</p>}

      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input value={newVersionLink} onChange={(e) => setNewVersionLink(e.target.value)} placeholder="v2.pdf" />
        <button onClick={onUpload} disabled={!canUploadNewVersion || uploading}>
          {uploading ? "Uploading..." : "Upload version"}
        </button>
      </div>

      {Array.isArray(paper.reviews) && (
        <>
          <h4 style={{ marginTop: 16 }}>Reviews</h4>
          <ul>
            {paper.reviews.map((r) => (
              <li key={r.id}>
                reviewerId={r.reviewerId} — verdict={r.verdict || "(pending)"} — {r.comments || ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const sectionStyle = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 8,
};
