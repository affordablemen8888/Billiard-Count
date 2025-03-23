# 台球比赛系统 - 数据库迁移指南

本指南将帮助你将台球比赛系统的数据从客户端IndexedDB迁移到服务器端数据库系统（如MySQL、MongoDB等）。

## 目录

1. [迁移概述](#1-迁移概述)
2. [数据导出](#2-数据导出)
3. [数据库设计](#3-数据库设计)
   - [MySQL 结构设计](#31-mysql-结构设计)
   - [MongoDB 结构设计](#32-mongodb-结构设计)
4. [后端API实现](#4-后端api实现)
   - [Node.js + Express + MySQL](#41-nodejs--express--mysql)
   - [Node.js + Express + MongoDB](#42-nodejs--express--mongodb)
5. [前端代码更新](#5-前端代码更新)
6. [认证与安全](#6-认证与安全)
7. [测试与部署](#7-测试与部署)

## 1. 迁移概述

当前系统使用浏览器的IndexedDB作为存储解决方案，这适用于快速原型开发和演示，但对于实际部署的应用程序，我们通常需要将数据迁移到服务器端数据库系统中。迁移过程主要包括：

1. 导出现有IndexedDB数据
2. 设计服务器端数据库结构
3. 导入数据到新数据库
4. 开发后端API替代当前的前端数据库操作
5. 更新前端代码以使用新的API

## 2. 数据导出

使用项目提供的数据导出工具（`docs/export_data.html`）将用户数据导出为JSON格式：

1. 打开导出工具页面
2. 勾选"排除密码字段"（用于数据安全）
3. 点击"导出用户数据"按钮
4. 保存生成的JSON文件

## 3. 数据库设计

### 3.1 MySQL 结构设计

以下是MySQL数据库设计示例：

```sql
-- 创建数据库
CREATE DATABASE billiards_app;
USE billiards_app;

-- 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- 存储加密后的密码
    organization VARCHAR(100),
    matches INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_matches INT DEFAULT 0,
    loss_matches INT DEFAULT 0,
    mvp_count INT DEFAULT 0,
    score_for INT DEFAULT 0,
    score_against INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 比赛表（用于存储比赛记录）
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_mode VARCHAR(20) NOT NULL,
    left_score INT DEFAULT 0,
    right_score INT DEFAULT 0,
    organization VARCHAR(100),
    mvp_username VARCHAR(50),
    FOREIGN KEY (mvp_username) REFERENCES users(username)
);

-- 比赛参与者表
CREATE TABLE match_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    position VARCHAR(20) NOT NULL, -- 'left_attack', 'left_defense', 'right_attack', 'right_defense'
    is_winner BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (username) REFERENCES users(username)
);
```

### 3.2 MongoDB 结构设计

以下是MongoDB数据库设计示例：

```javascript
// 用户集合结构
const userSchema = {
  username: String,       // 用户名（唯一）
  password: String,       // 加密后的密码
  organization: String,   // 所属组织
  matches: Number,        // 参与的比赛届数
  wins: Number,           // 胜利局数
  losses: Number,         // 失败局数
  winMatches: Number,     // 胜利比赛数
  lossMatches: Number,    // 失败比赛数
  mvpCount: Number,       // MVP次数
  scoreFor: Number,       // 己方得分
  scoreAgainst: Number,   // 对方得分
  createdAt: Date         // 创建时间
};

// 比赛集合结构
const matchSchema = {
  matchDate: Date,        // 比赛日期
  gameMode: String,       // 比赛模式
  leftScore: Number,      // 左侧分数
  rightScore: Number,     // 右侧分数
  organization: String,   // 所属组织
  mvpUsername: String,    // MVP用户名
  players: [              // 参与者
    {
      username: String,   // 用户名
      position: String,   // 位置
      isWinner: Boolean   // 是否获胜
    }
  ]
};
```

## 4. 后端API实现

### 4.1 Node.js + Express + MySQL

以下是使用Node.js、Express和MySQL构建后端API的基本示例：

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'billiards_app',
  waitForConnections: true
});

// 密钥用于JWT token签名
const JWT_SECRET = 'your_jwt_secret';

// 用户注册API
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, organization } = req.body;
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 插入用户数据
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, organization) VALUES (?, ?, ?)',
      [username, hashedPassword, organization || null]
    );
    
    res.status(201).json({ success: true, message: '用户创建成功' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 用户登录API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    // 创建token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { 
      expiresIn: '24h' 
    });
    
    // 返回用户数据（不包含密码）
    const { password: _, ...userData } = user;
    
    res.json({ 
      success: true, 
      message: '登录成功',
      token,
      user: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 验证JWT中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: '无效的token' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: '未授权' });
  }
};

// 获取用户信息API
app.get('/api/users/:username', authenticateJWT, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, organization, matches, wins, losses, win_matches, loss_matches, mvp_count, score_for, score_against, created_at FROM users WHERE username = ?',
      [req.params.username]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户API
app.put('/api/users/:username', authenticateJWT, async (req, res) => {
  try {
    const { organization, matches, wins, losses, winMatches, lossMatches, mvpCount, scoreFor, scoreAgainst } = req.body;
    
    // 确保只有用户自己或管理员可以更新
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ success: false, message: '没有权限更新此用户' });
    }
    
    // 更新用户数据
    const [result] = await pool.execute(
      `UPDATE users SET 
        organization = ?, 
        matches = ?, 
        wins = ?, 
        losses = ?,
        win_matches = ?,
        loss_matches = ?,
        mvp_count = ?,
        score_for = ?,
        score_against = ?
       WHERE username = ?`,
      [organization, matches, wins, losses, winMatches, lossMatches, mvpCount, scoreFor, scoreAgainst, req.params.username]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 获取更新后的用户数据
    const [users] = await pool.execute(
      'SELECT id, username, organization, matches, wins, losses, win_matches, loss_matches, mvp_count, score_for, score_against, created_at FROM users WHERE username = ?',
      [req.params.username]
    );
    
    res.json({ 
      success: true, 
      message: '用户信息更新成功',
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有用户API
app.get('/api/users', authenticateJWT, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, organization, matches, wins, losses, win_matches, loss_matches, mvp_count, score_for, score_against, created_at FROM users'
    );
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

### 4.2 Node.js + Express + MongoDB

以下是使用Node.js、Express和MongoDB构建后端API的基本示例：

```javascript
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/billiards_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 密钥用于JWT token签名
const JWT_SECRET = 'your_jwt_secret';

// 定义用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organization: { type: String, default: null },
  matches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winMatches: { type: Number, default: 0 },
  lossMatches: { type: Number, default: 0 },
  mvpCount: { type: Number, default: 0 },
  scoreFor: { type: Number, default: 0 },
  scoreAgainst: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 用户注册API
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, organization } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const user = new User({
      username,
      password: hashedPassword,
      organization
    });
    
    await user.save();
    
    res.status(201).json({ success: true, message: '用户创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 用户登录API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    // 创建token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    // 返回用户数据（不包含密码）
    const userData = user.toObject();
    delete userData.password;
    
    res.json({ 
      success: true, 
      message: '登录成功',
      token,
      user: userData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 验证JWT中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: '无效的token' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: '未授权' });
  }
};

// 获取用户信息API
app.get('/api/users/:username', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户API
app.put('/api/users/:username', authenticateJWT, async (req, res) => {
  try {
    const { organization, matches, wins, losses, winMatches, lossMatches, mvpCount, scoreFor, scoreAgainst } = req.body;
    
    // 确保只有用户自己或管理员可以更新
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ success: false, message: '没有权限更新此用户' });
    }
    
    // 更新用户数据
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { organization, matches, wins, losses, winMatches, lossMatches, mvpCount, scoreFor, scoreAgainst },
      { new: true } // 返回更新后的文档
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ 
      success: true, 
      message: '用户信息更新成功',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有用户API
app.get('/api/users', authenticateJWT, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
```

## 5. 前端代码更新

为了适应新的后端API，需要修改前端代码。主要修改包括：

1. 创建API服务模块替代db.js
2. 修改用户认证逻辑
3. 更新用户数据获取和存储方式

以下是前端API服务模块的示例：

```javascript
// api.js - 替代 db.js

const API_URL = 'http://localhost:3000/api';

// 存储JWT token
function setToken(token) {
  sessionStorage.setItem('token', token);
}

// 获取JWT token
function getToken() {
  return sessionStorage.getItem('token');
}

// 清除JWT token
function clearToken() {
  sessionStorage.removeItem('token');
}

// API请求辅助函数
async function apiRequest(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // 如果有token，添加到请求头
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
    credentials: 'include'
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || '请求失败');
  }
  
  return result;
}

// 用户注册
async function registerUser(user) {
  return apiRequest('/users', 'POST', user);
}

// 用户登录
async function loginUser(username, password) {
  const result = await apiRequest('/auth/login', 'POST', { username, password });
  
  if (result.success) {
    // 保存token和用户数据
    setToken(result.token);
    sessionStorage.setItem('currentUser', JSON.stringify(result.user));
  }
  
  return result;
}

// 获取用户信息
async function getUser(username) {
  return apiRequest(`/users/${username}`);
}

// 更新用户信息
async function updateUser(user) {
  const result = await apiRequest(`/users/${user.username}`, 'PUT', user);
  
  if (result.success) {
    // 更新会话存储中的用户数据
    sessionStorage.setItem('currentUser', JSON.stringify(result.user));
  }
  
  return result;
}

// 获取所有用户
async function getAllUsers() {
  return apiRequest('/users');
}

// 用户登出
function logout() {
  clearToken();
  sessionStorage.removeItem('currentUser');
}

// 检查用户是否已登录
function isUserLoggedIn() {
  return getToken() !== null;
}

// 获取当前登录用户
function getCurrentUser() {
  const userData = sessionStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// 导出API功能
const UserAPI = {
  registerUser,
  loginUser,
  getUser,
  updateUser,
  getAllUsers,
  logout,
  isUserLoggedIn,
  getCurrentUser
};

// 在全局作用域中暴露模块
window.UserAPI = UserAPI;
```

## 6. 认证与安全

从IndexedDB迁移到服务器端数据库时，必须考虑以下安全措施：

1. **密码加密**：使用bcrypt等库对用户密码进行加密存储
2. **JWT认证**：使用JWT令牌进行用户身份验证
3. **HTTPS**：确保所有API通信使用HTTPS加密
4. **CORS**：正确配置跨域资源共享策略
5. **输入验证**：验证所有用户输入，防止SQL注入和XSS攻击
6. **速率限制**：对API请求实施速率限制，防止暴力攻击

## 7. 测试与部署

1. **数据导入测试**：
   - 导入少量测试数据
   - 验证数据完整性
   - 测试API功能

2. **前端集成测试**：
   - 测试用户注册和登录流程
   - 验证战绩统计更新功能
   - 确保比赛流程正常工作

3. **部署步骤**：
   - 设置生产环境数据库
   - 配置环境变量（API URL、数据库连接等）
   - 部署后端API服务
   - 部署前端代码
   - 设置域名和SSL证书

4. **生产环境配置**：
   - 使用PM2或Docker管理Node.js服务
   - 配置Nginx作为反向代理
   - 设置数据库备份策略
   - 实现监控和日志记录 