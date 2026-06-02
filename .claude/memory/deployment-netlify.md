---
name: deployment-netlify
description: TraeCC Focus Notes web deployment on Netlify with auto-build
metadata: 
  node_type: memory
  type: project
  originSessionId: 012bfed4-dcef-4d3b-acf9-661b933aa211
---

TraeCC "Focus Notes" 网页端已部署到 Netlify。

**Netlify 站点信息:**
- 管理页面: https://app.netlify.com/projects/irememberyouzzsh-focusnotes
- 生产 URL: https://irememberyouzzsh-focusnotes.netlify.app
- Project ID: 293a8337-2332-4b49-9b98-1b46129f65c7
- 账号: zzsh2585984275@gmail.com (GitHub: ZZSH0621)

**另一个站点 (个站 Portfolio):**
- 管理页面: https://app.netlify.com/projects/aristerzzshagentstrategyhook
- Netlify 支持同一账号下托管多个站点

**实时更新方式:**
- `npm run deploy` — 构建 + 部署到 Netlify 生产环境
- 配置文件: `netlify.toml` (build command: `npm run build`, publish dir: `dist`)
- 如需推送 GitHub 自动部署，可以将项目推送到 GitHub 后在 Netlify 后台关联仓库

**Why:** 用户希望将 TraeCC 中的任务清单网页端像 个站 一样部署到 Netlify 并支持实时更新。

**How to apply:** 修改代码后运行 `npm run deploy` 即可更新线上站点。如需自动部署，初始化 git 仓库推送到 GitHub 后在 Netlify 后台设置 Git 集成。
