import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground px-4 text-center">
          <h1 className="text-xl font-bold">Đã xảy ra lỗi khi hiển thị trang</h1>
          <p className="text-muted-foreground">Bạn có thể tải lại trang hoặc quay về trang chính để tiếp tục.</p>
          <div className="flex flex-wrap gap-3"><button onClick={() => window.location.reload()} className="rounded-xl bg-primary text-primary-foreground px-5 py-3">Tải lại trang</button><a href="/" className="rounded-xl border border-border px-5 py-3">Về trang chính</a></div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
