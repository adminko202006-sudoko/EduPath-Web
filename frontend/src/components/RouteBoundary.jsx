import { Component, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorState, LoadingState } from './ui/Shared';

class PageErrorBoundary extends Component {
  state = { failed: false, routeKey: null };

  static getDerivedStateFromProps(props, state) {
    return props.routeKey !== state.routeKey
      ? { failed: false, routeKey: props.routeKey }
      : null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Keep diagnostic details out of the rendered error message.
    console.error('Unable to render EduPath page:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="mx-auto w-full max-w-xl p-6" role="alert">
          <ErrorState
            message="This page could not be loaded. Reload to try again. Unsaved changes may be lost."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RouteBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <PageErrorBoundary routeKey={pathname}>
      <Suspense fallback={<LoadingState message="Loading page..." />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}
