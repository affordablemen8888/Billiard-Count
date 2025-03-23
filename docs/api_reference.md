# 台球比赛系统 - 数据库API参考文档

本文档详细列出了台球比赛系统中所有的数据库接口，包括参数、返回值和使用示例，用于帮助开发者理解系统的数据流和进行数据库迁移。

## 目录

1. [数据库初始化](#1-数据库初始化)
2. [用户管理](#2-用户管理)
   - [添加新用户](#21-添加新用户)
   - [用户认证](#22-用户认证)
   - [获取用户信息](#23-获取用户信息)
   - [更新用户信息](#24-更新用户信息)
   - [更新用户组织信息](#25-更新用户组织信息)
   - [获取所有用户](#26-获取所有用户)
   - [删除用户](#27-删除用户)
   - [检查用户登录状态](#28-检查用户登录状态)
   - [获取当前登录用户](#29-获取当前登录用户)
   - [用户登出](#210-用户登出)
3. [数据结构说明](#3-数据结构说明)
   - [用户数据结构](#31-用户数据结构)

---

## 1. 数据库初始化

### `UserDB.init()`

初始化数据库连接，这是使用任何其他数据库操作之前的必要步骤。

**返回值**：
- Promise：解析为初始化成功的数据库实例，或在出错时拒绝。

**使用示例**：
```javascript
// 初始化数据库
UserDB.init()
  .then(() => {
    console.log('数据库初始化成功');
    // 执行后续操作
  })
  .catch(error => {
    console.error('数据库初始化失败:', error);
  });
```

## 2. 用户管理

### 2.1 添加新用户

### `UserDB.addUser(user)`

添加新用户到数据库。

**参数**：
- `user`：对象，包含以下字段：
  - `username`: 字符串，用户名（必须唯一）
  - `password`: 字符串，用户密码
  - `organization`: 字符串，用户所属组织（可选）

**返回值**：
- Promise：解析为添加结果对象 `{success: boolean, message: string}`

**使用示例**：
```javascript
const newUser = {
  username: 'player1',
  password: 'password123',
  organization: 'Team Alpha'
};

UserDB.addUser(newUser)
  .then(result => {
    if (result.success) {
      console.log('用户创建成功');
    } else {
      console.log(result.message);
    }
  })
  .catch(error => {
    console.error('添加用户失败:', error);
  });
```

### 2.2 用户认证

### `UserDB.authenticateUser(username, password)`

验证用户登录凭据。

**参数**：
- `username`: 字符串，用户名
- `password`: 字符串，密码

**返回值**：
- Promise：解析为认证结果对象 `{success: boolean, message: string, user?: Object}`

**使用示例**：
```javascript
UserDB.authenticateUser('player1', 'password123')
  .then(result => {
    if (result.success) {
      console.log('登录成功:', result.user);
    } else {
      console.log('登录失败:', result.message);
    }
  })
  .catch(error => {
    console.error('认证过程出错:', error);
  });
```

### 2.3 获取用户信息

### `UserDB.getUser(username)`

获取特定用户的完整信息。

**参数**：
- `username`: 字符串，用户名

**返回值**：
- Promise：解析为用户数据对象或 `null`（用户不存在时）

**使用示例**：
```javascript
UserDB.getUser('player1')
  .then(userData => {
    if (userData) {
      console.log('获取到的用户数据:', userData);
    } else {
      console.log('用户不存在');
    }
  })
  .catch(error => {
    console.error('获取用户信息失败:', error);
  });
```

### 2.4 更新用户信息

### `UserDB.updateUser(user)`

更新用户的完整记录。

**参数**：
- `user`: 对象，包含完整的用户数据，必须包含 `username` 字段

**返回值**：
- Promise：解析为结果对象 `{success: boolean, message: string, user?: Object}`

**使用示例**：
```javascript
UserDB.getUser('player1')
  .then(userData => {
    if (userData) {
      // 更新用户数据
      userData.wins = (parseInt(userData.wins) + 1).toString();
      userData.mvpCount = (parseInt(userData.mvpCount) + 1).toString();
      
      return UserDB.updateUser(userData);
    }
  })
  .then(result => {
    if (result && result.success) {
      console.log('用户数据更新成功:', result.user);
    }
  })
  .catch(error => {
    console.error('更新用户数据失败:', error);
  });
```

### 2.5 更新用户组织信息

### `UserDB.updateUserOrganization(username, organizationName)`

专门用于更新用户的组织信息。

**参数**：
- `username`: 字符串，用户名
- `organizationName`: 字符串，组织名称

**返回值**：
- Promise：解析为结果对象 `{success: boolean, message: string}`

**使用示例**：
```javascript
UserDB.updateUserOrganization('player1', 'Team Beta')
  .then(result => {
    if (result.success) {
      console.log('组织信息更新成功');
    } else {
      console.log(result.message);
    }
  })
  .catch(error => {
    console.error('更新组织信息失败:', error);
  });
```

### 2.6 获取所有用户

### `UserDB.getAllUsers()`

获取数据库中的所有用户列表。

**返回值**：
- Promise：解析为用户对象数组

**使用示例**：
```javascript
UserDB.getAllUsers()
  .then(users => {
    console.log('系统中的所有用户:', users);
    console.log(`总用户数: ${users.length}`);
  })
  .catch(error => {
    console.error('获取用户列表失败:', error);
  });
```

### 2.7 删除用户

### `UserDB.deleteUser(username)`

从数据库中删除特定用户。

**参数**：
- `username`: 字符串，要删除的用户名

**返回值**：
- Promise：解析为结果对象 `{success: boolean, message: string}`

**使用示例**：
```javascript
UserDB.deleteUser('player1')
  .then(result => {
    if (result.success) {
      console.log('用户删除成功');
    } else {
      console.log(result.message);
    }
  })
  .catch(error => {
    console.error('删除用户失败:', error);
  });
```

### 2.8 检查用户登录状态

### `UserDB.isUserLoggedIn()`

检查当前是否有用户登录。

**返回值**：
- Boolean：`true` 表示有用户登录，`false` 表示无用户登录

**使用示例**：
```javascript
if (UserDB.isUserLoggedIn()) {
  console.log('用户已登录');
} else {
  console.log('用户未登录');
  window.location.href = 'login_prototype.html';
}
```

### 2.9 获取当前登录用户

### `UserDB.getCurrentUser()`

获取当前登录的用户信息。

**返回值**：
- Object|null：当前登录用户的信息对象，如果没有用户登录则返回 `null`

**使用示例**：
```javascript
const currentUser = UserDB.getCurrentUser();
if (currentUser) {
  console.log('当前登录用户:', currentUser.username);
  console.log('所属组织:', currentUser.organization);
} else {
  console.log('没有用户登录');
}
```

### 2.10 用户登出

### `UserDB.logout()`

登出当前用户，清除会话存储。

**使用示例**：
```javascript
UserDB.logout();
console.log('用户已登出');
window.location.href = 'login_prototype.html';
```

## 3. 数据结构说明

### 3.1 用户数据结构

数据库中的用户对象包含以下字段：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `username` | String | 用户名（主键，唯一标识） |
| `password` | String | 用户密码（实际应用中应加密存储） |
| `organization` | String | 用户所属组织 |
| `matches` | Number | 参与的比赛届数 |
| `wins` | Number | 胜利局数 |
| `losses` | Number | 失败局数 |
| `winMatches` | Number | 胜利比赛数 |
| `lossMatches` | Number | 失败比赛数 |
| `mvpCount` | Number | MVP次数 |
| `scoreFor` | Number | 己方得分总数 |
| `scoreAgainst` | Number | 对方得分总数 |
| `createdAt` | String | 用户创建时间（ISO格式的日期字符串） |

### 数据流示例

下面是一个完整的数据流示例，展示了用户从注册到参与比赛并更新统计信息的整个过程：

```javascript
// 1. 用户注册
const newUser = {
  username: 'player1',
  password: 'password123'
};

UserDB.init()
  .then(() => UserDB.addUser(newUser))
  .then(result => {
    if (result.success) {
      // 2. 用户登录
      return UserDB.authenticateUser(newUser.username, newUser.password);
    }
  })
  .then(authResult => {
    if (authResult.success) {
      // 3. 加入组织
      return UserDB.updateUserOrganization(authResult.user.username, 'Team Alpha');
    }
  })
  .then(() => {
    // 4. 获取用户最新数据
    return UserDB.getUser('player1');
  })
  .then(userData => {
    // 5. 参与比赛后更新统计数据
    if (userData) {
      userData.matches = (parseInt(userData.matches) + 1).toString();
      userData.wins = (parseInt(userData.wins) + 1).toString();
      userData.winMatches = (parseInt(userData.winMatches) + 1).toString();
      userData.scoreFor = (parseInt(userData.scoreFor) + 7).toString();
      userData.scoreAgainst = (parseInt(userData.scoreAgainst) + 5).toString();
      
      return UserDB.updateUser(userData);
    }
  })
  .then(result => {
    if (result && result.success) {
      console.log('用户比赛数据已更新');
    }
  })
  .catch(error => {
    console.error('操作失败:', error);
  });
```

## 数据库迁移注意事项

当你需要将数据库迁移到其他后端系统（如MySQL、MongoDB等）时，需要注意以下几点：

1. **保持数据结构一致**：确保新数据库中的用户模型与当前IndexedDB中的结构一致。
2. **数据类型转换**：本系统中的数字统计值以字符串形式存储，迁移时可能需要进行类型转换。
3. **密码安全**：当前系统的密码是明文存储，迁移时应实现密码加密。
4. **API兼容性**：确保新系统提供相同的API接口，或者更新前端代码以适应新API。
5. **会话管理**：当前系统使用`sessionStorage`管理用户会话，可能需要替换为更安全的会话管理方式。

## IndexedDB数据导出方法

如果你需要从当前IndexedDB中导出数据，可以使用以下代码：

```javascript
function exportDatabaseData() {
  UserDB.init()
    .then(() => UserDB.getAllUsers())
    .then(users => {
      const dataStr = JSON.stringify(users, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'billiards_users_data.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    })
    .catch(error => {
      console.error('导出数据失败:', error);
    });
}
```

这段代码会将所有用户数据导出为JSON文件，可以用于后续的数据迁移。 