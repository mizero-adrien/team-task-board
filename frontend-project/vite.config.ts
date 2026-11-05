import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // If 5173 is busy, fail instead of picking another port. The backend only
    // allows requests from http://localhost:5173 (FRONTEND_URL in its .env).
    strictPort: true,
  },
});