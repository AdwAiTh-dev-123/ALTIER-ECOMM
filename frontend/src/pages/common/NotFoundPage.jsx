import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: "65vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "560px", width: "100%" }}>
        <span
          className="editorial-eyebrow"
          style={{
            letterSpacing: "0.2em",
            color: "var(--color-primary-muted, #737373)",
            marginBottom: "0.75rem",
            display: "inline-block",
          }}
        >
          404 ERROR &bull; PAGE UNREACHABLE
        </span>

        <h1
          className="editorial-title"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            margin: "0.5rem 0 1rem 0",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            color: "var(--color-text-secondary, #525252)",
            fontSize: "1rem",
            lineHeight: "1.6",
            marginBottom: "2rem",
          }}
        >
          The page or product you are looking for has either been moved,
          archived, or does not exist in our current catalog.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/collections"
            className="btn btn-primary"
            style={{ padding: "0.85rem 2rem" }}
          >
            Explore Collections &rarr;
          </Link>
          <Link
            to="/"
            className="btn btn-secondary"
            style={{ padding: "0.85rem 2rem" }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
