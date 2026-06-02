import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TimerProvider } from "./TimerContext";
import "./styles.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "grid", placeItems: "center", minHeight: "100vh",
          color: "#e0dcd5", background: "#1e1c19", padding: 40,
          fontFamily: "Inter, sans-serif",
        }}>
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <h2 style={{ color: "#d4695a", fontSize: "1.3rem", marginBottom: 12 }}>发生错误</h2>
            <p style={{
              background: "#2a2823", padding: 16, borderRadius: 8,
              fontFamily: "monospace", fontSize: "0.85rem", color: "#d4695a",
              whiteSpace: "pre-wrap", wordBreak: "break-all"
            }}>
              {this.state.error?.message || "未知错误"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                marginTop: 20, padding: "10px 24px",
                border: "1px solid #d4695a", borderRadius: 8,
                background: "transparent", color: "#d4695a",
                cursor: "pointer", fontSize: "0.95rem"
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ErrorBoundary>
    <TimerProvider>
      <App />
    </TimerProvider>
  </ErrorBoundary>,
);
