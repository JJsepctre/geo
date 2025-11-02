# 首页视频配置说明

## 视频播放器已集成

右侧视频展示区域已经添加了 HTML5 `<video>` 标签，支持播放静态视频文件。

## 如何添加视频文件

### 步骤1：准备视频文件

将你的视频文件放入 `public/videos/` 目录：

```
public/
  videos/
    operation-demo.mp4      # 主视频文件（MP4格式，推荐）
    operation-demo.webm     # 备用视频文件（WebM格式，可选）
    poster.jpg              # 视频封面图（可选）
```

### 步骤2：视频格式建议

**推荐格式**：
- **MP4** (H.264编码) - 兼容性最好
- **WebM** (VP9编码) - 现代浏览器支持，文件更小

**视频规格建议**：
- 分辨率：1920x1080 或 1280x720
- 比特率：2-5 Mbps
- 帧率：24-30 fps
- 时长：建议不超过5分钟

### 步骤3：修改视频路径（如果需要）

如果你的视频文件名不同，可以修改 `HomePage.tsx` 中的路径：

```typescript
<video controls poster="/videos/你的封面图.jpg">
  <source src="/videos/你的视频文件.mp4" type="video/mp4" />
  <source src="/videos/你的视频文件.webm" type="video/webm" />
</video>
```

## 视频播放器功能

当前视频播放器支持：
- ✅ 播放/暂停
- ✅ 进度条拖动
- ✅ 音量调节
- ✅ 全屏播放
- ✅ 视频封面图（poster）
- ✅ 多格式支持（MP4 + WebM）
- ✅ 自适应容器大小

## 高级配置

### 添加自动播放（不推荐）

```typescript
<video 
  controls 
  autoPlay 
  muted  // 自动播放需要静音
  loop   // 循环播放
>
```

### 添加预加载

```typescript
<video 
  controls 
  preload="metadata"  // 或 "auto" / "none"
>
```

### 自定义样式

视频播放器已经设置了：
- `width: 100%` - 宽度自适应
- `height: 100%` - 高度自适应
- `objectFit: 'contain'` - 保持视频比例

## 方式2：使用在线视频（可选）

如果视频文件太大，可以使用在线视频链接：

```typescript
<video controls>
  <source src="https://your-cdn.com/video.mp4" type="video/mp4" />
</video>
```

## 方式3：使用 iframe 嵌入（YouTube/Bilibili）

如果要嵌入 YouTube 或 Bilibili 视频：

```typescript
<iframe
  width="100%"
  height="100%"
  src="https://www.youtube.com/embed/VIDEO_ID"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  style={{ borderRadius: '8px' }}
/>
```

## 测试视频

如果暂时没有视频文件，可以使用测试视频：

1. 下载免费测试视频：https://sample-videos.com/
2. 或使用 Big Buck Bunny：http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

```typescript
<source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
```

## 当前状态

✅ 视频播放器已集成
✅ 支持多种视频格式
✅ 响应式设计
⏳ 需要添加实际视频文件到 `public/videos/` 目录

## 故障排查

### 视频无法播放
1. 检查视频文件路径是否正确
2. 检查视频格式是否支持（推荐MP4）
3. 打开浏览器控制台查看错误信息
4. 确认视频文件在 `public/videos/` 目录下

### 视频加载慢
1. 压缩视频文件大小
2. 使用 CDN 托管视频
3. 设置 `preload="metadata"` 只预加载元数据

### 视频显示变形
- 已设置 `objectFit: 'contain'` 保持原始比例
- 如需填充整个区域，可改为 `objectFit: 'cover'`

