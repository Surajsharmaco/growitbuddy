import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "wouter";

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Defaults to the on-theme error card. */
  fallback?: ReactNode;
  /** Changing this value remounts the boundary, clearing a previous error. */
  resetKey?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors in any descendant so a single broken
 * component never blanks the whole site. Pair with `RouteErrorBoundary`
 * (below) so navigating to another page automatically clears the error.
 */
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof console !== "undefined") {
      console.error("[GrowitBuddy] Page error caught by boundary:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ minHeight: "60vh", padding: 24 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(11,11,11,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 24,
        }}
      >
        ⚠️
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0B0B0B", letterSpacing: "-0.02em", margin: 0 }}>
        Something went wrong
      </h1>
      <p style={{ marginTop: 8, fontSize: 14, color: "rgba(11,11,11,0.55)", maxWidth: 440, lineHeight: 1.55 }}>
        This section ran into an unexpected error. You can reload the page or head back to the homepage.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            border: "none",
            cursor: "pointer",
            background: "#1E293B",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 22px",
            borderRadius: 100,
          }}
        >
          Reload page
        </button>
        <a
          href="/"
          style={{
            textDecoration: "none",
            background: "#FFFFFF",
            color: "#0B0B0B",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 22px",
            borderRadius: 100,
            border: "1.5px solid #E5E5E0",
          }}
        >
          Go to homepage
        </a>
      </div>
    </div>
  );
}

/**
 * Error boundary that automatically resets when the route changes, so a
 * crash on one page doesn't trap the user — navigating elsewhere recovers.
 */
export function RouteErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [location] = useLocation();
  return (
    <ErrorBoundaryInner resetKey={location} fallback={fallback}>
      {children}
    </ErrorBoundaryInner>
  );
}

export default ErrorBoundaryInner;
