# 移动端登录注册页面

这是一个美观且具有交互功能的移动端登录和注册页面原型，使用纯HTML、CSS和JavaScript构建。该原型具有现代简约的设计风格，并集成了客户端数据库功能。

## 项目特点

- **美观的UI设计**：采用蓝紫渐变色调，现代简约风格
- **完整的登录和注册功能**：支持用户创建账号和登录验证
- **客户端数据持久化**：使用IndexedDB存储用户数据
- **表单验证**：实时验证用户输入，提供友好的错误提示
- **响应式设计**：适配不同屏幕尺寸
- **良好的可访问性**：清晰的视觉层次和用户引导

## 文件结构

- `login_prototype.html` - 主要的HTML文件，包含登录和注册界面
- `db.js` - 数据库操作模块，处理用户数据的存储和验证

## 使用方法

1. 克隆或下载此仓库
2. 用浏览器打开`login_prototype.html`文件
3. 界面分为两部分：
   - 左侧：移动设备样式的登录/注册界面
   - 右侧：设计说明和文档

## 功能说明

### 登录功能
- 输入用户名和密码后点击"登录"按钮
- 系统会验证用户信息是否与数据库匹配
- 登录成功或失败都会显示相应提示

### 注册功能
- 点击"注册新账号"链接打开注册表单
- 填写用户名、密码并确认密码
- 系统会验证输入并检查用户名是否已存在
- 注册成功后可以使用新账号登录

### 数据存储
- 用户数据存储在浏览器的IndexedDB数据库中
- 数据在浏览器关闭后仍然保留
- 这是一个客户端演示，实际应用中应使用服务器端存储

## 安全注意事项

这是一个前端原型演示，在实际应用中应注意：

1. 密码应该在服务器端加密存储
2. 用户认证应该在服务器端进行
3. 应实现更完善的安全措施，如防止暴力破解、CSRF保护等

## 设计理念

原型采用了现代简约的设计风格，重点关注：

- 清晰的视觉层次
- 直观的表单标签
- 适当的输入框大小
- 良好的交互反馈
- 优雅的色彩方案

详细的设计说明可在页面右侧查看。