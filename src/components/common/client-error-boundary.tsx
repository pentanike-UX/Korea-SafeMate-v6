"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = { hasError: boolean };

export class ClientErrorBoundary extends Component<Props, State> {
  // Minimal React error boundary without external deps.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getDerivedStateFromError(_err: any): State {
    return { hasError: true };
  }

  state: State = { hasError: false };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(err: any) {
    // Keep logs for Vercel runtime debugging.
    // eslint-disable-next-line no-console
    console.error("[ClientErrorBoundary]", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="text-text-strong text-base font-semibold">데이터를 불러오지 못했어요</p>
            <p className="text-muted-foreground text-sm">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

