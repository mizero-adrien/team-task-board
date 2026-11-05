import PlaceholderPage from "../../core/ui/PlaceholderPage";

function MyCardsPage() {
  return (
    <PlaceholderPage
      title="My cards"
      owner="Rachel"
      description="Everything assigned to you, sorted by due date."
      routes={["GET /cards/mine"]}
    />
  );
}

export default MyCardsPage;
