# API 错误分析与修复方案

## 🔴 当前错误

```
GET http://localhost:3000/api/v1/wtf/list?siteId=307907&type=1&pageNum=1&pageSize=100 500 (Internal Server Error)
```

**错误信息**: `read ECONNRESET` - 后端连接被重置

---

## 📊 API 文档分析（基于 api-docs.json）

### 1. 正确的 API 接口定义

#### 物探法列表接口
- **路径**: `GET /api/v1/wtf/list`
- **参数对象**: `YbInfoPageQueryDTO`
- **参数结构**:
  ```typescript
  {
    pageNum: number,      // 页码
    pageSize: number,     // 每页数量
    siteId: string,       // 工点ID (必填)
    type: number,         // 预报类型 (1=物探法, 2=掌子面, 3=洞身, 4=钻探)
    method?: number,      // 预报方法 (可选，用于筛选具体方法)
    begin?: datetime,     // 开始时间 (可选)
    end?: datetime,       // 结束时间 (可选)
    submitFlag?: number   // 提交状态 (可选, 0=编辑中, 1=已上传)
  }
  ```

#### 响应格式
```typescript
{
  resultcode: number,  // 0=成功
  message: string,
  data: {
    records: YbInfoVO[],  // 数据列表
    total: number,        // 总记录数
    size: number,         // 每页数量
    current: number,      // 当前页
    pages: number         // 总页数
  }
}
```

#### YbInfoVO 数据结构
```typescript
{
  ybPk: number,           // 预报主键
  ybId: number,           // 预报ID
  method: number,         // 预报方法代码
  dkilo: number,          // 里程（米）
  ybLength: number,       // 预报长度
  monitordate: datetime,  // 监测日期
  submitFlag: number      // 提交状态 (0=编辑中, 1=已上传)
}
```

### 2. 其他类似接口

| 接口路径 | 预报类型 | type值 | 说明 |
|---------|---------|--------|------|
| `/api/v1/wtf/list` | 物探法 | 1 | 包含 TSP、HSP、陆地声呐等 |
| `/api/v1/zzmsm/list` | 掌子面素描 | 2 | method 不填 |
| `/api/v1/dssm/list` | 洞身素描 | 3 | method 不填 |
| `/api/v1/ztf/list` | 钻探法 | 4 | 超前水平钻、加深炮孔 |
| `/api/v1/dbbc/list` | 地表补充 | 5 | method 不填 |

---

## ⚠️ 错误原因分析

### 可能原因 1: 后端服务不可达
```
http://121.40.127.120:8080 - 后端服务器可能：
1. 宕机或重启中
2. 网络不稳定
3. 防火墙阻止
4. 服务超时
```

### 可能原因 2: 工点 ID 不存在
```
siteId=307907 - 这个工点ID可能：
1. 在数据库中不存在
2. 已被删除
3. 用户无权访问
4. ID格式错误（应该是字符串但传了数字？）
```

### 可能原因 3: 参数格式问题
```
当前请求: ?siteId=307907&type=1&pageNum=1&pageSize=100
- 参数格式是正确的 ✅
- Spring Boot会自动将query参数绑定到YbInfoPageQueryDTO
```

### 可能原因 4: 后端代码bug
```
后端可能在以下情况抛出500:
1. 数据库查询异常
2. 空指针异常
3. 数据转换异常
4. 业务逻辑错误
```

---

## ✅ 修复方案

### 方案 1: 增加错误处理和降级 (推荐)

