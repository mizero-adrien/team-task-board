import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-brand-soft text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-brand">
            TeamBoard
          </Link>

          {user && (
            <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
              <NavLink to="/workspaces" className={navLinkClass}>
                Workspaces
              </NavLink>
              <NavLink to="/my-cards" className={navLinkClass}>
                My cards
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="hidden text-slate-600 sm:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:border-brand hover:text-brand"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
