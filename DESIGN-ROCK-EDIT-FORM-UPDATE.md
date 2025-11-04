# 设计围岩编辑表单更新说明

## 概述
已按照设计稿更新了"修改设计围岩"弹窗表单的字段和布局，使其符合实际业务需求。

## ✅ 主要修改

### 1. 弹窗标题更改
- **旧标题**: "修改设计预报"
- **新标题**: "修改设计围岩"

### 2. 表单字段重构

#### 修改前的字段（已删除）：
- ❌ 预报方法
- ❌ 结束里程
- ❌ 最小埋深
- ❌ 钻孔数量
- ❌ 取芯数量
- ❌ 设计次数

#### 修改后的字段（新增/保留）：
| 字段名称 | 字段类型 | 是否必填 | 说明 |
|---------|---------|---------|------|
| **围岩等级** | Select下拉 | ✅ 必填 | 选项：I, II, III, IV, V, VI |
| **里程冠号** | Input输入 | ✅ 必填 | 例如：DK |
| **开始里程** | InputNumber×2 | ✅ 必填 | 例如：713 + 485 |
| **预报长度** | InputNumber | ✅ 必填 | 可为负数，例如：-205.00 |
| **填写人** | Select下拉 | ✅ 必填 | 选项：一分部、二分部、三分部、其他 |
| **修改原因说明** | TextArea文本域 | ✅ 必填 | 多行输入 |

### 3. 表单布局

```
┌─────────────────────────────────────────┐
│ 修改设计围岩                             │
├─────────────────────────────────────────┤
│                                          │
│ [围岩等级: IV ▼]  [里程冠号: DK      ]  │
│                                          │
│ [开始里程: 713  +  485               ]  │
│                                          │
│ [预报长度: -205.00] [填写人: 一分部 ▼]  │
│                                          │
│ [修改原因说明:                        ]  │
│ [                                     ]  │
│ [                                     ]  │
│                                          │
│              [确定]  [取消]              │
└─────────────────────────────────────────┘
```

## 🔧 技术实现

### 数据类型定义
```typescript
type ForecastRecord = {
  id: string
  createdAt: string
  method: string
  rockGrade?: string      // 围岩等级（新增）
  mileagePrefix?: string  // 里程冠号
  startMileage: string
  // ... 其他字段
  author?: string         // 填写人
  modifyReason?: string   // 修改原因说明
}
```

### 表单字段配置

#### 围岩等级（新增）
```typescript
<Form.Item label="围岩等级" field="rockGrade" rules={[{ required: true }]}>
  <Select options={[
    { label: 'I', value: 'I' },
    { label: 'II', value: 'II' },
    { label: 'III', value: 'III' },
    { label: 'IV', value: 'IV' },
    { label: 'V', value: 'V' },
    { label: 'VI', value: 'VI' }
  ]} />
</Form.Item>
```

#### 开始里程（保留）
两个InputNumber组合，中间用"+"连接：
```typescript
<Form.Item label="开始里程" required>
  <Space>
    <Form.Item field="startMileageMain" noStyle>
      <InputNumber placeholder="713" style={{ width: '120px' }} />
    </Form.Item>
    <span>+</span>
    <Form.Item field="startMileageSub" noStyle>
      <InputNumber placeholder="485" style={{ width: '120px' }} />
    </Form.Item>
  </Space>
</Form.Item>
```

#### 预报长度（保留）
```typescript
<Form.Item label="预报长度" field="length" rules={[{ required: true }]}>
  <InputNumber placeholder="-205.00" style={{ width: '100%' }} />
</Form.Item>
```

#### 填写人（修改选项）
```typescript
<Form.Item label="填写人" field="author" rules={[{ required: true }]}>
  <Select options={[
    { label: '一分部', value: '一分部' },
    { label: '二分部', value: '二分部' },
    { label: '三分部', value: '三分部' },
    { label: '其他', value: '其他' }
  ]} />
</Form.Item>
```

### 表单提交逻辑

