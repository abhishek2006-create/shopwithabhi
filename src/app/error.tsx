"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-body">
      <div className="page-heading">
        <h1>A small interruption.</h1>
        <p>We couldn’t load this page. Please try again in a moment.</p>
      </div>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
