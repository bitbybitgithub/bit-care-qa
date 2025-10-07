import React from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <section className="page_404">
            <div className="page_404_bg">
              <h1 className="header_main">404</h1>
            </div>

            <div className="content_box_404">
              <h3 className="content_header">Looks like you're lost</h3>
              <p>The page you are looking for is not available!</p>
              <Link to="/dashboard" className="link_404">
                Go to Home
              </Link>
            </div>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
