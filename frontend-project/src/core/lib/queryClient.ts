import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError } from "../api/client";

const FORBIDDEN_MESSAGE = "You don't have permission to do that.";

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

// Session problems are handled by AuthContext (it signs the user out), not here
const isSessionError = (error: ApiError) => error.status === 401 || error.code === "ACCOUNT_BLOCKED";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!(error instanceof ApiError) || isSessionError(error)) return;

      if (error.status === 403) {
        toast.error(FORBIDDEN_MESSAGE, { id: "forbidden" });
        return;
      }

      // A first-load failure is shown by the screen's own error box.
      // A failed background refresh has no screen of its own, so we say it here.
      if (query.state.data !== undefined) {
        toast.error("Could not refresh the latest data.", { id: "refresh-failed" });
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error) => {
      // Forms and buttons report their own errors. Permission problems are
      // the one case worth saying the same way everywhere.
      if (error instanceof ApiError && error.status === 403 && !isSessionError(error)) {
        toast.error(FORBIDDEN_MESSAGE, { id: "forbidden" });
      }
    },
  }),

  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Retrying a 404 or a validation error can never succeed, so only network and server errors retry
      retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
    },
  },
});
