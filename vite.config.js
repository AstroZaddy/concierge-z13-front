import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 4322,
    allowedHosts: [
      "z13astrology.com",
      "www.z13astrology.com",
    ],
  },
});