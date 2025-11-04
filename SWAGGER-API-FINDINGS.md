# Swagger API 查找结果

## 📊 后端API现状

### Swagger文档地址
- UI界面: http://121.40.127.120:8080/swagger-ui/index.html
- JSON文档: http://121.40.127.120:8080/v3/api-docs

### 发现的API总数
**共28个API接口**，全部为 **GET方法**（只读操作）

## 🎯 设计围岩相关API

找到了以下与设计围岩等级相关的API：

### 1. 获取设计围岩等级列表
```
GET /api/v1/sjwydj/list
```

**参数**:
- `userid` (必填): 用户ID
- `pageNum` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认15
- `wydj` (可选): 围岩等级筛选

**响应**:
```json
{
  "resultcode": 200,
  "message": "成功",
  "data": {
    "sjwydjIPage": {
      "current": 1,
      "size": 15,
      "records": [
        {
          "sjwydjPk": 123,
          "sjwydjId": 1,
          "sitePk": 1,
          "dkname": "DK",
          "dkilo": 713.485,
          "sjwydjLength": -205.00,
          "wydj": 4,
          "revise": "修改原因说明",
          "username": "一分部",
          "gmtCreate": "2022-04-12T17:38:30",
          "gmtModified": "2022-04-12T17:38:30"
        }
      ],
      "total": 100,
      "pages": 7
    }
  }
}
```

### 2. 获取设计围岩等级详情
```
GET /api/v1/sjwydj/{sjwydjPk}
```

**参数**:
- `sjwydjPk` (路径参数): 设计围岩等级主键

**响应**:
```json
{
  "resultcode": 200,
  "message": "成功",
  "data": {
    "sjwydj": {
      "sjwydjPk": 123,
      "sjwydjId": 1,
      "sitePk": 1,
      "dkname": "DK",
      "dkilo": 713.485,
      "sjwydjLength": -205.00,
      "wydj": 4,
      "revise": "修改原因说明",
      "username": "一分部",
      "gmtCreate": "2022-04-12T17:38:30",
      "gmtModified": "2022-04-12T17:38:30"
    }
  }
}
```

## 📋 数据字段映射

| 前端字段 | 后端字段 | 类型 | 说明 |
|---------|---------|------|------|
| 围岩等级 | wydj | integer | 1-6对应I-VI |
| 里程冠号 | dkname | string | 例如：DK |
| 开始里程 | dkilo | number | 里程公里数 |
| 预报长度 | sjwydjLength | number | 可为负数 |
| 填写人 | username | string | 例如：一分部 |
| 修改原因 | revise | string | 修改说明 |

## ⚠️ 重要发现

### 缺少的API接口

**后端Swagger中没有以下操作的API**：
- ❌ **POST** - 创建/新增设计围岩
- ❌ **PUT** - 修改/更新设计围岩
- ❌ **DELETE** - 删除设计围岩

**这意味着**：
1. 后端可能还没有实现这些功能
2. 或者这些API没有在Swagger中注册
3. 或者使用了不同的接口路径

## 💡 建议方案

### 方案1：使用Mock数据（当前方案）
```typescript
// 继续使用apiAdapter中的Mock实现
await apiAdapter.createForecastDesign(submitData)
```

**优点**：
- ✅ 前端功能完整，可以演示
- ✅ 不依赖后端进度
- ✅ 快速迭代UI

**缺点**：
- ❌ 数据不会真正保存
- ❌ 刷新页面后数据丢失

### 方案2：联系后端开发补充API

需要后端提供以下API：

#### 新增设计围岩
```
POST /api/v1/sjwydj
Content-Type: application/json

{
  "sitePk": 1,
  "dkname": "DK",
  "dkilo": 713.485,
  "sjwydjLength": -205.00,
  "wydj": 4,
  "revise": "修改原因说明",
  "username": "一分部"
}
```

#### 修改设计围岩
```
PUT /api/v1/sjwydj/{sjwydjPk}
Content-Type: application/json

{
  "dkname": "DK",
  "dkilo": 713.485,
  "sjwydjLength": -205.00,
  "wydj": 4,
  "revise": "修改原因说明",
  "username": "一分部"
}
```

#### 删除设计围岩
```
DELETE /api/v1/sjwydj/{sjwydjPk}
```

### 方案3：直接调用现有GET接口做展示

如果暂时不需要编辑功能，可以：
```typescript
// 获取列表数据
const response = await http.get('/api/v1/sjwydj/list', {
  params: {
    userid: 1,
    pageNum: 1,
    pageSize: 10
  }
})

// 转换数据格式
const list = response.data.sjwydjIPage.records.map(item => ({
  id: item.sjwydjPk.toString(),
  rockGrade: getRockGradeLabel(item.wydj), // 将1-6转换为I-VI
  startMileage: `${item.dkname}${item.dkilo}`,
  length: item.sjwydjLength,
  author: item.username,
  createdAt: item.gmtCreate,
  // ...
}))
```

## 🔄 围岩等级转换

```typescript
// 数字转罗马数字
function getRockGradeLabel(wydj: number): string {
  const map: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI'
  }
  return map[wydj] || 'IV'
}

// 罗马数字转数字
function getRockGradeValue(label: string): number {
  const map: Record<string, number> = {
    'I': 1,
    'II': 2,
    'III': 3,
    'IV': 4,
    'V': 5,
    'VI': 6
  }
  return map[label] || 4
}
```

## 📝 后续行动建议

1. **确认后端开发进度**
   - 联系后端团队确认修改、新增、删除API的开发计划
   - 询问预计完成时间

2. **临时使用Mock数据**
   - 前端功能保持完整
   - 待后端API就绪后替换

3. **准备API对接文档**
   - 将上述API需求整理成文档
   - 提供给后端参考

4. **集成GET接口**
   - 先集成列表查询功能
   - 让用户可以看到真实数据

## 🔍 其他发现的相关API

### 设计地质信息 (sjdz)
- `GET /api/v1/sjdz/list` - 获取设计地质信息列表
- `GET /api/v1/sjdz/{sjdzPk}` - 获取设计地质信息详情

### 设计预报方法 (sjyb)
- `GET /api/v1/sjyb/list` - 获取设计预报方法列表
- `GET /api/v1/sjyb/{sjybPk}` - 获取设计预报方法详情

### 综合结论 (zhjl)
- `GET /api/v1/zhjl/list` - 获取综合结论列表

这些API可能在将来的功能开发中会用到。

## 总结

目前后端只提供了**查询功能**的API，**编辑、新增、删除**功能的API还未实现或未在Swagger中暴露。建议：

1. ✅ 前端功能已完整实现（使用Mock）
2. ⏳ 等待后端补充编辑相关API
3. 🔄 API就绪后，替换Mock为真实API调用

前端已经为真实API对接做好准备！

