import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/",
  description: "Schema-defined CMS for Firebase",
  themeConfig: {
    logo: false,
    nav: [
      { link: "/guide/getting-started", text: "Guide" },
      { link: "/reference/packages", text: "Reference" },
    ],
    sidebar: {
      "/guide/": [
        {
          items: [
            { link: "/guide/getting-started", text: "Getting Started" },
            { link: "/guide/schemas", text: "Defining Schemas" },
            { link: "/guide/admin", text: "Admin Panel" },
            { link: "/guide/media", text: "Media Library" },
            { link: "/guide/rbac", text: "RBAC" },
            { link: "/guide/versioning", text: "Content Versioning" },
            { link: "/guide/workflow", text: "Content Workflow" },
            { link: "/guide/analytics", text: "Analytics" },
            { link: "/guide/deployment", text: "Deployment" },
          ],
          text: "Guide",
        },
      ],
      "/reference/": [
        {
          items: [
            { link: "/reference/packages", text: "Packages" },
            { link: "/reference/cli", text: "CLI" },
            { link: "/reference/sdk", text: "SDK" },
            { link: "/reference/configuration", text: "Configuration" },
            { link: "/reference/security", text: "Security" },
          ],
          text: "Reference",
        },
      ],
    },
    socialLinks: [{ icon: "github", link: "https://github.com/blazing-cms/blazing-cms" }],
  },
  title: "Blazing CMS",
});
