function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand"
      />
    </div>
  );
}

export default PageLoader;
