import PlaceholderPage from "../../core/ui/PlaceholderPage";

function AdminPage() {
  return (
    <PlaceholderPage
      title="Admin"
      owner="Ubald"
      description="Platform numbers, all users and workspaces, plus account blocking."
      routes={[
        "GET /admin/stats",
        "GET /admin/users",
        "POST /admin/users/:userId/block",
        "POST /admin/users/:userId/unblock",
        "GET /admin/workspaces",
      ]}
    />
  );
}

export default AdminPage;
