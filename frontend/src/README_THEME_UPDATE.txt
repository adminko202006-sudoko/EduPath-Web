EduPath Dark/Light Theme + Smooth Hover Update

This archive contains the updated frontend source folder (src/). The original uploaded archive contained source files only, not package.json or index.html.

Apply it by backing up your existing frontend/src folder, then replacing it with this archive's src folder. Keep your existing package.json, index.html, Vite config, public assets, and backend untouched.

Implemented: centralized theme state across Admin/Staff/Applicant Settings and the header toggle; localStorage persistence and legacy preference migration; class-based Tailwind dark variant; consistent theme tokens; subtle 180ms ease hover/focus transitions; removed common hover scaling/translation effects; reduced-motion support.

After replacing src, from your frontend directory run:
  npm install
  npm run build
  npm run dev

Please review your app visually after applying, because the provided source-only archive does not include package.json or index.html and a full project build cannot be run from this archive alone.
