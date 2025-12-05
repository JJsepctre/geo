# 🚀 快速启动指南

## 当前项目状态

✅ **所有代码已集成完成**  
✅ **编译通过，无错误**  
✅ **Mock 数据已配置，开箱即用**

---

## 立即运行项目

### 1. 启动开发服务器

```bash
npm start
```

### 2. 打开浏览器

访问：http://localhost:3001

### 3. 查看 API 模式

打开浏览器控制台（F12），你会看到：

```
🔌 API Mode: Mock API
🎭 Using Mock Data for development
```

---

## 主要功能页面

### 📍 主页面 - 隧道和工点管理

**路由**: `/geo-forecast`

**功能**：

- 10 个隧道展示
- 140+工点数据
- 关键词搜索
- 类型和风险等级筛选
- 工点置顶功能

### 📊 预报设计管理

**路由**: `/forecast/design`

**功能**：

- CRUD 操作（增删改查）
- 分页查询
- 批量删除
- Excel 导入导出

### 🔍 工点搜索（ECharts 可视化）

**路由**: `/geo-search`

**功能**：

- 探测方法可视化图表
- 探测数据表格展示
- 多维度数据筛选

---

## API 模式切换

### 当前：Mock 模式（默认）

✅ 无需后端，直接运行  
✅ 数据丰富完整  
✅ 所有功能可用

### 切换到真实 API

**步骤**：

1. 编辑 `.env` 文件
2. 取消注释并设置后端地址：
   ```properties
   REACT_APP_API_BASE_URL=http://localhost:8080/api
   ```
3. 重启项目：`npm start`

---

## 目录结构

```
src/
├── pages/              # 页面
│   ├── GeoForecastPage.tsx          ✅ 已集成真实API
│   ├── ForecastDesignPage.tsx ✅ 已集成真实API
│   └── GeoPointSearch.tsx     ⚠️  使用硬编码Mock
│
├── services/           # API服务
│   ├── apiAdapter.ts   🔥 核心适配器
│   ├── realAPI.ts      📡 真实API定义
│   └── mockAPI.ts      🎭 Mock数据
│
└── components/         # 组件
    ├── DetectionChart.tsx     # ECharts图表
    └── DesignLayout.tsx       # 布局组件
```

---

## 常见问题

### Q: 端口 3000 被占用怎么办？

A: 项目会自动询问是否使用其他端口，选择"Yes"即可。

### Q: 如何查看当前使用的是 Mock 还是真实 API？

A: 打开浏览器控制台查看日志提示。

### Q: Mock 数据可以修改吗？

A: 可以！编辑 `src/services/mockAPI.ts` 和 `mockConfig.ts`。

### Q: 如何添加新的 API 接口？

A: 查看 `API-Integration-Guide.md` 中的开发指南部分。

---

## 文档索引

- 📋 **API 集成文档**: `API-Integration-Guide.md`
- 📊 **集成完成报告**: `INTEGRATION-REPORT.md`
- 📖 **原 API 文档**: `API-Documentation.md`

---

## 需要帮助？

1. 查看控制台错误信息
2. 检查 `.env` 配置
3. 确认依赖已安装：`npm install`
4. 查看相关文档

---

**开始开发吧！** 🎉

所有功能都已就绪，现在可以：

- ✅ 查看和测试所有功能
- ✅ 基于 Mock 数据进行开发
- ✅ 随时切换到真实后端
- ✅ 与团队并行协作

---

最后更新：2025-10-12
