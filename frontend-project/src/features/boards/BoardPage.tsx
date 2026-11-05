import PlaceholderPage from "../../core/ui/PlaceholderPage";

function BoardPage() {
  return (
    <PlaceholderPage
      title="Board"
      owner="Adrien"
      description="Lists as columns, cards, activity history, and the AI task breakdown entry point."
      routes={[
        "GET /boards/:boardId",
        "GET /boards/:boardId/activity",
        "POST /boards/:boardId/lists",
        "PATCH /lists/:listId",
        "POST /lists/:listId/move",
        "DELETE /lists/:listId",
      ]}
    />
  );
}

export default BoardPage;
