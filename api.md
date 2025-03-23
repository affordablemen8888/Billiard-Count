# 台球比赛系统 API 接口文档

## 基本信息

- 接口基础URL: 
  - 方式1: `https://itxwukjnupfo.sealoshzh.site/api` (不带端口号)
  - 方式2: `https://itxwukjnupfo.sealoshzh.site:4000/api` (带端口号)
  - 方式3: `http://itxwukjnupfo.sealoshzh.site:4000/api` (HTTP协议)
- 请求方式: 具体见各接口说明
- 数据格式: JSON
- 字符编码: UTF-8
- 认证方式: 基于会话(Session)的认证

## 连接排错指南

如果您在连接API时遇到问题，请尝试以下方法：

1. **重要说明**：访问根路径 `https://itxwukjnupfo.sealoshzh.site/` 显示 "Cannot GET /" 是**正常现象**，因为服务器只在 `/api` 路径下提供了接口。请确保在URL末尾添加 `/api` 及相应的接口路径。

2. 正确的访问方式示例：
   - `https://itxwukjnupfo.sealoshzh.site/api/auth/status`
   - `https://itxwukjnupfo.sealoshzh.site:4000/api/auth/status`
   - `http://itxwukjnupfo.sealoshzh.site:4000/api/auth/status`

3. 如果使用不带端口号的URL无法连接，请尝试带端口号的URL（端口4000）

4. 如果HTTPS连接失败，请尝试HTTP协议

5. 确保您的网络可以访问该域名及对应端口

6. 如果仍然无法连接，请联系系统管理员检查服务器状态和网络设置

## 快速测试API

您可以使用以下命令快速测试API是否可用：

**使用浏览器测试**:
1. 打开浏览器，访问 `https://itxwukjnupfo.sealoshzh.site/api/auth/status` 或 `http://itxwukjnupfo.sealoshzh.site:4000/api/auth/status`
2. 如果API正常工作，您将看到类似 `{"loggedIn":false}` 的JSON响应

**使用命令行测试** (如果您有curl工具):
```bash
# 检查API状态
curl -v https://itxwukjnupfo.sealoshzh.site/api/auth/status

# 或者使用指定端口
curl -v https://itxwukjnupfo.sealoshzh.site:4000/api/auth/status

# 如果HTTPS不工作，尝试HTTP
curl -v http://itxwukjnupfo.sealoshzh.site:4000/api/auth/status
```

预期响应是一个HTTP 200状态码和一个包含登录状态的JSON对象。

## 全局状态码

| 状态码 | 说明 |
|-------|-----|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/未登录 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 接口列表

### 1. 用户管理

#### 1.1 用户注册

- **URL**: `/users`
- **方法**: `POST`
- **功能**: 注册新用户

**请求参数**:

```json
{
  "username": "player1",
  "password": "password123",
  "organization": "Team Alpha"  // 可选
}
```

**成功响应** (状态码: 201):

```json
{
  "success": true,
  "message": "用户创建成功"
}
```

**失败响应** (状态码: 400):

```json
{
  "success": false,
  "message": "用户名已存在"
}
```

或

```json
{
  "success": false,
  "message": "用户名和密码是必须的"
}
```

#### 1.2 用户登录

- **URL**: `/auth/login`
- **方法**: `POST`
- **功能**: 用户登录

**请求参数**:

```json
{
  "username": "player1",
  "password": "password123"
}
```

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "username": "player1",
    "organization": "Team Alpha",
    "matches": 0,
    "wins": 0,
    "losses": 0,
    "winMatches": 0,
    "lossMatches": 0,
    "mvpCount": 0,
    "scoreFor": 0,
    "scoreAgainst": 0,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**失败响应** (状态码: 401):

```json
{
  "success": false,
  "message": "用户不存在"
}
```

或

```json
{
  "success": false,
  "message": "密码错误"
}
```

#### 1.3 用户登出

- **URL**: `/auth/logout`
- **方法**: `POST`
- **功能**: 用户登出

**请求参数**: 无需参数

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 1.4 获取当前登录用户

- **URL**: `/auth/current`
- **方法**: `GET`
- **功能**: 获取当前登录用户信息

