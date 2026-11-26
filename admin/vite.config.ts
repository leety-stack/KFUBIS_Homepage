import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발: 관리자 화면 5183, PocketBase 8095 (/api 넘김)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8095" },
  },
});
