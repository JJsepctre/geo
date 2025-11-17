# 所有API接口Request Body完整列表

根据Swagger文档 (api-docs.json) 整理的所有POST/PUT接口

## 📋 接口清单

### 认证接口 (3个)
1. POST /api/auth/login - 用户登录
2. POST /api/auth/logout - 用户登出
3. POST /api/auth/reset-password - 重置密码

### 设计预报接口 (2个)
4. POST /api/v1/sjyb - 创建设计预报方法
5. PUT /api/v1/sjyb/{sjybPk} - 更新设计预报方法

### 设计围岩等级接口 (1个)
6. POST /api/v1/sjwydj - 创建设计围岩等级
7. PUT /api/v1/sjwydj/{sjwydjPk} - 更新设计围岩等级

### 设计地质信息接口 (1个)
8. POST /api/v1/sjdz - 创建设计地质信息
9. PUT /api/v1/sjdz/{sjdzPk} - 更新设计地质信息

### 物探法接口 (2个)
10. POST /api/v1/wtf/tsp - 创建TSP地震波反射数据
11. PUT /api/v1/wtf/tsp/{ybPk} - 更新TSP地震波反射数据

---

## 🔧 详细接口定义

### 1. POST /api/auth/login (用户登录)

**Request Body:**
```json
{
  "login": "admin",
  "password": "password123"
}
```

**TypeScript接口:**
```typescript
interface LoginRequest {
  login: string;      // 用户名 (必填)
  password: string;   // 密码 (必填)
}
```

**注意:** 登录接口使用 `login` 字段，而不是 `username`

---

### 2. POST /api/auth/logout (用户登出)

**Request Body:** 无

---

### 3. POST /api/auth/reset-password (重置密码)

**Request Body:**
```json
{
  "userPk": 1,
  "newPassword": "newpass123"
}
```

**TypeScript接口:**
```typescript
interface ResetPasswordRequest {
  userPk?: number;      // 用户主键 (可选)
  newPassword: string;  // 新密码 (必填, 6-20字符)
}
```

---

### 4. POST /api/v1/sjyb (创建设计预报方法)

**Request Body:**
```json
{
  "bdPk": 1,
  "sdPk": 1,
  "method": 1,
  "dkname": "DK",
  "dkilo": 69,
  "endMileage": 12.67,
  "sjybLength": 7.0,
  "zxms": 7.0,
  "zksl": 5,
  "qxsl": 9,
  "plannum": 7,
  "username": "张三"
}
```

**TypeScript接口:**
```typescript
interface DesignForecastCreateRequest {
  bdPk: number;          // 标段主键 (必填)
  sdPk: number;          // 隧道主键 (必填)
  method: number;        // 预报方法代码 (必填, 0-99)
  dkname: string;        // 里程冠号 (必填)
  dkilo: number;         // 起始里程 (必填, int32)
  endMileage: number;    // 结束里程 (必填, double)
  sjybLength: number;    // 预报长度 (必填, double)
  zxms: number;          // 最小埋深 (必填, >=0)
  zksl: number;          // 钻孔数量 (必填, >=0)
  qxsl: number;          // 取芯数量 (必填, >=0)
  plannum: number;       // 设计次数 (必填, >=1)
  username: string;      // 填写人账号 (必填)
}
```

**所有字段都是必填！**

---

### 5. PUT /api/v1/sjyb/{sjybPk} (更新设计预报方法)

**Request Body:**
```json
{
  "bdPk": 1,
  "sdPk": 1,
  "method": 1,
  "dkname": "DK",
  "dkilo": 69,
  "endMileage": 12.67,
  "sjybLength": 7.0,
  "zxms": 7.0,
  "zksl": 5,
  "qxsl": 9,
  "plannum": 7,
  "username": "张三",
  "revise": "修改原因说明"
}
```

**TypeScript接口:**
```typescript
interface DesignForecastUpdateRequest {
  bdPk: number;          // 标段主键 (必填)
  sdPk: number;          // 隧道主键 (必填)
  method: number;        // 预报方法代码 (必填, 0-99)
  dkname: string;        // 里程冠号 (必填)
  dkilo: number;         // 起始里程 (必填, int32)
  endMileage: number;    // 结束里程 (必填, double)
  sjybLength: number;    // 预报长度 (必填, double)
  zxms: number;          // 最小埋深 (必填, >=0)
  zksl: number;          // 钻孔数量 (必填, >=0)
  qxsl: number;          // 取芯数量 (必填, >=0)
  plannum: number;       // 设计次数 (必填, >=1)
  username: string;      // 填写人账号 (必填)
  revise: string;        // 修改原因说明 (必填) ← 比创建多了这个字段
}
```

**注意:** 更新接口比创建接口多了 `revise` 字段（必填）

---

### 6. POST /api/v1/sjwydj (创建设计围岩等级)

**Request Body (包装格式):**
```json
{
  "sjwydj": {
    "siteId": "1",
    "dkname": "DK",
    "dkilo": 69,
    "sjwydjLength": 100,
    "wydj": 3,
    "revise": "修改原因",
    "username": "张三"
  }
}
```

**TypeScript接口:**
```typescript
interface DesignRockGradeRequest {
  sjwydj: {
    siteId: string;        // 工点ID
    dkname: string;        // 里程冠号
    dkilo: number;         // 里程公里数
    sjwydjLength: number;  // 预报长度
    wydj: number;          // 围岩等级 (1-6)
    revise?: string;       // 修改原因
    username: string;      // 填写人账号
  };
}
```

**注意:** 数据需要包装在 `sjwydj` 对象中

---

### 7. PUT /api/v1/sjwydj/{sjwydjPk} (更新设计围岩等级)

