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
  // State pentru banner-ul de notificari (erori, succes)
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
      //alert("Review trimis.");
      showSuccess("Review trimis.");
    },
    onError: (e) => {
      //alert(e?.response?.data?.message || "Eroare la trimiterea review-ului.");
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

  return (
    <div>
      <h2>Reviewer dashboard</h2>
      <StatusBanner type={banner.type} message={banner.message} onClose={clearBanner} />

      {papersQuery.isLoading && <p>Loading...</p>}
      {papersQuery.error && <p style={{ color: "crimson" }}>Eroare la încărcare.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h3>Articole alocate</h3>
          {papers.length === 0 ? (
            <p>Niciun articol alocat.</p>
          ) : (
            <ul>
              {papers.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedPaperId(p.id)}
                    style={{
                      fontWeight: p.id === selectedPaperId ? "bold" : "normal",
                      cursor: "pointer",
                    }}
                  >
                    #{p.id} — {p.title} ({p.status})
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Detalii articol</h3>
          {!selectedPaperId && <p>Selectează un articol.</p>}

          {selectedPaperId && paperDetailsQuery.isLoading && <p>Loading details...</p>}

          {selectedPaperId && paperDetailsQuery.data && (
            <PaperReviewPanel
              paper={paperDetailsQuery.data}
              reviewerId={user.id}
              onSubmit={(verdict, comments) =>
                reviewMutation.mutate({ paperId: selectedPaperId, verdict, comments })
              }
              submitting={reviewMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

//function PaperReviewPanel({ paper, onSubmit, submitting }) {
function PaperReviewPanel({ paper, reviewerId, onSubmit, submitting }) {
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
        <strong>Versiune curentă:</strong> {paper.currentVersionLink}
      </p>

      <h4>Trimite review</h4>
      <div style={{ display: "grid", gap: 8 }}>
        <select value={verdict} onChange={(e) => setVerdict(e.target.value)}>
          <option value="approved">approved</option>
          <option value="changes_requested">changes_requested</option>
          <option value="rejected">rejected</option>
        </select>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Comments"
          rows={4}
        />

        <button onClick={() => onSubmit(verdict, comments)} disabled={submitting}>
          {submitting ? "Sending..." : "Send review"}
        </button>
      </div>

      {/* {Array.isArray(paper.Reviews) && ( */}
      {Array.isArray(paper.reviews) && (
        <>
          <h4 style={{ marginTop: 16 }}>Reviews existente</h4>
          <ul>
            {/* {paper.Reviews.map((r) => ( */}
            {paper.reviews.map((r) => (
              <li key={r.id}>
                {/* reviewerId={r.reviewerId} — verdict={r.verdict || "(pending)"} — {r.comments || ""} */}
                <strong>{r.reviewer?.name || `reviewerId=${r.reviewerId}`}</strong>
                {" — "} verdict={r.verdict || "(pending)"} — {r.comments || ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
