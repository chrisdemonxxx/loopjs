# Vercel 部署检查清单

在部署前端应用到 Vercel 之前，请确保完成以下检查项：

## 前端配置检查

- [x] `package.json` 包含 `vercel-build` 脚本
- [x] `vercel.json` 配置正确（构建设置、路由规则、环境变量）
- [x] `.env.production` 文件配置正确
- [x] `config.ts` 正确处理环境变量
- [x] 前端构建成功（`npm run build`）

## Vercel 设置检查

- [ ] 创建 Vercel 项目
- [ ] 设置环境变量 `backend_url`
- [ ] 设置环境变量 `ws_url`
- [ ] 配置构建命令为 `npm run vercel-build`
- [ ] 配置输出目录为 `dist`

## 后端配置检查

- [ ] 后端服务器可公开访问
- [ ] 后端支持 HTTPS
- [ ] CORS 设置允许 Vercel 域名
- [ ] WebSocket 服务器支持 WSS

## 部署后检查

- [ ] 前端页面正常加载
- [ ] API 请求正常工作
- [ ] WebSocket 连接正常工作
- [ ] 用户认证流程正常
- [ ] 所有主要功能正常工作

## 监控与日志

- [ ] 设置错误监控
- [ ] 配置性能监控
- [ ] 确保日志记录正常工作

完成以上所有检查项后，您的应用应该已经准备好在 Vercel 上稳定运行。