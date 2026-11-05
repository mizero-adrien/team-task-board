import PlaceholderPage from "../../core/ui/PlaceholderPage";

function WorkspacesPage() {
  return (
    <PlaceholderPage
      title="Workspaces"
      owner="Ubald"
      description="Your team homes, with a button to create a new workspace."
      routes={["GET /workspaces", "POST /workspaces"]}
    />
  );
}

export default WorkspacesPage;
