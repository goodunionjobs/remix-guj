// vite.config.ts
import { vitePlugin as remix } from "file:///Users/vonkoff/GoodUnionJobs/remix-guj/node_modules/@remix-run/dev/dist/index.js";
import { sentryVitePlugin } from "file:///Users/vonkoff/GoodUnionJobs/remix-guj/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { glob } from "file:///Users/vonkoff/GoodUnionJobs/remix-guj/node_modules/glob/dist/esm/index.js";
import { flatRoutes } from "file:///Users/vonkoff/GoodUnionJobs/remix-guj/node_modules/remix-flat-routes/dist/index.js";
import { defineConfig } from "file:///Users/vonkoff/GoodUnionJobs/remix-guj/node_modules/vite/dist/node/index.js";
var MODE = process.env.NODE_ENV;
var vite_config_default = defineConfig({
  build: {
    cssMinify: MODE === "production",
    rollupOptions: {
      external: [/node:.*/, "stream", "crypto", "fsevents"]
    },
    assetsInlineLimit: (source) => {
      if (source.endsWith("sprite.svg")) {
        return false;
      }
    },
    sourcemap: true
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            ".*",
            "**/*.css",
            "**/*.test.{js,jsx,ts,tsx}",
            "**/__*.*",
            // This is for server-side utilities you want to colocate
            // next to your routes without making an additional
            // directory. If you need a route that includes "server" or
            // "client" in the filename, use the escape brackets like:
            // my-route.[server].tsx
            "**/*.server.*",
            "**/*.client.*"
          ]
        });
      }
    }),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      disable: MODE !== "production",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: process.env.COMMIT_SHA,
        setCommits: {
          auto: true
        }
      },
      sourcemaps: {
        filesToDeleteAfterUpload: await glob([
          "./build/**/*.map",
          ".server-build/**/*.map"
        ])
      }
    }) : null
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdm9ua29mZi9Hb29kVW5pb25Kb2JzL3JlbWl4LWd1alwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3ZvbmtvZmYvR29vZFVuaW9uSm9icy9yZW1peC1ndWovdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3ZvbmtvZmYvR29vZFVuaW9uSm9icy9yZW1peC1ndWovdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSAnQHJlbWl4LXJ1bi9kZXYnXG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSAnQHNlbnRyeS92aXRlLXBsdWdpbidcbmltcG9ydCB7IGdsb2IgfSBmcm9tICdnbG9iJ1xuaW1wb3J0IHsgZmxhdFJvdXRlcyB9IGZyb20gJ3JlbWl4LWZsYXQtcm91dGVzJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcblxuY29uc3QgTU9ERSA9IHByb2Nlc3MuZW52Lk5PREVfRU5WXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdGJ1aWxkOiB7XG5cdFx0Y3NzTWluaWZ5OiBNT0RFID09PSAncHJvZHVjdGlvbicsXG5cblx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHRleHRlcm5hbDogWy9ub2RlOi4qLywgJ3N0cmVhbScsICdjcnlwdG8nLCAnZnNldmVudHMnXSxcblx0XHR9LFxuXG5cdFx0YXNzZXRzSW5saW5lTGltaXQ6IChzb3VyY2U6IHN0cmluZykgPT4ge1xuXHRcdFx0aWYgKHNvdXJjZS5lbmRzV2l0aCgnc3ByaXRlLnN2ZycpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdH0sXG5cdHBsdWdpbnM6IFtcblx0XHRyZW1peCh7XG5cdFx0XHRpZ25vcmVkUm91dGVGaWxlczogWycqKi8qJ10sXG5cdFx0XHRzZXJ2ZXJNb2R1bGVGb3JtYXQ6ICdlc20nLFxuXHRcdFx0cm91dGVzOiBhc3luYyBkZWZpbmVSb3V0ZXMgPT4ge1xuXHRcdFx0XHRyZXR1cm4gZmxhdFJvdXRlcygncm91dGVzJywgZGVmaW5lUm91dGVzLCB7XG5cdFx0XHRcdFx0aWdub3JlZFJvdXRlRmlsZXM6IFtcblx0XHRcdFx0XHRcdCcuKicsXG5cdFx0XHRcdFx0XHQnKiovKi5jc3MnLFxuXHRcdFx0XHRcdFx0JyoqLyoudGVzdC57anMsanN4LHRzLHRzeH0nLFxuXHRcdFx0XHRcdFx0JyoqL19fKi4qJyxcblx0XHRcdFx0XHRcdC8vIFRoaXMgaXMgZm9yIHNlcnZlci1zaWRlIHV0aWxpdGllcyB5b3Ugd2FudCB0byBjb2xvY2F0ZVxuXHRcdFx0XHRcdFx0Ly8gbmV4dCB0byB5b3VyIHJvdXRlcyB3aXRob3V0IG1ha2luZyBhbiBhZGRpdGlvbmFsXG5cdFx0XHRcdFx0XHQvLyBkaXJlY3RvcnkuIElmIHlvdSBuZWVkIGEgcm91dGUgdGhhdCBpbmNsdWRlcyBcInNlcnZlclwiIG9yXG5cdFx0XHRcdFx0XHQvLyBcImNsaWVudFwiIGluIHRoZSBmaWxlbmFtZSwgdXNlIHRoZSBlc2NhcGUgYnJhY2tldHMgbGlrZTpcblx0XHRcdFx0XHRcdC8vIG15LXJvdXRlLltzZXJ2ZXJdLnRzeFxuXHRcdFx0XHRcdFx0JyoqLyouc2VydmVyLionLFxuXHRcdFx0XHRcdFx0JyoqLyouY2xpZW50LionLFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0pXG5cdFx0XHR9LFxuXHRcdH0pLFxuXHRcdHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOXG5cdFx0XHQ/IHNlbnRyeVZpdGVQbHVnaW4oe1xuXHRcdFx0XHRcdGRpc2FibGU6IE1PREUgIT09ICdwcm9kdWN0aW9uJyxcblx0XHRcdFx0XHRhdXRoVG9rZW46IHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxuXHRcdFx0XHRcdG9yZzogcHJvY2Vzcy5lbnYuU0VOVFJZX09SRyxcblx0XHRcdFx0XHRwcm9qZWN0OiBwcm9jZXNzLmVudi5TRU5UUllfUFJPSkVDVCxcblx0XHRcdFx0XHRyZWxlYXNlOiB7XG5cdFx0XHRcdFx0XHRuYW1lOiBwcm9jZXNzLmVudi5DT01NSVRfU0hBLFxuXHRcdFx0XHRcdFx0c2V0Q29tbWl0czoge1xuXHRcdFx0XHRcdFx0XHRhdXRvOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHNvdXJjZW1hcHM6IHtcblx0XHRcdFx0XHRcdGZpbGVzVG9EZWxldGVBZnRlclVwbG9hZDogYXdhaXQgZ2xvYihbXG5cdFx0XHRcdFx0XHRcdCcuL2J1aWxkLyoqLyoubWFwJyxcblx0XHRcdFx0XHRcdFx0Jy5zZXJ2ZXItYnVpbGQvKiovKi5tYXAnLFxuXHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSlcblx0XHRcdDogbnVsbCxcblx0XSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9TLFNBQVMsY0FBYyxhQUFhO0FBQ3hVLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLG9CQUFvQjtBQUU3QixJQUFNLE9BQU8sUUFBUSxJQUFJO0FBRXpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLE9BQU87QUFBQSxJQUNOLFdBQVcsU0FBUztBQUFBLElBRXBCLGVBQWU7QUFBQSxNQUNkLFVBQVUsQ0FBQyxXQUFXLFVBQVUsVUFBVSxVQUFVO0FBQUEsSUFDckQ7QUFBQSxJQUVBLG1CQUFtQixDQUFDLFdBQW1CO0FBQ3RDLFVBQUksT0FBTyxTQUFTLFlBQVksR0FBRztBQUNsQyxlQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0Q7QUFBQSxJQUVBLFdBQVc7QUFBQSxFQUNaO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUixNQUFNO0FBQUEsTUFDTCxtQkFBbUIsQ0FBQyxNQUFNO0FBQUEsTUFDMUIsb0JBQW9CO0FBQUEsTUFDcEIsUUFBUSxPQUFNLGlCQUFnQjtBQUM3QixlQUFPLFdBQVcsVUFBVSxjQUFjO0FBQUEsVUFDekMsbUJBQW1CO0FBQUEsWUFDbEI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLFlBQ0E7QUFBQSxVQUNEO0FBQUEsUUFDRCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsQ0FBQztBQUFBLElBQ0QsUUFBUSxJQUFJLG9CQUNULGlCQUFpQjtBQUFBLE1BQ2pCLFNBQVMsU0FBUztBQUFBLE1BQ2xCLFdBQVcsUUFBUSxJQUFJO0FBQUEsTUFDdkIsS0FBSyxRQUFRLElBQUk7QUFBQSxNQUNqQixTQUFTLFFBQVEsSUFBSTtBQUFBLE1BQ3JCLFNBQVM7QUFBQSxRQUNSLE1BQU0sUUFBUSxJQUFJO0FBQUEsUUFDbEIsWUFBWTtBQUFBLFVBQ1gsTUFBTTtBQUFBLFFBQ1A7QUFBQSxNQUNEO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDWCwwQkFBMEIsTUFBTSxLQUFLO0FBQUEsVUFDcEM7QUFBQSxVQUNBO0FBQUEsUUFDRCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsQ0FBQyxJQUNBO0FBQUEsRUFDSjtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
