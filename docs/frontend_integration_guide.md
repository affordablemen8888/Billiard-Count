# 前端与新后端API集成指南

本指南将帮助您将现有的前端代码与新的服务器端API进行集成，以完成从IndexedDB到服务器端数据库的迁移。

## 目录

1. [概述](#概述)
2. [API基础配置](#api基础配置)
3. [用户认证集成](#用户认证集成)
4. [数据操作集成](#数据操作集成)
5. [特定页面集成](#特定页面集成)
6. [测试与调试](#测试与调试)

## 概述

从IndexedDB迁移到后端API需要对前端代码进行一系列修改。主要修改集中在以下几个方面：

1. 添加API通信层
2. 替换IndexedDB操作为API调用
3. 实现基于JWT的身份验证
4. 更新用户界面以适应新的数据流

## API基础配置

### 创建API服务类

首先，创建一个API服务类来处理与后端的所有通信：

```javascript
// api-service.js
class ApiService {
  constructor() {
    this.baseUrl = 'http://your-api-domain.com/api'; // 替换为您的API地址
    this.token = localStorage.getItem('token');
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // API请求通用方法
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '请求失败');
      }
      
      return result;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // 用户API方法
  async register(userData) {
    return this.request('/users/register', 'POST', userData);
  }

  async login(credentials) {
    const result = await this.request('/users/login', 'POST', credentials);
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateUser(userData) {
    return this.request('/users/me', 'PUT', userData);
  }

  async updateUserStats(statsData) {
    return this.request('/users/stats', 'PUT', statsData);
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async logout() {
    this.setToken(null);
  }
}

// 创建单例实例
const apiService = new ApiService();
```

添加此文件到项目中，并在HTML文件中引入：

```html
<script src="api-service.js"></script>
```

## 用户认证集成

### 登录页面修改

修改`login.html`中的登录逻辑：

```javascript
// 原IndexedDB登录代码
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const userData = await UserDB.authenticateUser(username, password);
    if (userData) {
      window.location.href = 'dashboard.html';
    } else {
      showError('用户名或密码不正确');
    }
  } catch (error) {
    showError('登录失败: ' + error.message);
  }
}

// 修改为API登录代码
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await apiService.login({ username, password });
    
    // 将用户数据存储到sessionStorage (可选，因为API会使用JWT验证)
    sessionStorage.setItem('currentUser', JSON.stringify(response.user));
    
    window.location.href = 'dashboard.html';
  } catch (error) {
    showError('登录失败: ' + error.message);
  }
}
```

### 注册页面修改

修改`register.html`中的注册逻辑：

```javascript
// 原IndexedDB注册代码
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const organization = document.getElementById('organization').value;
  
  // 密码验证...
  
  try {
    await UserDB.addUser({
      username,
      password,
      organization
    });
    window.location.href = 'login.html?registered=true';
  } catch (error) {
    showError('注册失败: ' + error.message);
  }
}

// 修改为API注册代码
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const organization = document.getElementById('organization').value;
  
  // 密码验证...
  
  try {
    await apiService.register({
      username,
      password,
      organization
    });
    window.location.href = 'login.html?registered=true';
  } catch (error) {
    showError('注册失败: ' + error.message);
  }
}
```

### 登出功能修改

```javascript
// 原IndexedDB登出代码
function logout() {
  UserDB.logout();
  window.location.href = 'login.html';
}

// 修改为API登出代码
async function logout() {
  await apiService.logout();
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}
```

### 身份验证检查

添加一个通用的身份验证检查函数，在每个需要认证的页面开始时调用：

```javascript
async function checkAuth() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    // 尝试获取当前用户信息以验证token有效
    const userData = await apiService.getCurrentUser();
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('身份验证失败:', error);
    apiService.logout();
    window.location.href = 'login.html';
    return false;
  }
}

// 在页面加载时调用
document.addEventListener('DOMContentLoaded', checkAuth);
```

## 数据操作集成

### 获取用户信息

替换所有获取用户信息的代码：

```javascript
// 原代码
async function getCurrentUser() {
  return UserDB.getCurrentUser();
}

// 新代码
async function getCurrentUser() {
  // 优先使用sessionStorage中的数据以减少API调用
  const cachedUser = sessionStorage.getItem('currentUser');
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }
  
  // 如果没有缓存，则从API获取
  try {
    const userData = await apiService.getCurrentUser();
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}
```

### 更新用户统计信息

替换更新用户统计的代码：

```javascript
// 原代码 - 直接操作IndexedDB
function updateUserStats(username, statsUpdate) {
  // IndexedDB 更新逻辑...
}

// 新代码 - 使用API
async function updateUserStats(username, statsUpdate) {
  try {
    await apiService.updateUserStats(statsUpdate);
    
    // 更新本地缓存
    const cachedUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const updatedUser = { ...cachedUser, ...statsUpdate };
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return true;
  } catch (error) {
    console.error('更新用户统计失败:', error);
    return false;
  }
}
```

### 获取所有用户

```javascript
// 原代码
async function getAllUsers() {
  return UserDB.getAllUsers();
}

// 新代码
async function getAllUsers() {
  try {
    return await apiService.getAllUsers();
  } catch (error) {
    console.error('获取所有用户失败:', error);
    return [];
  }
}
```

## 特定页面集成

### Dashboard页面集成

`dashboard.html`页面主要需要修改用户数据获取和统计显示：

```javascript
// 加载仪表板数据
async function loadDashboard() {
  await checkAuth(); // 确保用户已登录
  
  const userData = await getCurrentUser();
  if (!userData) return;
  
  // 设置用户信息
  document.getElementById('user-name').textContent = userData.username;
  document.getElementById('organization-name').textContent = userData.organization || '无组织';
  
  // 设置统计信息
  document.getElementById('matches').textContent = userData.matches || 0;
  document.getElementById('wins').textContent = userData.wins || 0;
  document.getElementById('losses').textContent = userData.losses || 0;
  document.getElementById('win_matches').textContent = userData.winMatches || 0;
  document.getElementById('loss_matches').textContent = userData.lossMatches || 0;
  document.getElementById('mvp_count').textContent = userData.mvpCount || 0;
  
  // 加载所有用户排名
  await loadRankings();
}

// 加载排名数据
async function loadRankings() {
  try {
    const users = await getAllUsers();
    
    // 排序用户...
    
    // 显示排名...
  } catch (error) {
    console.error('加载排名失败:', error);
  }
}
```

### Match页面集成

`match.html`页面需要修改开始比赛、更新统计和MVP确定等功能：

```javascript
// 开始比赛
async function startMatch() {
  await checkAuth(); // 确保用户已登录
  
  // 获取比赛设置...
  
  // 更新当前用户的比赛计数
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await updateUserStats(currentUser.username, {
      matches: (currentUser.matches || 0) + 1
    });
  }
  
  // 开始比赛逻辑...
}

// 结束比赛
async function endMatch(winners, losers) {
  // 更新获胜者统计
  for (const winner of winners) {
    const user = await apiService.getUser(winner.username);
    if (user) {
      await updateUserStats(winner.username, {
        wins: (user.wins || 0) + 1,
        winMatches: (user.winMatches || 0) + 1,
        scoreFor: (user.scoreFor || 0) + winner.score
      });
    }
  }
  
  // 更新失败者统计
  for (const loser of losers) {
    const user = await apiService.getUser(loser.username);
    if (user) {
      await updateUserStats(loser.username, {
        losses: (user.losses || 0) + 1,
        lossMatches: (user.lossMatches || 0) + 1,
        scoreAgainst: (user.scoreAgainst || 0) + loser.score
      });
    }
  }
  
  // 确定MVP
  determineMVP(winners, losers);
}

// 确定MVP
async function determineMVP(allPlayers) {
  // MVP 确定逻辑...
  
  if (mvpPlayer) {
    const user = await apiService.getUser(mvpPlayer.username);
    if (user) {
      await updateUserStats(mvpPlayer.username, {
        mvpCount: (user.mvpCount || 0) + 1
      });
    }
  }
}
```

## 测试与调试

在完成API集成后，应进行全面测试，特别关注以下几点：

### 认证测试
1. 用户注册 - 确保新用户可以成功注册
2. 用户登录 - 验证已注册用户可以登录
3. Token有效性 - 测试登录后获取的token是否有效
4. 登出功能 - 确保登出后token被正确清除

### 数据操作测试
1. 用户数据获取 - 验证可以获取当前用户和所有用户信息
2. 统计更新 - 测试比赛后用户统计是否正确更新
3. 错误处理 - 测试API请求失败时的错误处理

### 常见问题排查

1. **跨域问题** - 如果API和前端不在同一域，确保API启用了CORS
   ```javascript
   // 服务器端CORS配置
   app.use(cors({
     origin: 'http://your-frontend-domain.com',
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

2. **认证失败** - 检查token是否正确保存和传递
   - 使用浏览器开发工具检查localStorage中是否有token
   - 检查请求头中是否包含Authorization头部

3. **数据不一致** - 确保本地缓存与服务器数据同步
   ```javascript
   // 在关键操作后更新缓存
   function updateLocalCache(userData) {
     sessionStorage.setItem('currentUser', JSON.stringify(userData));
   }
   ```

4. **API超时** - 添加超时处理
   ```javascript
   async request(endpoint, method = 'GET', data = null) {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
     
     try {
       const response = await fetch(`${this.baseUrl}${endpoint}`, {
         method,
         headers: this.getHeaders(),
         body: data ? JSON.stringify(data) : null,
         signal: controller.signal
       });
       
       clearTimeout(timeoutId);
       // 处理响应...
     } catch (error) {
       clearTimeout(timeoutId);
       if (error.name === 'AbortError') {
         throw new Error('请求超时');
       }
       throw error;
     }
   }
   ```

## 结论

完成前端与后端API的集成后，您的应用将从本地IndexedDB存储转变为使用服务器端数据库，这将提供更好的数据一致性、可靠性和扩展性。

记住逐步进行集成，先完成基础认证功能，再实现数据操作，最后优化用户体验。使用浏览器开发工具中的网络和控制台标签页来调试API交互，确保所有数据流程正常工作。 