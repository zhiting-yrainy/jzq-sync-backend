[README.md](https://github.com/user-attachments/files/31859851/README.md)
# 教资简答题题库 · 同步后端（方案 B）

零依赖 Node.js 服务：托管前端页面 + 提供 `/api/state` 接口，让「电脑保存的标注」自动同步到「手机」。

## 本目录需要上传到云端的文件
- `server.js` —— 后端主程序（已验证可运行）
- `package.json` —— 告诉平台这是 Node 项目、启动命令 `npm start` → `node server.js`
- `render.yaml` —— Render 一键部署配置（其他平台可忽略）
- `public/index.html` —— 前端页面（已内置「同源后端」同步逻辑，部署后零配置）
- `.gitignore` —— 忽略运行时数据

> 不需要上传：`data/`（运行自动生成）、`*.log`、`node_modules/`。

## 部署到 Render（免费，约 3 分钟，需注册账号）

1. 注册免费账号：https://render.com （用 GitHub 或邮箱）
2. 把本目录的 5 个文件推到一个 GitHub 仓库（新建仓库 → Upload files 即可，不用命令行）
3. Render 控制台 → **New** → **Blueprint** → 连接该 GitHub 仓库
4. Render 读取 `render.yaml` 自动配置：类型 Web、套餐 Free、启动命令 `node server.js`
5. 点击 **Deploy**，约 1 分钟构建完成，得到形如 `https://jzq-sync.onrender.com` 的地址
6. （可选）在 Environment 里加变量 `SYNC_KEY=任意字符串` 给同步加一层校验；不加也能用

> 免费层说明：长时间无人访问会自动休眠，下次打开时秒级唤醒（冷启动 1~3 秒）。标注存在服务端 `data/sync.json`，部署/重启偶发清空——但因客户端每次改动都会把本地完整标注推上来，且浏览器本地也有 localStorage 备份，实际不影响使用。

## 部署到 Railway（备选，免费额度有限）
- 注册 https://railway.app → New Project → Deploy from GitHub repo
- Railway 会自动识别 Node 项目并执行 `npm start`；端口用环境变量 `PORT`（代码已支持）

## 部署后怎么用（电脑 + 手机同步）
1. 用电脑浏览器打开你的部署地址（如 `https://jzq-sync.onrender.com`）
2. 点右上角「同步设置」→ 勾选 **同源后端（前端与同步接口部署在同一服务器）** → 保存
3. 手机浏览器同样打开该地址 → 「同步设置」→ 同样勾选 **同源后端** → 保存
4. 之后：在任意一端标「不熟练」、新增题目、批注答案，都会自动同步到另一端（每 20 秒及打开页面时自动拉取）

## 本地自测
```bash
PORT=3000 node server.js
# 浏览器开 http://localhost:3000  → 同源模式直接同步
# 或测试接口：curl http://localhost:3000/api/state
```

## 接口说明
- `GET  /api/state?k=密钥`  → 返回 `{ updatedAt, data:{ edits, marks, added } }`
- `POST /api/state?k=密钥`  → 提交同样的 JSON，以时间戳较新者为准（last-write-wins）
- 设置 `SYNC_KEY` 后，客户端需在「同步设置」里填相同密钥，否则 403

