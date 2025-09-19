# Vercel 部署指南

本文档提供了将前端应用部署到 Vercel 的详细步骤。

## 前置条件

- Vercel 账户
- 已配置的后端服务器（可访问的 URL）

## 部署步骤

### 1. 准备工作

前端项目已经配置了必要的文件：
- `vercel.json` - 包含构建配置和路由规则
- `.env.production` - 包含生产环境变量
- `package.json` - 包含 `vercel-build` 脚本

### 2. 设置 Vercel 环境变量

在 Vercel 项目设置中，添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|-------|------|-------|
| `backend_url` | 后端服务器 URL | `https://your-backend-server.com` |
| `ws_url` | WebSocket URL | `wss://your-backend-server.com/ws` |

> **注意**：环境变量名称必须与 `vercel.json` 中的 `env` 部分匹配。

### 3. 部署到 Vercel

1. 登录 Vercel 账户
2. 导入项目仓库
3. 配置项目设置：
   - 构建命令：`npm run vercel-build`
   - 输出目录：`dist`
   - 框架预设：`Vite`
4. 点击「部署」按钮

### 4. 验证部署

部署完成后，验证以下功能：

- 前端页面正常加载
- API 请求正常工作（通过代理到后端）
- WebSocket 连接正常工作

### 5. 故障排除

如果遇到问题，请检查：

- Vercel 环境变量是否正确设置
- 后端服务器是否可访问
- CORS 设置是否正确
- WebSocket 连接是否正确配置

## 自动部署

配置 GitHub 仓库与 Vercel 项目关联后，每次推送到主分支将自动触发部署。

## 其他注意事项

- 确保后端服务器支持 HTTPS
- 确保 WebSocket 服务器支持 WSS（安全 WebSocket）
- 生产环境中不要使用 `localhost` 作为后端地址