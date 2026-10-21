export default function Loading() {
  return (
    <div
      className="container page-body"
      aria-label="Loading content"
      aria-busy="true"
    >
      <div className="page-heading">
        <div className="skeleton" style={{ height: 90 }} />
      </div>
      <div className="content-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
