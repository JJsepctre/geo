# 纯静态资源托管 Dockerfile
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
# 注意：这里假设 build 文件夹与 Dockerfile 同级
COPY build /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
