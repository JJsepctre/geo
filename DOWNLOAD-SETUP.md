# 首页下载功能配置说明

## 功能概述
首页顶部的四个功能卡片现在支持点击下载文件：
- 🟣 设计预报模板
- 🔵 地质预报模板
- 🟠 报错汇总
- 🟢 操作手册

## 实现方式

### 方式1：从后端API下载（推荐）

当前代码使用的是这种方式，需要后端提供下载接口。

**前端配置**（已完成）：
```typescript
const downloadConfig = {
  '设计预报模板': {
    url: '/api/download/design-forecast-template',
    filename: '设计预报模板.xlsx'
  },
  // ... 其他配置
};
```

**后端需要实现的接口**：
```
GET /api/v1/download/design-forecast-template
GET /api/v1/download/geology-forecast-template
GET /api/v1/download/error-report
GET /api/v1/download/operation-manual
```

**后端返回**：
- Content-Type: application/octet-stream 或 application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="文件名.xlsx"
- 文件的二进制流

### 方式2：从 public 文件夹直接下载

如果你想先测试功能，可以将文件放在 `public/templates/` 目录下。

**步骤**：
1. 在项目根目录创建 `public/templates/` 文件夹
2. 将模板文件放入该文件夹：
   ```
   public/
     templates/
       设计预报模板.xlsx
       地质预报模板.xlsx
       报错汇总.xlsx
       操作手册.pdf
   ```

3. 修改 `HomePage.tsx` 中的点击事件：
   ```typescript
   // 将这行
   onClick={() => handleDownload('设计预报模板')}
   
   // 改为
   onClick={() => handleDirectDownload('设计预报模板')}
   ```

### 方式3：使用 xlsx 库生成 Excel 文件

如果需要动态生成 Excel 文件：

1. 安装依赖：
   ```bash
   npm install xlsx
   ```

2. 在 `HomePage.tsx` 中添加：
   ```typescript
   import * as XLSX from 'xlsx';

   const generateExcelTemplate = (templateType: string) => {
     // 创建工作表数据
     const data = [
       ['列1', '列2', '列3'],
       ['数据1', '数据2', '数据3'],
     ];
     
     const ws = XLSX.utils.aoa_to_sheet(data);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
     XLSX.writeFile(wb, `${templateType}.xlsx`);
     
     Message.success(`${templateType}生成成功！`);
   };
   ```

## 当前状态

✅ 前端下载功能已实现
✅ 点击卡片触发下载
✅ 加载提示和成功/失败消息
⏳ 需要后端提供下载API

## 测试步骤

1. 启动项目：`npm start`
2. 访问首页：`http://localhost:3000`
3. 点击任意功能卡片
4. 查看浏览器控制台和网络请求

## 后续工作

如果后端还没准备好下载接口，建议先使用**方式2**（public文件夹）进行测试。

等后端接口ready后，再切换回**方式1**（API下载）。

