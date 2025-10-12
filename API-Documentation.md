# 地质预报管理系统 API 接口文档

## 📖 概述

本文档描述了地质预报管理系统前端所需要的后端 API 接口。所有接口都遵循 RESTful 风格，使用 JSON 格式进行数据传输。

## 🔗 基础配置

### 基础 URL

```
http://your-backend-server.com/api
```

### 请求头

```
Content-Type: application/json
Authorization: Bearer {token}  // 如果需要认证
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {...}
}
```

## 📋 数据模型

### Project (项目)

```typescript
interface Project {
  id: string;
  name: string;
  constructionUnit: string;
  description?: string;
}
```

### Tunnel (隧道)

```typescript
interface Tunnel {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  projectId: string;
}
```

### WorkPoint (工点)

```typescript
interface WorkPoint {
  id: string;
  name: string;
  code: string;
  mileage: number;
  tunnelId: string;
  length: number;
  status: string;
  createdAt: string;
  isTop?: boolean;
}
```

## 🚀 API 接口列表

### 1. 项目管理

#### 1.1 获取项目信息

```
GET /projects/{projectId}
```

**参数:**

- `projectId` (string): 项目 ID

**响应:**

```json
{
  "id": "project-001",
  "name": "渝昆高铁引入昆明枢纽组织工程",
  "constructionUnit": "中国铁路昆明局集团有限公司",
  "description": "新建铁路渝昆高铁引入昆明枢纽工程"
}
```

### 2. 隧道管理

#### 2.1 获取隧道列表

```
GET /tunnels?projectId={projectId}
```

**参数:**

- `projectId` (string, optional): 项目 ID

**响应:**

```json
[
  {
    "id": "1",
    "name": "大庆山隧道",
    "code": "DQS",
    "status": "active",
    "projectId": "project-001"
  },
  {
    "id": "2",
    "name": "青龙山隧道",
    "code": "QLS",
    "status": "active",
    "projectId": "project-001"
  }
]
```

#### 2.2 搜索隧道

```
GET /tunnels/search?keyword={keyword}
```

**参数:**

- `keyword` (string): 搜索关键词

**响应:**

```json
[
  {
    "id": "1",
    "name": "大庆山隧道",
    "code": "DQS",
    "status": "active",
    "projectId": "project-001"
  }
]
```

### 3. 工点管理

#### 3.1 获取工点列表

```
GET /work-points?tunnelId={tunnelId}&page={page}&pageSize={pageSize}
```

**参数:**

- `tunnelId` (string, optional): 隧道 ID
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 10

**响应:**

```json
{
  "data": [
    {
      "id": "1",
      "name": "DK713+920大庆山隧道明洞",
      "code": "DK713+920",
      "mileage": 713920,
      "tunnelId": "1",
      "length": 60,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isTop": false
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10
}
```

#### 3.2 搜索工点

```
GET /work-points/search?keyword={keyword}&tunnelId={tunnelId}
```

**参数:**

- `keyword` (string): 搜索关键词
- `tunnelId` (string, optional): 隧道 ID

**响应:**

```json
[
  {
    "id": "1",
    "name": "DK713+920大庆山隧道明洞",
    "code": "DK713+920",
    "mileage": 713920,
    "tunnelId": "1",
    "length": 60,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isTop": false
  }
]
```

#### 3.3 置顶/取消置顶工点

```
PATCH /work-points/{workPointId}/top
```

**参数:**

- `workPointId` (string): 工点 ID

**请求体:**

```json
{
  "isTop": true
}
```

**响应:**

```json
{
  "message": "置顶成功"
}
```

#### 3.4 获取工点详情

```
GET /work-points/{workPointId}
```

**参数:**

- `workPointId` (string): 工点 ID

**响应:**

```json
{
  "id": "1",
  "name": "DK713+920大庆山隧道明洞",
  "code": "DK713+920",
  "mileage": 713920,
  "tunnelId": "1",
  "length": 60,
  "status": "active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isTop": false
}
```

## 📝 实现示例

### Spring Boot (Java) 示例

```java
@RestController
@RequestMapping("/api")
public class GeoForecastController {

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<Project> getProject(@PathVariable String projectId) {
        // 实现获取项目逻辑
        Project project = projectService.findById(projectId);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/tunnels")
    public ResponseEntity<List<Tunnel>> getTunnels(
        @RequestParam(required = false) String projectId) {
        // 实现获取隧道列表逻辑
        List<Tunnel> tunnels = tunnelService.findByProjectId(projectId);
        return ResponseEntity.ok(tunnels);
    }

    @GetMapping("/work-points")
    public ResponseEntity<WorkPointPageResponse> getWorkPoints(
        @RequestParam(required = false) String tunnelId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize) {
        // 实现获取工点列表逻辑
        WorkPointPageResponse response = workPointService.findByTunnelId(tunnelId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/work-points/{workPointId}/top")
    public ResponseEntity<String> toggleWorkPointTop(
        @PathVariable String workPointId,
        @RequestBody TopRequest request) {
        // 实现置顶逻辑
        workPointService.setTop(workPointId, request.isTop);
        return ResponseEntity.ok("操作成功");
    }
}
```

### Node.js/Express 示例

```javascript
const express = require("express");
const router = express.Router();

// 获取项目信息
router.get("/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取隧道列表
router.get("/tunnels", async (req, res) => {
  try {
    const { projectId } = req.query;
    const tunnels = await Tunnel.find({ projectId });
    res.json(tunnels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取工点列表
router.get("/work-points", async (req, res) => {
  try {
    const { tunnelId, page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const query = tunnelId ? { tunnelId } : {};
    const workPoints = await WorkPoint.find(query)
      .sort({ isTop: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await WorkPoint.countDocuments(query);

    res.json({
      data: workPoints,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 置顶工点
router.patch("/work-points/:workPointId/top", async (req, res) => {
  try {
    const { workPointId } = req.params;
    const { isTop } = req.body;

    await WorkPoint.findByIdAndUpdate(workPointId, { isTop });
    res.json({ message: "操作成功" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

## 🔧 如何配置使用真实 API

### 步骤 1: 修改环境变量

在项目根目录的 `.env` 文件中：

```bash
# 将Mock API关闭
REACT_APP_USE_MOCK_API=false

# 设置你的后端API地址
REACT_APP_API_BASE_URL=http://your-backend-server.com/api
```

### 步骤 2: 重启前端服务

```bash
npm start
```

## 🛠 调试和测试

### 使用 Postman 测试 API

你可以使用以下 curl 命令测试你的 API：

```bash
# 测试获取隧道列表
curl -X GET "http://your-backend-server.com/api/tunnels?projectId=project-001"

# 测试获取工点列表
curl -X GET "http://your-backend-server.com/api/work-points?tunnelId=1&page=1&pageSize=10"

# 测试置顶工点
curl -X PATCH "http://your-backend-server.com/api/work-points/1/top" \
     -H "Content-Type: application/json" \
     -d '{"isTop": true}'
```

## 📚 注意事项

1. **CORS 配置**: 确保你的后端允许前端域名的跨域请求
2. **错误处理**: API 应该返回适当的 HTTP 状态码和错误信息
3. **分页**: 工点列表建议实现分页以提高性能
4. **搜索**: 搜索功能建议支持模糊匹配
5. **排序**: 置顶的工点应该排在前面

这样配置后，你的前端就会调用真实的后端 API 而不是 Mock 数据了！