```typescript
async getGeophysicalList(params: { pageNum: number; pageSize: number; siteId: string }): Promise<PageResponse<any>> {
  try {
    // 参数验证
    if (!params.siteId) {
      console.error('❌ siteId 是必填参数');
      return { records: [], total: 0, current: 1, size: 10, pages: 0 };
    }

    const queryParams = {
      siteId: params.siteId,
      type: 1,  // 物探法
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 15
    };

    console.log('📤 请求参数:', queryParams);

    const response = await get<any>('/api/v1/wtf/list', { 
      params: queryParams,
      timeout: 30000  // 30秒超时
    });

    console.log('✅ 响应数据:', response);

    // 响应数据处理
    let pageData = null;
    if (response?.data) {
      pageData = response.data;
    } else if (response?.records) {
      pageData = response;
    }

    if (pageData) {
      return {
        records: pageData.records || [],
        total: pageData.total || 0,
        current: pageData.current || 1,
        size: pageData.size || 10,
        pages: pageData.pages || 1
      };
    }

    console.warn('⚠️ 响应数据格式异常:', response);
    return { records: [], total: 0, current: 1, size: 10, pages: 0 };

  } catch (error: any) {
    console.error('❌ getGeophysicalList 异常:', error);
    
    // 详细错误信息
    if (error.code === 'ECONNRESET') {
      console.error('💡 后端服务连接被重置，可能原因：');
      console.error('   1. 后端服务未启动');
      console.error('   2. 网络连接问题');
      console.error('   3. 请求超时');
    } else if (error.response?.status === 500) {
      console.error('💡 后端服务器错误，可能原因：');
      console.error('   1. 工点ID不存在:', params.siteId);
      console.error('   2. 数据库查询异常');
      console.error('   3. 后端代码bug');
    }
    
    // 返回空数据，让页面正常显示
    return { records: [], total: 0, current: 1, size: 10, pages: 0 };
  }
}
```

### 方案 2: 临时切换到 Mock 模式

在 `src/services/apiAdapter.ts` 中：

```typescript
// 临时强制使用 Mock API
const USE_REAL_API = false;  // 改为 false
```

或者设置环境变量：

```bash
# .env 文件
REACT_APP_USE_REAL_API=false
```

### 方案 3: 验证工点ID

在调用API前，先验证工点ID是否存在：

```typescript
// 在 GeologyForecastPage.tsx 中
useEffect(() => {
  if (!siteId) {
    Message.error('缺少工点ID参数');
    navigate('/geo-forecast');  // 返回工点列表页
    return;
  }
  
  // 验证 siteId 格式
  if (!/^\d+$/.test(siteId)) {
    Message.error('工点ID格式不正确');
    return;
  }
  
  // 加载数据...
}, [siteId]);
```

### 方案 4: 添加重试机制

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

// 使用
const data = await retryRequest(() => 
  apiAdapter.getGeophysicalList({ pageNum: 1, pageSize: 10, siteId })
);
```

---

## 🔍 调试步骤

### 1. 检查后端服务状态

```bash
# 测试后端是否可达
curl http://121.40.127.120:8080/api/v1/wtf/list?siteId=1&type=1&pageNum=1&pageSize=10

# 或使用浏览器直接访问
http://121.40.127.120:8080/api/v1/wtf/list?siteId=1&type=1&pageNum=1&pageSize=10
```

### 2. 验证工点ID

```bash
# 先获取有效的工点列表
curl http://121.40.127.120:8080/api/v1/bd/bd-gd/1

# 使用返回的 sitePk 作为 siteId
```

### 3. 查看控制台日志

- 打开浏览器开发者工具
- 查看 Network 标签中的请求详情
- 查看 Console 中的错误日志

### 4. 检查代理配置

```javascript
// src/setupProxy.js
module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://121.40.127.120:8080',
    changeOrigin: true,
    logLevel: 'debug'  // 添加详细日志
  }));
};
```

---

## 📝 建议的后续工作

1. **联系后端开发**：确认 `siteId=307907` 是否存在
2. **查看后端日志**：定位500错误的具体原因
3. **添加全局错误处理**：统一处理API错误
4. **完善数据验证**：在前端验证工点ID的有效性
5. **添加加载状态**：显示友好的加载和错误提示
6. **实现降级方案**：后端不可用时切换到Mock

---

## 🎯 当前代码状态

### ✅ 已修复
- 参数格式正确（直接传递query参数）
- 添加了超时处理
- 增强了错误日志
- 返回空数据而不是抛出异常

### ⚠️ 待确认
- 后端服务是否正常运行
- 工点ID `307907` 是否存在
- 是否需要认证token

### 🚧 待完善
- 添加重试机制
- 实现全局错误处理
- 添加工点ID验证
- 完善用户提示


