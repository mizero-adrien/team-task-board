// Where to go after signing in. Only paths inside this app are accepted,
// so a crafted link can never send someone to another website.
export function fromPath(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const { from } = state as { from: unknown };
    if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) return from;
  }

  return "/workspaces";
}
