import { getLineImageInfo } from "../../utils/lineImage";

interface LineImageBadgeProps {
  line: string;
}

export default function LineImageBadge({ line }: LineImageBadgeProps) {
  const info = getLineImageInfo(line);

  return (
    <span
      className="badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.25rem 0.6rem",
      }}
    >
      <img
        src={info.src}
        alt={info.alt}
        style={{
          width: 24,
          height: 24,
          objectFit: "contain",
          display: "block",
        }}
        onError={(e) => {
          // fallback si l'image est manquante
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span>{line}</span>
    </span>
  );
}
