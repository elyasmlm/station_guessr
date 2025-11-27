import LineImageBadge from "./LineImageBadge";

interface StationLinesPanelProps {
  lines: string[];
  city: string;
  arrondissement: number | null | undefined;
  showCity: boolean;
  embedded?: boolean;
}

function StationLinesPanel({
  lines,
  city,
  arrondissement,
  showCity,
  embedded = false,
}: StationLinesPanelProps) {
  const content = (
    <>
      <div className="card-header">
        <h2 className="card-title">Indices</h2>
        <span className="card-tag">Lignes connues</span>
      </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {lines.map((line) => (
                <LineImageBadge key={line} line={line} />
            ))}
            {lines.length === 0 && (
                <p className="text-muted">Aucune ligne révélée pour l'instant.</p>
            )}
        </div>


      {showCity && (
        <p style={{ marginTop: "0.75rem" }}>
          Ville / zone :{" "}
          <strong>
            {city}
            {arrondissement ? ` (${arrondissement}ᵉ)` : ""}
          </strong>
        </p>
      )}
    </>
  );

  if (embedded) {
    return <>{content}</>;
  }

  return <section className="card card-soft">{content}</section>;
}

export default StationLinesPanel;
