# API Request Body 格式指南

根据Swagger文档 (http://121.40.127.120:8080/v3/api-docs) 整理

## ⚠️ 重要说明

**后端API使用 `username` 字段，不是 `login`！**

虽然前端登录时使用 `login` 字段，但在所有POST/PUT请求的request body中，需要使用 `username` 字段来标识填写人。

## ✅ 已修正的接口

### 1. POST /api/v1/sjyb (设计预报方法)

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
  "username": "admin"  // ← 使用 username 字段
}
```

**TypeScript接口:**
```typescript
interface DesignForecastRequest {
  bdPk: number;
  sdPk: number;
  method: number;
  dkname: string;
  dkilo: number;
  endMileage: number;
  sjybLength: number;
  zxms?: number;
  zksl?: number;
  qxsl?: number;
  plannum?: number;
  username: string;
}
```

### 2. POST /api/v1/sjwydj (设计围岩等级)

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
    "username": "admin"  // ← 使用 login 而不是 username
  }
}
```

**TypeScript接口:**
```typescript
interface DesignRockGradeRequest {
  sjwydj: {
    siteId: string;
    dkname: string;
    dkilo: number;
    sjwydjLength: number;
    wydj: number;
    revise?: string;
    username: string;
  };
}
```

### 3. POST /api/v1/sjdz (设计地质信息)

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
    "username": "admin"  // ← 使用 login 而不是 username
  }
}
```

**TypeScript接口:**
```typescript
interface DesignGeologyRequest {
  sjdz: {
    siteId: number;
    method: number;
    dkname: string;
    dkilo: number;
    sjdzLength: number;
    dzxxfj?: number;
    revise?: string;
    username: string;
  };
}
```

## 📝 关键注意事项

### 1. 登录 vs 请求体字段
- **登录接口**：使用 `login` 字段
- **数据接口**：使用 `username` 字段标识填写人

### 2. 包装格式
- `sjwydj` 接口需要将数据包装在 `sjwydj` 对象中
- `sjdz` 接口需要将数据包装在 `sjdz` 对象中
- `sjyb` 接口直接使用扁平结构

### 3. 自动填充 login
在 `realAPI.ts` 中，已添加 `getCurrentLogin()` 方法自动从 localStorage 获取当前登录用户名：

```typescript
private getCurrentLogin(): string {
  return localStorage.getItem('login') || 'admin';
}
```

### 4. 认证头格式
所有请求使用 Bearer Token 认证：
```
Authorization: Bearer {token}
```

## 🔧 使用示例

### 创建设计预报
```typescript
const data: DesignForecastRequest = {
  bdPk: 1,
  sdPk: 1,
  method: 1,
  dkname: "DK",
  dkilo: 69,
  endMileage: 12.67,
  sjybLength: 7.0,
  zxms: 7.0,
  zksl: 5,
  qxsl: 9,
  plannum: 7,
  username: getCurrentLogin()
};

await realAPI.createForecastDesign(data);
```

### 创建设计围岩等级
```typescript
const data: DesignRockGradeRequest = {
  sjwydj: {
    siteId: "1",
    dkname: "DK",
    dkilo: 69,
    sjwydjLength: 100,
    wydj: 3,
    username: getCurrentLogin()
  }
};

await realAPI.createDesignRockGrade(data);
```

### 创建设计地质信息
```typescript
const data: DesignGeologyRequest = {
  sjdz: {
    siteId: 1,
    method: 1,
    dkname: "DK",
    dkilo: 69,
    sjdzLength: 100,
    username: getCurrentLogin()
  }
};

await realAPI.createDesignGeology(data);
```

## 📋 待确认的接口

以下接口的Request Body格式需要根据实际使用情况确认：

- POST /api/v1/wtf/tsp (地震波反射) - multipart/form-data
- POST /api/v1/zzmsm (掌子面素描)
- POST /api/v1/dssm (洞身素描)
- POST /api/v1/dbbc (地表补充)
- POST /api/v1/ztf (钻探法)

这些接口可能需要特殊的文件上传处理或不同的数据结构。

## 🔄 更新日志

- 2024-11-17: 根据Swagger文档修正所有POST接口的Request Body格式
- 2024-11-17: 将所有 `username` 字段改为 `login`
- 2024-11-17: 添加自动填充 login 的功能
- 2024-11-17: 修正 `sjwydj` 和 `sjdz` 接口的包装格式
