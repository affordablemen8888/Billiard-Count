/**
 * 台球比赛系统 - 后端API示例
 * 
 * 此文件提供了一个基于Express的后端API示例，
 * 实现了用户认证、用户信息获取和更新等功能。
 * 
 * 可以作为数据库迁移后的后端实现参考。
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接 - 根据选择的数据库类型取消相应注释
// MySQL 连接
/*
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'billiards_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
*/

// MongoDB 连接
/*
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billiards_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
*/

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效或过期的令牌' });
    }
    req.user = user;
    next();
  });
};

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: '服务器运行正常' });
});

// 用户注册
app.post('/api/users/register', 
  [
    body('username').isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
    body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
    body('organization').optional()
  ],
  async (req, res) => {
    // 验证请求
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, organization } = req.body;

    try {
      // 检查用户是否已存在
      // 对于MySQL:
      /*
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length > 0) {
        return res.status(409).json({ message: '用户名已存在' });
      }
      */

      // 对于MongoDB:
      /*
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: '用户名已存在' });
      }
      */

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建新用户
      // 对于MySQL:
      /*
      await pool.execute(
        `INSERT INTO users (username, password, organization) VALUES (?, ?, ?)`,
        [username, hashedPassword, organization || null]
      );
      */

      // 对于MongoDB:
      /*
      const newUser = new User({
        username,
        password: hashedPassword,
        organization,
      });
      await newUser.save();
      */

      res.status(201).json({ message: '用户注册成功' });
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
);

// 用户登录
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 获取用户
    let user;

    // 对于MySQL:
    /*
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    user = rows[0];
    */

    // 对于MongoDB:
    /*
    user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }
    */

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }

    // 创建JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 过滤掉密码后返回用户数据
    const userData = {
      username: user.username,
      organization: user.organization,
      matches: user.matches || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      winMatches: user.winMatches || user.win_matches || 0,
      lossMatches: user.lossMatches || user.loss_matches || 0,
      mvpCount: user.mvpCount || user.mvp_count || 0,
      scoreFor: user.scoreFor || user.score_for || 0,
      scoreAgainst: user.scoreAgainst || user.score_against || 0
    };

    res.status(200).json({ message: '登录成功', token, user: userData });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取当前用户信息 - 需要认证
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // 获取用户信息
    let user;

    // 对于MySQL:
    /*
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [req.user.username]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    user = rows[0];
    */

    // 对于MongoDB:
    /*
    user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    */

    // 过滤掉密码后返回用户数据
    const userData = {
      username: user.username,
      organization: user.organization,
      matches: user.matches || 0,
      wins: user.wins || 0,
      losses: user.losses || 0,
      winMatches: user.winMatches || user.win_matches || 0,
      lossMatches: user.lossMatches || user.loss_matches || 0,
      mvpCount: user.mvpCount || user.mvp_count || 0,
      scoreFor: user.scoreFor || user.score_for || 0,
      scoreAgainst: user.scoreAgainst || user.score_against || 0,
      createdAt: user.createdAt || user.created_at
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新用户信息 - 需要认证
app.put('/api/users/me', authenticateToken, async (req, res) => {
  const { organization } = req.body;

  try {
    // 更新用户信息
    // 对于MySQL:
    /*
    await pool.execute(
      'UPDATE users SET organization = ? WHERE username = ?',
      [organization, req.user.username]
    );
    */

    // 对于MongoDB:
    /*
    await User.updateOne(
      { username: req.user.username },
      { $set: { organization } }
    );
    */

    res.status(200).json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新用户比赛统计 - 需要认证
app.put('/api/users/stats', authenticateToken, async (req, res) => {
  const { matches, wins, losses, winMatches, lossMatches, mvpCount, scoreFor, scoreAgainst } = req.body;

  try {
    // 对于MySQL:
    /*
    await pool.execute(
      `UPDATE users SET 
        matches = ?, wins = ?, losses = ?, 
        win_matches = ?, loss_matches = ?, mvp_count = ?,
        score_for = ?, score_against = ?
      WHERE username = ?`,
      [
        matches, wins, losses, 
        winMatches, lossMatches, mvpCount,
        scoreFor, scoreAgainst, 
        req.user.username
      ]
    );
    */

    // 对于MongoDB:
    /*
    await User.updateOne(
      { username: req.user.username },
      { 
        $set: { 
          matches, wins, losses, 
          winMatches, lossMatches, mvpCount,
          scoreFor, scoreAgainst
        } 
      }
    );
    */

    res.status(200).json({ message: '用户统计信息更新成功' });
  } catch (error) {
    console.error('更新用户统计信息失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取所有用户信息 - 需要认证
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // 获取所有用户
    let users;

    // 对于MySQL:
    /*
    const [rows] = await pool.execute(
      `SELECT username, organization, matches, wins, losses, 
        win_matches AS winMatches, loss_matches AS lossMatches, 
        mvp_count AS mvpCount, score_for AS scoreFor, 
        score_against AS scoreAgainst, created_at AS createdAt
      FROM users`
    );
    users = rows;
    */

    // 对于MongoDB:
    /*
    users = await User.find({}, {
      password: 0,
      __v: 0
    });
    */

    res.status(200).json(users);
  } catch (error) {
    console.error('获取所有用户失败:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

/**
 * 在生产环境中使用此API前，请务必添加以下功能：
 * 1. 更完善的错误处理
 * 2. 请求速率限制以防止暴力攻击
 * 3. 日志记录
 * 4. HTTPS支持
 * 5. 环境变量验证
 * 6. 更严格的输入验证
 */ 