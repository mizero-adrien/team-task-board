import { Route, Routes } from "react-router";
import AppLayout from "./core/layout/AppLayout";
import NotFoundPage from "./core/pages/NotFoundPage";
import AdminLayout from "./features/admin/AdminLayout";
import AdminPage from "./features/admin/AdminPage";
import AdminUsersPage from "./features/admin/AdminUsersPage";
import AdminWorkspacesPage from "./features/admin/AdminWorkspacesPage";
import { GuestOnly, RequireAdmin, RequireAuth } from "./features/auth/guards";
import LoginPage from "./features/auth/LoginPage";
import SignUpPage from "./features/auth/SignUpPage";
import BoardPage from "./features/boards/BoardPage";
import MyCardsPage from "./features/cards/MyCardsPage";
import HomePage from "./features/landing/HomePage";
import WorkspacePage from "./features/workspaces/WorkspacePage";
import WorkspacesPage from "./features/workspaces/WorkspacesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
          <Route path="/my-cards" element={<MyCardsPage />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="workspaces" element={<AdminWorkspacesPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
