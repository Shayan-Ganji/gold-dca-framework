import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error in ${this.props.name || "Component"}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-xl overflow-auto text-xs font-mono text-right">
          <p className="font-bold mb-1">خطا در بارگذاری بخش {this.props.name || ""}:</p>
          <p className="whitespace-pre-wrap text-[11px] opacity-80">{this.state.error?.message || String(this.state.error)}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