```typescript
const handleEditOk = async () => {
  const values = await addForm.validate()
  
  // 合并开始里程
  const startMileage = `${values.mileagePrefix}${values.startMileageMain}+${values.startMileageSub}`
  
  const submitData = {
    id: editingRecord.id,
    rockGrade: values.rockGrade,
    mileagePrefix: values.mileagePrefix,
    startMileage,
    length: values.length,
    author: values.author,
    modifyReason: values.modifyReason,
  }
  
  await apiAdapter.createForecastDesign(submitData)
  Message.success('修改成功')
  // ... 关闭弹窗并刷新列表
}
```

### 表单初始化

```typescript
const handleEdit = (record: ForecastRecord) => {
  // 解析里程
  const startMileageParts = record.startMileage.match(/(\d+)\+(\d+)/)
  const startMileageMain = startMileageParts ? parseInt(startMileageParts[1]) : 0
  const startMileageSub = startMileageParts ? parseInt(startMileageParts[2]) : 0
  
  addForm.setFieldsValue({
    rockGrade: 'IV',  // 默认围岩等级
    mileagePrefix: record.mileagePrefix || 'DK',
    startMileageMain,
    startMileageSub,
    length: record.length,
    author: record.author || '一分部',
    modifyReason: record.modifyReason || '',
  })
  
  setEditVisible(true)
}
```

## 📊 字段说明

### 围岩等级
- **类型**: 单选下拉
- **选项**: I, II, III, IV, V, VI（罗马数字）
- **默认值**: IV
- **用途**: 标识围岩的稳定性等级，影响施工方案

### 里程冠号
- **类型**: 文本输入
- **格式**: 通常为"DK"或"K"
- **示例**: DK、K
- **用途**: 铁路线路里程的前缀标识

### 开始里程
- **类型**: 数字输入（分两部分）
- **格式**: 主里程 + 附加里程
- **示例**: 713 + 485 → DK713+485
- **说明**: 主里程单位为公里，附加里程单位为米

### 预报长度
- **类型**: 数字输入（可为负数）
- **单位**: 米
- **示例**: -205.00（负数表示回退方向）
- **说明**: 预报的围岩长度

### 填写人
- **类型**: 单选下拉
- **选项**: 一分部、二分部、三分部、其他
- **用途**: 记录填写此预报的责任单位

### 修改原因说明
- **类型**: 多行文本
- **行数**: 3行
- **用途**: 记录修改此预报的原因，便于追溯

## 🎯 与原表单的对比

| 功能 | 修改前 | 修改后 |
|-----|-------|-------|
| 字段数量 | 11个 | 6个 |
| 表单复杂度 | 高（多个专业字段） | 中（核心字段） |
| 业务焦点 | 预报设计 | 围岩等级 |
| 表单标题 | 修改设计预报 | 修改设计围岩 |
| 围岩等级 | ❌ 无 | ✅ 新增 |
| 钻孔/取芯 | ✅ 有 | ❌ 删除 |

## 🔌 API对接建议

### 更新设计围岩API

```typescript
PUT /api/forecast/design-rock/:id

请求体:
{
  rockGrade: string,        // 围岩等级
  mileagePrefix: string,    // 里程冠号
  startMileage: string,     // 开始里程（完整格式）
  length: number,           // 预报长度
  author: string,           // 填写人
  modifyReason: string      // 修改原因
}

响应:
{
  code: 200,
  message: '修改成功',
  data: {
    id: string,
    // ... 更新后的数据
  }
}
```

## 💡 使用场景

1. **地质工程师**点击表格中的编辑按钮
2. 弹出"修改设计围岩"表单
3. 修改围岩等级、里程、长度等信息
4. 填写修改原因
5. 点击"确定"提交
6. 系统保存修改并刷新列表

## ✅ 验证清单

- [ ] 弹窗标题显示"修改设计围岩"
- [ ] 围岩等级下拉显示I-VI选项
- [ ] 里程冠号输入框显示"DK"
- [ ] 开始里程分两个输入框，中间有"+"号
- [ ] 预报长度可以输入负数
- [ ] 填写人下拉显示分部选项
- [ ] 修改原因为多行文本框
- [ ] 所有字段必填验证正常
- [ ] 提交后显示"修改成功"
- [ ] 列表自动刷新

现在的表单完全符合设计稿要求！

