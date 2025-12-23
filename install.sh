#!/bin/bash

# 确保脚本抛出遇到的错误
set -e

echo "=== 开始部署流程 ==="

# 1. 检查是否存在 build 目录
if [ ! -d "build" ]; then
    echo "错误: 未找到 build 目录！请先上传 build 目录到当前文件夹。"
    exit 1
fi

echo "1. 检测到 build 目录，准备更新..."

# 2. 停止并移除旧容器
echo "2. 停止并移除旧容器..."
# 强制移除指定名称的容器，防止名称冲突
docker rm -f geo-web-frontend || true
# 停止 compose 服务
docker compose down || true

# 3. 重新构建并启动容器
echo "3. 重新构建镜像并启动容器..."
docker compose up -d --build

# 4. 清理未使用的镜像（可选，清理 dangling images）
echo "4. 清理旧镜像..."
docker image prune -f

echo "=== 部署完成！ ==="
echo "服务运行在端口: 8098"
echo "使用 'docker ps' 查看运行状态"

