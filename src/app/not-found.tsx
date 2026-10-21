import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-body">
      <div className="page-heading">
        <span className="eyebrow">404 · A LITTLE OFF THE PATH</span>
        <h1>This find isn’t here.</h1>
        <p>It may have moved, or it may still be on the editor’s desk.</p>
      </div>
      <Link href="/" className="button">
        Back to discovering ↗
      </Link>
    </div>
  );
}
