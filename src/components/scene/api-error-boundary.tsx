"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="text-xs text-[var(--color-text-muted)] py-4">
            Unable to load data — will retry automatically.
          </p>
        )
      );
    }
    return this.props.children;
  }
}
