import { BookOpen } from "lucide-react";
export function Empty({
  title = "Good things take a little research.",
  description = "Our editors are putting this collection together. Published picks will appear here as soon as they’re ready.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <BookOpen size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="eyebrow">Considered, never rushed</span>
    </div>
  );
}
