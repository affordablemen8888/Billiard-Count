/**
 * 台球比赛系统 - 数据导入脚本
 * 
 * 此脚本用于将导出的JSON数据导入到MySQL或MongoDB数据库
 * 
 * 使用方法:
 * 1. 安装依赖: npm install mysql2 mongoose bcrypt dotenv
 * 2. 创建.env文件配置数据库连接
 * 3. 运行: node import_script.js <json文件路径> <数据库类型mysql|mongodb>
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

// 检查命令行参数
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使用方法: node import_script.js <json文件路径> <数据库类型mysql|mongodb>');
  process.exit(1);
}

const jsonFilePath = args[0];
const dbType = args[1].toLowerCase();

if (!['mysql', 'mongodb'].includes(dbType)) {
  console.error('数据库类型必须是 mysql 或 mongodb');
  process.exit(1);
}

// 读取JSON文件
let userData;
try {
  const fileContent = fs.readFileSync(path.resolve(jsonFilePath), 'utf8');
  userData = JSON.parse(fileContent);
  console.log(`成功读取 ${userData.length} 条用户记录`);
} catch (error) {
  console.error('读取JSON文件失败:', error.message);
  process.exit(1);
}

// 加密所有用户密码
async function hashPasswords(users) {
  const saltRounds = 10;
  const usersWithHashedPasswords = [];
  
  for (const user of users) {
    // 如果JSON导出时排除了密码字段，设置一个默认密码
    const password = user.password || 'password123';
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    usersWithHashedPasswords.push({
      ...user,
      password: hashedPassword
    });
  }
  
  return usersWithHashedPasswords;
}

// 导入到MySQL数据库
async function importToMySQL(users) {
  const mysql = require('mysql2/promise');
  
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'billiards_app'
  });
  
  console.log('成功连接到MySQL数据库');
  
  try {
    // 检查数据库结构
    try {
      // 检查users表是否存在
      const [tables] = await connection.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
        [process.env.MYSQL_DATABASE || 'billiards_app']
      );
      
      if (tables.length === 0) {
        // 如果表不存在，创建表
        console.log('users表不存在，正在创建...');
        await connection.execute(`
          CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
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
          )
        `);
        console.log('users表创建成功');
      }
    } catch (error) {
      console.error('检查/创建表结构失败:', error.message);
      return;
    }
    
    // 开始导入数据
    console.log('开始导入用户数据...');
    let successCount = 0;
    let errorCount = 0;
    
    // 使用事务导入数据
    await connection.beginTransaction();
    
    try {
      for (const user of users) {
        try {
          // 转换字段名称（从驼峰到下划线命名）
          const created_at = user.createdAt ? new Date(user.createdAt) : new Date();
          
          // 导入用户数据
          await connection.execute(
            `INSERT INTO users (
              username, password, organization, matches, wins, losses,
              win_matches, loss_matches, mvp_count, score_for, score_against, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.username,
              user.password,
              user.organization || null,
              user.matches || 0,
              user.wins || 0,
              user.losses || 0,
              user.winMatches || 0,
              user.lossMatches || 0,
              user.mvpCount || 0,
              user.scoreFor || 0,
              user.scoreAgainst || 0,
              created_at
            ]
          );
          
          successCount++;
          process.stdout.write(`\r导入进度: ${successCount}/${users.length}`);
        } catch (error) {
          errorCount++;
          console.error(`\n导入用户 ${user.username} 失败:`, error.message);
        }
      }
      
      // 提交事务
      await connection.commit();
      console.log(`\n数据导入完成: ${successCount} 成功, ${errorCount} 失败`);
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      console.error('导入过程中发生错误，已回滚事务:', error.message);
    }
  } finally {
    // 关闭数据库连接
    await connection.end();
    console.log('数据库连接已关闭');
  }
}

// 导入到MongoDB数据库
async function importToMongoDB(users) {
  const mongoose = require('mongoose');
  
  // 连接MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billiards_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log('成功连接到MongoDB数据库');
  
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
  
  try {
    // 开始导入数据
    console.log('开始导入用户数据...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username: user.username });
        
        if (existingUser) {
          console.log(`用户 ${user.username} 已存在，跳过`);
          continue;
        }
        
        // 创建新用户
        const newUser = new User({
          username: user.username,
          password: user.password,
          organization: user.organization,
          matches: user.matches || 0,
          wins: user.wins || 0,
          losses: user.losses || 0,
          winMatches: user.winMatches || 0,
          lossMatches: user.lossMatches || 0,
          mvpCount: user.mvpCount || 0,
          scoreFor: user.scoreFor || 0,
          scoreAgainst: user.scoreAgainst || 0,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
        });
        
        await newUser.save();
        
        successCount++;
        process.stdout.write(`\r导入进度: ${successCount}/${users.length}`);
      } catch (error) {
        errorCount++;
        console.error(`\n导入用户 ${user.username} 失败:`, error.message);
      }
    }
    
    console.log(`\n数据导入完成: ${successCount} 成功, ${errorCount} 失败`);
  } finally {
    // 关闭MongoDB连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

// 主函数
async function main() {
  try {
    // 处理用户密码
    const usersWithHashedPasswords = await hashPasswords(userData);
    
    // 根据数据库类型选择导入函数
    if (dbType === 'mysql') {
      await importToMySQL(usersWithHashedPasswords);
    } else {
      await importToMongoDB(usersWithHashedPasswords);
    }
  } catch (error) {
    console.error('导入过程中发生错误:', error.message);
  }
}

// 执行导入
main(); 