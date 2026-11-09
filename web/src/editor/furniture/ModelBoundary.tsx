import { Component, type ReactNode } from "react";

interface ModelBoundaryProps {
  /** Shown instead when a model cannot be loaded: offline, or the CDN is unreachable. */
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps a model that fails to load from taking the whole scene down with it. */
export class ModelBoundary extends Component<ModelBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
