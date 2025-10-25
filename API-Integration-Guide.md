# 地质预报管理系统 - API 集成文档

## 📋 项目概览

本项目是一个地质预报管理系统，包含多个功能模块，支持自动切换 Mock API 和真实 API。

## 🏗️ 项目结构

```
src/
├── components/          # 通用组件
│   ├── DetectionChart.tsx        # 探测方法图表组件（ECharts）
│   ├── DesignLayout.tsx          # 设计页面布局
│   ├── DesignTabs.tsx            # 设计页面标签页
│   └── ListItem.tsx              # 列表项组件
│
├── pages/              # 页面组件
│   ├── HelloPage.tsx             # 主页面（隧道/工点管理）✅ 已集成
│   ├── ForecastDesignPage.tsx   # 预报设计管理页面 ✅ 已集成
│   ├── ForecastRockPage.tsx     # 设计围岩页面
│   ├── ForecastGeologyPage.tsx  # 设计地质页面
│   └── GeoPoint/
│       └── GeoPointSearch.tsx   # 工点搜索页面（需集成）
│
├── services/           # API服务层
│   ├── apiAdapter.ts   🔥 核心：自动切换Mock/真实API
│   ├── realAPI.ts      # 真实后端API定义
│   ├── mockAPI.ts      # Mock数据API
│   ├── mockConfig.ts   # Mock数据配置
│   ├── geoForecastAPI.ts  # API类型定义
│   └── http.ts         # Axios实例配置（带内置Mock）
│
├── router/             # 路由配置
└── utils/              # 工具函数
```

## 🔌 API 架构设计

### 三层 API 架构

```
┌─────────────────────────────────────────────┐
│         页面组件层 (React Components)         │
│  HelloPage, ForecastDesignPage, etc.       │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│         API适配器层 (apiAdapter.ts)          │
│   自动根据环境变量选择Mock或真实API            │
└─────────────┬───────────────┬───────────────┘
              │               │
              ↓               ↓
    ┌─────────────┐   ┌─────────────┐
    │  realAPI.ts │   │ mockAPI.ts  │
    │  真实后端API │   │  Mock数据   │
    └─────────────┘   └─────────────┘
```

### API 切换机制

**核心判断逻辑：**

```typescript
const USE_REAL_API = !!process.env.REACT_APP_API_BASE_URL;
```

- **有配置后端地址** → 使用真实 API (`realAPI`)
- **无配置后端地址** → 使用 Mock API (`mockAPI`)

## 🎯 已集成的模块

### ✅ 1. HelloPage（主页面）

- **状态**: 已完全集成 `apiAdapter`
- **功能**:
  - 隧道列表展示与搜索
  - 工点列表展示与搜索
  - 工点类型/风险等级筛选
  - 工点置顶功能
  - 项目统计信息

### ✅ 2. ForecastDesignPage（预报设计）

- **状态**: 使用 `http.ts` 自带的 fallback Mock
- **功能**:
  - 预报设计 CRUD（增删改查）
  - 分页查询
  - 批量删除
  - Excel 导入导出

### ⚠️ 3. GeoPointSearch（工点搜索）

- **状态**: 使用硬编码 Mock 数据（需要集成）
- **功能**:
  - 工点探测数据展示
  - ECharts 可视化
  - 探测方法筛选

## 🔧 如何切换 API 模式

### 方式 1：使用 Mock API（本地开发）

编辑 `.env` 文件：

```properties
# 注释掉或不设置 REACT_APP_API_BASE_URL
# REACT_APP_API_BASE_URL=
```

**特点**：

- ✅ 无需后端服务器
- ✅ 数据丰富真实
- ✅ 响应速度快
- ✅ 支持所有 CRUD 操作

### 方式 2：使用真实 API（连接后端）

编辑 `.env` 文件：

```properties
# 设置后端服务器地址
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

**特点**：

- ✅ 连接真实数据库
- ✅ 多用户协作
- ✅ 数据持久化
- ⚠️ 需要后端服务运行

## 📡 真实 API 接口规范

### 基础 URL

```
http://your-backend-server.com/api
```

### 接口列表

#### 1. 项目管理

```typescript
GET    /api/project/info              # 获取项目信息
```

#### 2. 隧道管理

```typescript
GET    /api/tunnels                   # 获取隧道列表
GET    /api/tunnels/:tunnelId         # 获取隧道详情
```

#### 3. 工点管理

```typescript
GET    /api/workpoints                # 获取工点列表
       ?tunnelId=xxx                  # 查询参数：隧道ID

GET    /api/workpoints/search         # 搜索工点
       ?keyword=xxx                   # 查询参数：关键词
       &tunnelId=xxx                  # 可选：限定隧道

GET    /api/workpoints/:id            # 获取工点详情

PATCH  /api/workpoints/:id/top        # 置顶/取消置顶
       Body: { isTop: boolean }