**请求参数**: 无需参数

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "user": {
    "username": "player1",
    "organization": "Team Alpha",
    "matches": 0,
    "wins": 0,
    "losses": 0,
    "winMatches": 0,
    "lossMatches": 0,
    "mvpCount": 0,
    "scoreFor": 0,
    "scoreAgainst": 0,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**失败响应** (状态码: 401):

```json
{
  "success": false,
  "message": "未登录"
}
```

#### 1.5 检查登录状态

- **URL**: `/auth/status`
- **方法**: `GET`
- **功能**: 检查用户是否已登录

**请求参数**: 无需参数

**响应** (状态码: 200):

```json
{
  "loggedIn": true
}
```

或

```json
{
  "loggedIn": false
}
```

#### 1.6 获取用户信息

- **URL**: `/users/:username`
- **方法**: `GET`
- **功能**: 获取指定用户的信息

**请求参数**: 无需请求体参数，用户名在URL中

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "user": {
    "username": "player1",
    "organization": "Team Alpha",
    "matches": 0,
    "wins": 0,
    "losses": 0,
    "winMatches": 0,
    "lossMatches": 0,
    "mvpCount": 0,
    "scoreFor": 0,
    "scoreAgainst": 0,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**失败响应** (状态码: 404):

```json
{
  "success": false,
  "message": "用户不存在"
}
```

#### 1.7 更新用户信息

- **URL**: `/users/:username`
- **方法**: `PUT`
- **功能**: 更新用户的统计数据和组织信息

**请求参数**:

```json
{
  "organization": "Team Beta",
  "matches": 5,
  "wins": 3,
  "losses": 2,
  "winMatches": 1,
  "lossMatches": 0,
  "mvpCount": 1,
  "scoreFor": 21,
  "scoreAgainst": 15
}
```

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "message": "用户数据更新成功",
  "user": {
    "username": "player1",
    "organization": "Team Beta",
    "matches": 5,
    "wins": 3,
    "losses": 2,
    "winMatches": 1,
    "lossMatches": 0,
    "mvpCount": 1,
    "scoreFor": 21,
    "scoreAgainst": 15,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**失败响应** (状态码: 400):

```json
{
  "success": false,
  "message": "用户不存在"
}
```

#### 1.8 更新用户组织

- **URL**: `/users/:username/organization`
- **方法**: `PATCH`
- **功能**: 仅更新用户的组织信息

**请求参数**:

```json
{
  "organization": "Team Gamma"
}
```

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "message": "组织信息更新成功"
}
```

**失败响应** (状态码: 400):

```json
{
  "success": false,
  "message": "组织名称是必须的"
}
```

或

```json
{
  "success": false,
  "message": "用户不存在"
}
```

#### 1.9 获取所有用户

- **URL**: `/users`
- **方法**: `GET`
- **功能**: 获取所有用户的列表

**请求参数**: 无需参数

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "users": [
    {
      "username": "player1",
      "organization": "Team Alpha",
      "matches": 0,
      "wins": 0,
      "losses": 0,
      "winMatches": 0,
      "lossMatches": 0,
      "mvpCount": 0,
      "scoreFor": 0,
      "scoreAgainst": 0,
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "username": "player2",
      "organization": "Team Beta",
      "matches": 0,
      "wins": 0,
      "losses": 0,
      "winMatches": 0,
      "lossMatches": 0,
      "mvpCount": 0,
      "scoreFor": 0,
      "scoreAgainst": 0,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 1.10 删除用户

- **URL**: `/users/:username`
- **方法**: `DELETE`
- **功能**: 删除指定用户

**请求参数**: 无需请求体参数，用户名在URL中

**成功响应** (状态码: 200):

```json
{
  "success": true,
  "message": "用户删除成功"
}
```

**失败响应** (状态码: 400):

```json
{
  "success": false,
  "message": "用户不存在"
}
```

## 错误处理

所有接口在发生服务器内部错误时都会返回状态码 500 和以下格式的响应:

```json
{
  "success": false,
  "message": "服务器错误"
}
```

## 接口调用示例

### 用户注册示例 (JavaScript)

```javascript
// 使用fetch API
fetch('https://itxwukjnupfo.sealoshzh.site:4000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'player1',
    password: 'password123',
    organization: 'Team Alpha'
  }),
  credentials: 'include' // 重要: 包含凭证以支持会话
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 备选URL的用户注册示例 (JavaScript)

如果上面的URL无法访问，请尝试以下选项：

```javascript
// HTTP协议版本
fetch('http://itxwukjnupfo.sealoshzh.site:4000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'player1',
    password: 'password123',
    organization: 'Team Alpha'
  }),
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 用户登录示例 (JavaScript)

```javascript
fetch('https://itxwukjnupfo.sealoshzh.site:4000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'player1',
    password: 'password123'
  }),
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 获取用户信息示例 (JavaScript)

```javascript
fetch('https://itxwukjnupfo.sealoshzh.site:4000/api/users/player1', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 数据模型

### 用户模型

| 字段 | 类型 | 描述 |
|-----|-----|-----|
| username | String | 用户名 (主键) |
| password | String | 加密后的密码 (不会返回给客户端) |
| salt | String | 密码加密盐值 (不会返回给客户端) |
| organization | String | 用户所属组织 |
| matches | Number | 参与的比赛届数 |
| wins | Number | 胜利局数 |
| losses | Number | 失败局数 |
| winMatches | Number | 胜利比赛数 |
| lossMatches | Number | 失败比赛数 |
| mvpCount | Number | MVP次数 |
| scoreFor | Number | 己方得分总数 |
| scoreAgainst | Number | 对方得分总数 |
| createdAt | Date | 用户创建时间 |

## 注意事项

1. 所有接口调用需要包含 `credentials: 'include'` 以支持基于会话的认证
2. 对于需要登录的操作，请确保先调用登录接口
3. 服务器端口可能会根据环境变化，请在启动时查看控制台输出确认实际端口
4. 所有日期时间格式遵循 ISO 8601 标准
5. 如果连接API出现问题，请参考"连接排错指南"部分 