import { Route, Routes } from "react-router";
import AppLayout from "./core/layout/AppLayout";
import NotFoundPage from "./core/pages/NotFoundPage";
import AdminPage from "./features/admin/AdminPage";
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
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