**Request Body:** 同创建接口，包装格式相同

---

### 8. POST /api/v1/sjdz (创建设计地质信息)

**Request Body (包装格式):**
```json
{
  "sjdz": {
    "siteId": 1,
    "method": 1,
    "dkname": "DK",
    "dkilo": 69,
    "sjdzLength": 100,
    "dzxxfj": 1,
    "revise": "修改原因",
    "username": "张三"
  }
}
```

**TypeScript接口:**
```typescript
interface DesignGeologyRequest {
  sjdz: {
    siteId: number;        // 工点ID
    method: number;        // 方法代码
    dkname: string;        // 里程冠号
    dkilo: number;         // 起点里程
    sjdzLength: number;    // 长度
    dzxxfj?: number;       // 地质信息附加
    revise?: string;       // 修改原因
    username: string;      // 填写人账号
  };
}
```

**注意:** 数据需要包装在 `sjdz` 对象中

---

### 9. PUT /api/v1/sjdz/{sjdzPk} (更新设计地质信息)

**Request Body:** 同创建接口，包装格式相同

---

### 10. POST /api/v1/wtf/tsp (创建TSP地震波反射数据)

**Content-Type:** `multipart/form-data`

**Request Body:** 非常复杂，包含大量字段和文件上传

**TypeScript接口:**
```typescript
interface TspDTO {
  // 基础预报信息
  siteId?: string;
  dkname?: string;
  dkilo?: number;
  ybLength?: number;
  monitordate?: string;
  
  // 人员信息
  testname?: string;
  testno?: string;
  testtel?: string;
  monitorname?: string;
  monitorno?: string;
  monitortel?: string;
  supervisorname?: string;
  supervisorno?: string;
  supervisortel?: string;
  
  // 结论信息
  conclusionyb?: string;
  suggestion?: string;
  solution?: string;
  remark?: string;
  method?: number;
  
  // TSP特有字段
  tspId?: string;
  jfpknum?: number;
  jfpksd?: number;
  jfpkzj?: number;
  jfpkjdmgd?: number;
  jfpkjj?: number;
  jspknum?: number;
  jspksd?: number;
  jspkzj?: number;
  jspkjdmgd?: number;
  sbName?: string;
  kwwz?: number;
  leftkilo?: number;
  rightkilo?: number;
  // ... 更多字段
  
  // 图片文件 (binary)
  pic1?: File;
  pic2?: File;
  pic3?: File;
  pic4?: File;
  pic5?: File;
  pic6?: File;
  
  // 关联数据列表
  ybjgDTOList?: any[];
  tspBxdataDTOList?: any[];
  tspPddataDTOList?: any[];
}
```

**注意:** 
- 使用 `multipart/form-data` 格式
- 包含文件上传字段
- 字段非常多，大部分是可选的

---

### 11. PUT /api/v1/wtf/tsp/{ybPk} (更新TSP地震波反射数据)

**Request Body:** 同创建接口，使用 `multipart/form-data` 格式

---

## 🔑 关键注意事项

### 1. 字段命名差异
- **登录接口**: 使用 `login` 字段
- **数据接口**: 使用 `username` 字段标识填写人

### 2. 包装格式
- `sjyb` 接口: 扁平结构
- `sjwydj` 接口: 包装在 `{ sjwydj: {...} }` 中
- `sjdz` 接口: 包装在 `{ sjdz: {...} }` 中

### 3. 必填字段
- 所有标记为"必填"的字段都必须提供
- 更新接口通常比创建接口多一个 `revise` 字段

### 4. 文件上传
- TSP接口使用 `multipart/form-data` 格式
- 图片字段类型为 `File` 或 `string`

### 5. 自动填充
在 `realAPI.ts` 中，`username` 字段会自动从 localStorage 获取当前登录用户名：

```typescript
private getCurrentLogin(): string {
  return localStorage.getItem('login') || 'admin';
}
```

---

## ✅ 实现状态

| 接口 | 类型定义 | 实现方法 | 状态 |
|------|---------|---------|------|
| POST /api/auth/login | ✅ LoginRequest | - | ✅ 已定义 |
| POST /api/auth/logout | - | - | ✅ 无需body |
| POST /api/auth/reset-password | ✅ ResetPasswordRequest | - | ✅ 已定义 |
| POST /api/v1/sjyb | ✅ DesignForecastCreateRequest | ✅ createForecastDesign | ✅ 已实现 |
| PUT /api/v1/sjyb/{sjybPk} | ✅ DesignForecastUpdateRequest | ✅ updateForecastDesign | ✅ 已实现 |
| POST /api/v1/sjwydj | ✅ DesignRockGradeRequest | ✅ createDesignRockGrade | ✅ 已实现 |
| PUT /api/v1/sjwydj/{sjwydjPk} | ✅ DesignRockGradeRequest | - | ⚠️ 需实现 |
| POST /api/v1/sjdz | ✅ DesignGeologyRequest | ✅ createDesignGeology | ✅ 已实现 |
| PUT /api/v1/sjdz/{sjdzPk} | ✅ DesignGeologyRequest | - | ⚠️ 需实现 |
| POST /api/v1/wtf/tsp | ✅ TspDTO | - | ⚠️ 需实现 |
| PUT /api/v1/wtf/tsp/{ybPk} | ✅ TspDTO | - | ⚠️ 需实现 |

---

## 📝 更新日志

- 2024-11-17: 创建完整的API接口文档
- 2024-11-17: 添加所有11个POST/PUT接口的详细定义
- 2024-11-17: 区分创建和更新接口的差异
- 2024-11-17: 标注所有必填字段和数据类型