```

#### 4. 预报设计管理

```typescript
GET    /api/forecast/designs          # 获取预报设计列表（分页）
       ?page=1                        # 页码
       &pageSize=10                   # 每页数量
       &method=xxx                    # 可选：预报方法筛选
       &startDate=2024-01-01          # 可选：开始日期
       &endDate=2024-12-31            # 可选：结束日期

POST   /api/forecast/designs          # 新增预报设计
       Body: ForecastDesignRecord

DELETE /api/forecast/designs/:id      # 删除预报设计

POST   /api/forecast/designs/batch-delete  # 批量删除
       Body: { ids: string[] }

POST   /api/forecast/designs/import   # 导入Excel
       Body: FormData (file)

GET    /api/forecast/designs/template # 下载模板
```

#### 5. 工点探测数据（待集成）

```typescript
GET    /api/geopoints/detection       # 获取探测数据列表
       ?keyword=xxx                   # 可选：搜索关键词
       &tunnelId=xxx                  # 可选：隧道ID

GET    /api/geopoints/:id/detection   # 获取工点探测详情
```

### 响应格式

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

#### 列表响应（分页）

```json
{
  "list": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

#### 错误响应

```json
{
  "code": 400,
  "message": "错误信息"
}
```

## 🎨 数据类型定义

### Tunnel（隧道）

```typescript
interface Tunnel {
  id: string;
  name: string; // 隧道名称
  code: string; // 隧道编码
  status: "active" | "inactive";
  projectId: string;
}
```

### WorkPoint（工点）

```typescript
interface WorkPoint {
  id: string;
  name: string; // 工点名称
  code: string; // 工点编码
  mileage: number; // 里程数
  tunnelId: string; // 所属隧道ID
  length: number; // 工点长度
  status: string; // 状态
  createdAt: string; // 创建时间
  isTop?: boolean; // 是否置顶
  type?: string; // 工点类型
  riskLevel?: string; // 风险等级
  geologicalCondition?: string; // 地质条件
}
```

### Project（项目）

```typescript
interface Project {
  id: string;
  name: string; // 项目名称
  constructionUnit: string; // 建设单位
  description?: string; // 项目描述
}
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 模式

编辑 `.env` 文件，选择 Mock 模式或真实 API 模式

### 3. 启动开发服务器

```bash
npm start
```

### 4. 查看 API 模式

打开浏览器控制台，会显示当前使用的 API 模式：

```
🔌 API Mode: Mock API
🎭 Using Mock Data for development
```

或

```
🔌 API Mode: Real API
📡 API Base URL: http://localhost:8080/api
```

## 🔄 待办事项

### 高优先级

- [ ] **集成 GeoPointSearch 页面** - 将硬编码 Mock 数据改为使用 apiAdapter
- [ ] **完善 realAPI 错误处理** - 添加更详细的错误处理和重试机制
- [ ] **添加 loading 状态管理** - 统一管理 API 调用的 loading 状态

### 中优先级

- [ ] **添加请求缓存** - 对频繁请求的数据进行缓存
- [ ] **添加请求取消** - 支持取消正在进行的请求
- [ ] **优化 Mock 数据** - 让 Mock 数据更接近真实场景

### 低优先级

- [ ] **添加 API 文档生成器** - 自动生成 API 文档
- [ ] **添加单元测试** - 为 API 服务层添加测试

## 📝 开发指南

### 如何添加新的 API 接口

1. **在 `realAPI.ts` 中添加真实 API 方法**

```typescript
async getNewData(): Promise<NewDataType> {
  return http.get('/api/new-endpoint');
}
```

2. **在 `mockAPI.ts` 中添加 Mock 实现**

```typescript
async getNewData(): Promise<NewDataType> {
  return generateMockNewData();
}
```

3. **在 `apiAdapter.ts` 中添加适配方法**

```typescript
async getNewData(): Promise<NewDataType> {
  if (USE_REAL_API) {
    return realAPI.getNewData();
  } else {
    return mockGeoForecastAPI.getNewData();
  }
}
```

4. **在页面组件中使用**

```typescript
import apiAdapter from "../services/apiAdapter";

const data = await apiAdapter.getNewData();
```

## 🐛 常见问题

### Q: 如何知道当前使用的是 Mock 还是真实 API？

A: 打开浏览器控制台，会有明确的提示信息。

### Q: Mock 数据可以修改吗？

A: 可以！编辑 `mockConfig.ts` 和 `mockAPI.ts` 中的数据生成逻辑。

### Q: 真实 API 返回的数据格式和 Mock 不一样怎么办？

A: 在 `apiAdapter.ts` 中添加数据转换逻辑，确保返回格式一致。

### Q: 如何调试 API 请求？

A:

1. 打开浏览器开发者工具 → Network 标签
2. 查看 `http.ts` 中的请求/响应拦截器日志
3. 使用 `console.log` 在 apiAdapter 中打印数据

## 📞 技术支持

如有问题，请联系开发团队或查看项目 README。

---

**最后更新**: 2025-10-12  
**文档版本**: v1.0
