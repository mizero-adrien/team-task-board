import { Link, Navigate, Outlet, useLocation } from "react-router";
import PageLoader from "../../core/ui/PageLoader";
import { useAuth } from "./AuthContext";
import { fromPath } from "./routeState";

// Pages that need a signed-in user
export function RequireAuth() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <PageLoader />;

  if (!user) {
    // Remember where they were going, so signing in brings them back
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

// Admin pages. This only controls what the SCREEN shows: the real protection is the server.
export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Admins only</h1>
        <p className="mt-2 text-sm text-slate-500">Your account doesn't have access to this area.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Back home
        </Link>
      </section>
    );
  }

  return <Outlet />;
}

// Sign in and sign up pages. A signed-in user is sent onwards, to where they were headed.
export function GuestOnly() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <PageLoader />;
  if (user) return <Navigate to={fromPath(location.state)} replace />;

  return <Outlet />;
}
