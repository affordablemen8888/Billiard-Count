# 台球比赛系统数据库迁移工具包

欢迎使用台球比赛系统数据库迁移工具包！本工具包提供了一系列工具和指南，帮助您将现有的基于IndexedDB的台球比赛系统迁移到服务器端数据库。

## 目录

1. [工具包内容](#工具包内容)
2. [迁移流程概述](#迁移流程概述)
3. [工具使用说明](#工具使用说明)
4. [常见问题](#常见问题)
5. [支持与反馈](#支持与反馈)

## 工具包内容

本工具包包含以下文件：

| 文件名 | 描述 |
|-------|------|
| `api_reference.md` | 完整的后端API接口文档，包含所有数据库接口的描述 |
| `migration_guide.md` | 数据库迁移指南，包含从IndexedDB迁移到MySQL/MongoDB的详细步骤 |
| `export_data.html` | 数据导出工具，用于将IndexedDB中的用户数据导出为JSON文件 |
| `import_script.js` | 数据导入脚本，用于将JSON数据导入到MySQL或MongoDB数据库 |
| `example.env` | 环境变量示例文件，用于配置数据库连接信息 |
| `data_migration_tools.md` | 数据迁移工具使用指南，详细说明如何使用导入导出工具 |
| `backend_api_example.js` | 后端API示例代码，展示如何实现支持前端的服务器端API |
| `frontend_integration_guide.md` | 前端集成指南，详细说明如何将前端代码与新后端API集成 |
| `README.md` | 本文档，提供工具包概述和使用说明 |

## 迁移流程概述

将您的台球比赛系统从IndexedDB迁移到服务器端数据库包含以下步骤：

1. **准备工作**
   - 了解当前系统的数据结构和API接口
   - 决定目标数据库类型（MySQL或MongoDB）
   - 设置服务器环境

2. **数据迁移**
   - 使用`export_data.html`从IndexedDB导出用户数据
   - 使用`import_script.js`将数据导入到目标数据库

3. **后端开发**
   - 参考`backend_api_example.js`实现服务器端API
   - 确保API实现与前端所需的所有功能

4. **前端集成**
   - 按照`frontend_integration_guide.md`中的说明修改前端代码
   - 将IndexedDB操作替换为API调用

5. **测试与部署**
   - 测试所有功能，确保数据正确同步
   - 部署新系统到生产环境

## 工具使用说明

### 数据导出工具

数据导出工具是一个HTML页面，用于从浏览器的IndexedDB中导出用户数据：

1. 打开`export_data.html`文件
2. 点击"导出用户数据"按钮
3. 数据将显示在页面上，点击"下载JSON文件"保存

详细说明请参考`data_migration_tools.md`文档。

### 数据导入脚本

数据导入脚本是一个Node.js程序，用于将导出的JSON数据导入到服务器数据库：

1. 安装依赖：`npm install mysql2 mongoose bcrypt dotenv`
2. 配置`.env`文件（参考`example.env`）
3. 运行：`node import_script.js <JSON文件路径> <数据库类型mysql|mongodb>`

详细说明请参考`data_migration_tools.md`文档。

### 后端API实现

后端API示例提供了一个基于Express的API服务器实现：

1. 参考`backend_api_example.js`了解API结构
2. 根据您的需求和目标数据库类型进行调整
3. 实现所有必要的API端点

详细的API接口规范请参考`api_reference.md`文档。

### 前端集成

前端集成指南提供了将现有前端代码与新API集成的详细步骤：

1. 创建API服务类处理与后端的通信
2. 替换IndexedDB操作为API调用
3. 实现基于JWT的身份验证
4. 更新各页面的数据获取和操作逻辑

详细说明请参考`frontend_integration_guide.md`文档。

## 常见问题

### 迁移中的数据一致性

**问题**：如何确保迁移过程中不丢失数据？

**解决方案**：
- 在迁移前，确保所有用户已退出系统以防止新数据写入
- 导出数据后立即进行备份
- 导入后验证用户数量和关键数据字段
- 考虑先在测试环境中进行迁移尝试

### 密码处理

**问题**：迁移时如何处理用户密码？

**解决方案**：
- 导出时可以选择排除密码字段（增强安全性）
- 导入脚本会对所有用户密码进行加密
- 如果排除了密码，可以设置一个临时密码并通知用户进行重设

### 数据库选择

**问题**：应该选择MySQL还是MongoDB？

**解决方案**：
- MySQL适合关系明确、结构固定的数据
- MongoDB适合结构可能变化、需要更灵活存储的数据
- 详细比较请参考`migration_guide.md`中的数据库选择部分

## 支持与反馈

如果您在使用本工具包过程中遇到任何问题，或有改进建议，请联系系统管理员或开发团队。

---

祝您迁移顺利！

---

*本工具包由台球比赛系统开发团队提供*

*最后更新：2023年7月* 