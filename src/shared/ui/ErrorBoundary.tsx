import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Catches a render-time throw, so one bad panel does not blank the page around it.
 *
 * <p>`QueryBoundary` handles a request that failed — a different thing. This handles a component
 * that threw while drawing: a spec with a `grid` of the wrong shape, a column the viz assumed
 * was numeric, a null where an array was expected. On a dashboard rendering thirty panels from
 * imported definitions, that is not hypothetical.
 *
 * <p>Still a class: React has no hook for this, and `componentDidCatch` is the only way in.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged, not swallowed: a panel that quietly renders a fallback forever is a bug nobody
    // is ever told about.
    console.error("Panel render failed:", error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
