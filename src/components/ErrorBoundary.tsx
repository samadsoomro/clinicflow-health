import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-card">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">Something went wrong</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page or return to the homepage.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="px-6"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={() => window.location.href = "/"}
              className="px-6"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
