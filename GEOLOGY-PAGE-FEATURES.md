# 地质预报页面操作功能说明

## 概述
已为地质预报页面的每一条数据记录添加了完整的5个操作按钮，所有按钮都是可点击的，并有相应的交互反馈。

## ✅ 已实现的5个操作按钮

### 1. 详情 (蓝色)
**功能**: 查看该条地质预报记录的详细信息

**交互流程**:
- 点击"详情"按钮
- 弹出详情查看弹窗
- 以美观的网格布局展示所有信息
- 展示字段：预报方法、预报时间、掌子面里程、预报长度、状态、上传提示、记录ID、备注信息

**代码位置**: `handleViewDetail` 函数

---

### 2. 修改 (蓝色)
**功能**: 编辑该条地质预报记录

**交互流程**:
- 点击"修改"按钮
- 显示提示消息告知用户正在编辑哪条记录
- 预留了导航到编辑页面的逻辑（已注释）

**代码位置**: `handleEdit` 函数

**后续集成建议**:
```typescript
// 方案1: 导航到编辑页面
navigate(`/forecast/geology/edit/${record.id}`)

// 方案2: 打开编辑弹窗
setEditVisible(true)
setEditingRecord(record)
```

---

### 3. 复制 (蓝色)
**功能**: 复制该条地质预报记录

**交互流程**:
- 点击"复制"按钮
- 弹出确认对话框
- 对话框显示要复制的记录名称
- 确认后执行复制操作
- 预留了复制API调用和列表刷新的逻辑（已注释）

**代码位置**: `handleCopy` 函数

**应用场景**: 
- 快速基于现有记录创建相似的预报记录
- 减少重复输入，提高工作效率

---

### 4. 上传 (绿色)
**功能**: 为该条记录上传相关文件

**交互流程**:
- 点击"上传"按钮
- 弹出上传文件对话框
- 显示当前记录的预报方法和掌子面里程
- 提供拖拽上传功能
- 支持多文件上传
- 支持格式：.xlsx, .xls, .pdf, .doc, .docx

**代码位置**: `handleUpload` 函数

**特色功能**:
- ✅ 拖拽上传
- ✅ 多文件上传
- ✅ 美观的上传区域UI
- ✅ 文件类型提示

---

### 5. 删除 (红色)
**功能**: 删除该条地质预报记录

**交互流程**:
- 点击"删除"按钮
- 弹出确认对话框（红色警告样式）
- 对话框显示要删除的记录名称
- 明确提示"此操作不可恢复"
- 确认后执行删除操作
- 预留了删除API调用和列表刷新的逻辑（已注释）

**代码位置**: `handleDelete` 函数

**安全措施**:
- ✅ 二次确认对话框
- ✅ 红色按钮突出显示危险性
- ✅ 明确的警告文字

---

## 🎨 UI/UX 设计亮点

