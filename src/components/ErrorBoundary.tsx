import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Catches unhandled React render errors so they don't crash the entire app.
 * Wrap the <Routes> tree (or individual routes) with this component.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Log to console in dev; swap for a real error reporting service in prod.
        console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-card border border-destructive/30 rounded-xl p-8 text-center">
                        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={26} className="text-destructive" />
                        </div>
                        <h1 className="font-heading font-bold text-xl text-foreground mb-2">
                            Something went wrong
                        </h1>
                        <p className="font-body text-sm text-muted-foreground mb-2">
                            An unexpected error occurred. If this keeps happening, please
                            refresh the page or contact support.
                        </p>
                        {this.state.error && (
                            <p className="font-mono text-xs text-destructive/80 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 mb-6 text-left break-all">
                                {this.state.error.message}
                            </p>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => window.location.assign("/")}
                            >
                                Go Home
                            </Button>
                            <Button variant="hero" onClick={this.handleReset} className="gap-2">
                                <RotateCcw size={14} />
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
