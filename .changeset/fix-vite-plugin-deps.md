---
"@blazing-cms/cms": patch
---

fix(cms): move vite plugins to dependencies so consuming projects can resolve them

- Move @vitejs/plugin-react and @tailwindcss/vite from devDependencies to dependencies
- These are imported in src/admin/vite.config.ts which ships with the package
