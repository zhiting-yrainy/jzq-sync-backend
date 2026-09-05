[render.yaml](https://github.com/user-attachments/files/31855769/render.yaml)
# Render Blueprint 配置（一键部署用）
# 在 Render 控制台选择 "New" -> "Blueprint" -> 连接本仓库即可自动按此配置部署
services:
  - type: web
    name: jzq-sync
    runtime: node
    plan: free            # 免费层；长时间无访问会休眠，下次访问自动唤醒（冷启动约数秒）
    region: oregon        # 如有需要可改成 singapore / frankfurt 等
    branch: main
    buildCommand: "true"  # 零依赖，无需安装
    startCommand: "node server.js"
    healthCheckPath: /
    envVars:
      - key: PORT
        sync: false        # Render 会自动注入 PORT
      - key: SYNC_KEY
        sync: false        # 可选：留空则不校验；设置后前端需在“同步设置”里填相同密钥