### 按钮颜色设计
- **蓝色** (#165dff): 详情、修改、复制 - 常规操作
- **绿色** (#00b42a): 上传 - 积极操作
- **红色** (#ff4d4f): 删除 - 危险操作

### 表格优化
- 操作列固定在右侧 (`fixed: 'right'`)
- 操作列宽度设为 320px，确保5个按钮舒适显示
- 添加了横向滚动 (`scroll={{ x: 1200 }}`)，防止列过多时挤压

### 弹窗设计
- **详情弹窗**: 800px宽，网格布局，信息清晰
- **上传弹窗**: 600px宽，拖拽上传，用户体验友好

---

## 🔌 后端API对接指南

### 需要的API接口

#### 1. 查看详情 API
```typescript
GET /api/forecast/geology/detail/:id

返回:
{
  code: 200,
  data: {
    id: string,
    method: string,
    time: string,
    mileage: string,
    length: string,
    status: string,
    uploadTip: string,
    remark?: string,
    // ... 其他详细字段
  }
}
```

#### 2. 编辑/修改 API
```typescript
PUT /api/forecast/geology/:id
参数: 
{
  method: string,
  time: string,
  mileage: string,
  length: string,
  status: string,
  // ... 其他字段
}

返回:
{
  code: 200,
  message: '更新成功'
}
```

#### 3. 复制 API
```typescript
POST /api/forecast/geology/copy/:id

返回:
{
  code: 200,
  message: '复制成功',
  data: {
    id: string  // 新记录的ID
  }
}
```

#### 4. 上传文件 API
```typescript
POST /api/forecast/geology/upload/:id
Content-Type: multipart/form-data
参数: 
{
  files: File[]  // 文件列表
}

返回:
{
  code: 200,
  message: '上传成功',
  data: {
    fileUrls: string[]  // 上传后的文件URL
  }
}
```

#### 5. 删除 API
```typescript
DELETE /api/forecast/geology/:id

返回:
{
  code: 200,
  message: '删除成功'
}
```

---

## 📝 对接步骤

### 1. 创建API服务文件
在 `src/services/` 目录下创建或更新 `geologyForecastAPI.ts`:

```typescript
import { http } from '../utils/http'

// 查看详情
export const getGeologyForecastDetail = (id: string) => {
  return http.get(`/api/forecast/geology/detail/${id}`)
}

// 编辑
export const updateGeologyForecast = (id: string, data: any) => {
  return http.put(`/api/forecast/geology/${id}`, data)
}

// 复制
export const copyGeologyForecast = (id: string) => {
  return http.post(`/api/forecast/geology/copy/${id}`)
}

// 上传文件
export const uploadGeologyFiles = (id: string, files: File[]) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  return http.post(`/api/forecast/geology/upload/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 删除
export const deleteGeologyForecast = (id: string) => {
  return http.delete(`/api/forecast/geology/${id}`)
}
```

### 2. 在页面中导入并使用

```typescript
import { 
  getGeologyForecastDetail,
  updateGeologyForecast,
  copyGeologyForecast,
  uploadGeologyFiles,
  deleteGeologyForecast
} from '../services/geologyForecastAPI'

// 查看详情 - 从API获取
const handleViewDetail = async (record: GeologyForecastRecord) => {
  try {
    const res = await getGeologyForecastDetail(record.id)
    setSelectedRecord(res.data)
    setDetailVisible(true)
  } catch (error) {
    Message.error('获取详情失败')
  }
}

// 复制 - 调用API
const handleCopy = (record: GeologyForecastRecord) => {
  Modal.confirm({
    title: '确认复制',
    content: `确定要复制这条预报记录"${record.method}"吗？`,
    onOk: async () => {
      try {
        await copyGeologyForecast(record.id)
        Message.success('复制成功')
        fetchGeologyData() // 刷新列表
      } catch (error) {
        Message.error('复制失败，请稍后重试')
      }
    }
  })
}

// 删除 - 调用API
const handleDelete = (record: GeologyForecastRecord) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除这条预报记录"${record.method}"吗？此操作不可恢复。`,
    okButtonProps: {
      status: 'danger'
    },
    onOk: async () => {
      try {
        await deleteGeologyForecast(record.id)
        Message.success('删除成功')
        fetchGeologyData() // 刷新列表
      } catch (error) {
        Message.error('删除失败，请稍后重试')
      }
    }
  })
}

// 上传文件 - 调用API
const handleFileUpload = async (fileList: any[]) => {
  if (fileList.length > 0 && uploadingRecord) {
    try {
      Message.loading('正在上传...')
      const files = fileList.map(item => item.originFile)
      await uploadGeologyFiles(uploadingRecord.id, files)
      Message.success('上传成功')
      setUploadVisible(false)
      fetchGeologyData() // 刷新列表
    } catch (error) {
      Message.error('上传失败，请稍后重试')
    }
  }
}
```

---

## 🎯 当前状态

- ✅ 所有5个按钮都可以点击
- ✅ 详情功能完整（含弹窗UI）
- ✅ 修改功能有提示反馈
- ✅ 复制功能有确认对话框
- ✅ 上传功能完整（含拖拽上传UI）
- ✅ 删除功能有确认对话框
- ✅ 表格支持横向滚动
- ✅ 操作列固定在右侧
- ⏳ 等待后端API接口开发
- ⏳ 需要将TODO部分替换为真实API调用

---

## 💡 使用建议

1. **优先级**: 建议按 详情 → 删除 → 上传 → 复制 → 修改 的顺序对接API
2. **测试**: 每对接一个功能，立即测试交互流程
3. **权限控制**: 考虑根据用户角色显示/隐藏某些操作按钮
4. **加载状态**: 对接API时添加loading状态，提升用户体验
5. **错误处理**: 所有API调用都应该有完善的错误处理和提示

---

## 🧪 测试清单

- [ ] 点击"详情"能打开弹窗并显示数据
- [ ] 点击"修改"有提示消息
- [ ] 点击"复制"弹出确认对话框
- [ ] 确认复制后显示成功消息
- [ ] 点击"上传"弹出上传弹窗
- [ ] 上传弹窗支持拖拽文件
- [ ] 上传弹窗支持多文件选择
- [ ] 点击"删除"弹出确认对话框（红色样式）
- [ ] 确认删除后显示成功消息
- [ ] 所有弹窗的取消按钮正常工作
- [ ] 5个按钮的颜色区分明显
- [ ] 表格横向滚动正常
- [ ] 操作列固定在右侧

---

## 📸 功能截图位置

表格操作列显示位置：最右侧，固定列
- 详情（蓝色）
- 修改（蓝色）
- 复制（蓝色）
- 上传（绿色）
- 删除（红色）

所有按钮在同一行，间距适中，易于点击。

