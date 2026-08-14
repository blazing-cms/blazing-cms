import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  capabilities: {
    analytics: { enabled: false },
    media: { maxFileSize: 25 * 1024 * 1024 },
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "your-project-id",
  },
  projectName: "Blazing CMS Playground",
});
