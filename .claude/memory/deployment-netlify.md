---
name: deployment-netlify
description: "Focus Notes deployments: GitHub Pages (primary) and Netlify (secondary)"
metadata: 
  node_type: memory
  type: reference
  ai_priority: contextual
  ai_tags: []
  originSessionId: 012bfed4-dcef-4d3b-acf9-661b933aa211
---

# Focus Notes Deployments

## GitHub Pages (Primary)
- **URL**: https://zzsh0621.github.io/focusnotes/
- **Repo**: https://github.com/ZZSH0621/focusnotes
- **Deploy command**: `npm run build && npx gh-pages -d dist`
- **Branch**: `gh-pages` (auto-managed by gh-pages npm package)
- **Base path**: `/focusnotes/` (set in vite.config.ts, conditional on `TAURI_ENV_PLATFORM`)
- **Auth**: gh CLI logged in as ZZSH0621, token embedded in remote URL

## Netlify (Secondary)
- **URL**: https://irememberyouzzsh-focusnotes.netlify.app
- **管理页面**: https://app.netlify.com/projects/irememberyouzzsh-focusnotes
- **账号**: zzsh2585984275@gmail.com (GitHub: ZZSH0621)
- **Deploy command**: `npm run deploy` (build + netlify deploy --prod)

**How to apply:** 
- GitHub Pages: `npm run build && npx gh-pages -d dist`
- Netlify: `npm run deploy`
- Tauri desktop: `npm run tauri build` (base path auto-switches to `/`)

