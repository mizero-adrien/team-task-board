import PlaceholderPage from "../../core/ui/PlaceholderPage";

function WorkspacePage() {
  return (
    <PlaceholderPage
      title="Workspace"
      owner="Ubald"
      description="The workspace's boards and members, plus the invite controls for owners."
      routes={[
        "GET /workspaces/:workspaceId",
        "GET /workspaces/:workspaceId/boards",
        "POST /workspaces/:workspaceId/boards",
        "GET /workspaces/:workspaceId/members",
      ]}
    />
  );
}

export default WorkspacePage;
