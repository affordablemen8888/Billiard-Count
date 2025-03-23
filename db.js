/**
 * 用户数据库管理模块
 * 
 * 这个模块提供了用户数据的持久化存储功能，使用SQLite作为底层数据库。
 * 在浏览器环境中，我们使用IndexedDB来模拟SQLite数据库。
 */

// 数据库版本
const DB_VERSION = 1;
const DB_NAME = "userAuth";

// 数据库连接实例
let db;

/**
 * 初始化数据库
 * @returns {Promise} 返回数据库初始化成功的Promise
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        // 打开数据库连接
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // 处理数据库升级事件（首次创建时也会触发）
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // 创建用户表，如果不存在
            if (!db.objectStoreNames.contains('users')) {
                const usersStore = db.createObjectStore('users', { keyPath: 'username' });
                
                // 创建索引
                usersStore.createIndex('username', 'username', { unique: true });
                
                console.log("用户数据表创建成功");
            }
        };
        
        // 数据库连接成功
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("数据库连接成功");
            resolve(db);
        };
        
        // 数据库连接失败
        request.onerror = (event) => {
            console.error("数据库连接失败:", event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 添加新用户
 * @param {Object} user 用户对象，包含username和password字段
 * @returns {Promise} 返回添加结果的Promise
 */
function addUser(user) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        // 在实际应用中，这里应该对密码进行加密
        const secureUser = {
            username: user.username,
            password: user.password, // 应该被加密
            organization: user.organization || null,
            matches: 0,             // 比赛届数
            wins: 0,                // 胜利局数
            losses: 0,              // 失利局数
            winMatches: 0,          // 胜场数
            lossMatches: 0,         // 败场数
            mvpCount: 0,            // MVP次数
            scoreFor: 0,            // 己方得分
            scoreAgainst: 0,        // 对方得分
            createdAt: new Date().toISOString()
        };
        
        const transaction = db.transaction(['users'], 'readwrite');
        const usersStore = transaction.objectStore('users');
        
        // 检查用户是否已存在
        const getRequest = usersStore.get(user.username);
        
        getRequest.onsuccess = (event) => {
            if (event.target.result) {
                reject(new Error("用户名已存在"));
                return;
            }
            
            // 添加新用户
            const addRequest = usersStore.add(secureUser);
            
            addRequest.onsuccess = () => {
                resolve({ success: true, message: "用户创建成功" });
            };
            
            addRequest.onerror = (event) => {
                reject(new Error("添加用户失败: " + event.target.error));
            };
        };
        
        getRequest.onerror = (event) => {
            reject(new Error("检查用户失败: " + event.target.error));
        };
    });
}

/**
 * 验证用户登录
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} 返回验证结果的Promise
 */
function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readonly');
        const usersStore = transaction.objectStore('users');
        const request = usersStore.get(username);
        
        request.onsuccess = (event) => {
            const user = event.target.result;
            
            if (!user) {
                resolve({ success: false, message: "用户不存在" });
                return;
            }
            
            // 在实际应用中，这里应该比较加密后的密码
            if (user.password === password) {
                // 登录成功，保存用户数据到会话存储
                const userData = {
                    username: user.username,
                    organization: user.organization,
                    matches: user.matches || 0,
                    wins: user.wins || 0,
                    losses: user.losses || 0,
                    winMatches: user.winMatches || 0,
                    lossMatches: user.lossMatches || 0,
                    mvpCount: user.mvpCount || 0,
                    scoreFor: user.scoreFor || 0,
                    scoreAgainst: user.scoreAgainst || 0,
                    createdAt: user.createdAt
                };
                
                // 保存到会话存储
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                
                resolve({ 
                    success: true, 
                    message: "登录成功", 
                    user: userData
                });
            } else {
                resolve({ success: false, message: "密码错误" });
            }
        };
        
        request.onerror = (event) => {
            reject(new Error("验证用户失败: " + event.target.error));
        };
    });
}

/**
 * 更新用户组织信息
 * @param {string} username 用户名
 * @param {string} organizationName 组织名称
 * @returns {Promise} 返回更新结果的Promise
 */
function updateUserOrganization(username, organizationName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readwrite');
        const usersStore = transaction.objectStore('users');
        
        // 获取用户
        const getRequest = usersStore.get(username);
        
        getRequest.onsuccess = (event) => {
            const user = event.target.result;
            
            if (!user) {
                resolve({ success: false, message: "用户不存在" });
                return;
            }
            
            // 更新组织信息
            user.organization = organizationName;
            
            // 保存更新后的用户数据
            const updateRequest = usersStore.put(user);
            
            updateRequest.onsuccess = () => {
                resolve({ success: true, message: "组织信息更新成功" });
            };
            
            updateRequest.onerror = (event) => {
                reject(new Error("更新用户信息失败: " + event.target.error));
            };
        };
        
        getRequest.onerror = (event) => {
            reject(new Error("获取用户信息失败: " + event.target.error));
        };
    });
}

/**
 * 获取所有用户列表
 * @returns {Promise} 返回包含所有用户的Promise
 */
function getAllUsers() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readonly');
        const usersStore = transaction.objectStore('users');
        const request = usersStore.getAll();
        
        request.onsuccess = (event) => {
            // 安全起见，不返回密码
            const users = event.target.result.map(user => ({
                username: user.username,
                organization: user.organization,
                matches: user.matches || 0,
                wins: user.wins || 0,
                losses: user.losses || 0,
                winMatches: user.winMatches || 0,
                lossMatches: user.lossMatches || 0,
                mvpCount: user.mvpCount || 0,
                scoreFor: user.scoreFor || 0,
                scoreAgainst: user.scoreAgainst || 0,
                createdAt: user.createdAt
            }));
            
            resolve(users);
        };
        
        request.onerror = (event) => {
            reject(new Error("获取用户列表失败: " + event.target.error));
        };
    });
}

/**
 * 删除用户
 * @param {string} username 要删除的用户名
 * @returns {Promise} 返回删除结果的Promise
 */
function deleteUser(username) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readwrite');
        const usersStore = transaction.objectStore('users');
        const request = usersStore.delete(username);
        
        request.onsuccess = () => {
            resolve({ success: true, message: "用户删除成功" });
        };
        
        request.onerror = (event) => {
            reject(new Error("删除用户失败: " + event.target.error));
        };
    });
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 返回用户是否已登录
 */
function isUserLoggedIn() {
    return sessionStorage.getItem('currentUser') !== null;
}

/**
 * 获取当前登录用户
 * @returns {Object|null} 返回当前登录用户信息或null
 */
function getCurrentUser() {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

/**
 * 获取特定用户的完整信息
 * @param {string} username 用户名
 * @returns {Promise} 返回包含用户信息的Promise
 */
function getUser(username) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readonly');
        const usersStore = transaction.objectStore('users');
        const request = usersStore.get(username);
        
        request.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                // 安全起见，不返回密码
                const userData = {
                    username: user.username,
                    organization: user.organization,
                    matches: user.matches || 0,
                    wins: user.wins || 0,
                    losses: user.losses || 0,
                    winMatches: user.winMatches || 0,
                    lossMatches: user.lossMatches || 0,
                    mvpCount: user.mvpCount || 0,
                    scoreFor: user.scoreFor || 0,
                    scoreAgainst: user.scoreAgainst || 0,
                    createdAt: user.createdAt
                };
                resolve(userData);
            } else {
                resolve(null); // 用户不存在
            }
        };
        
        request.onerror = (event) => {
            reject(new Error("获取用户信息失败: " + event.target.error));
        };
    });
}

/**
 * 用户登出
 */
function logout() {
    sessionStorage.removeItem('currentUser');
}

/**
 * 更新用户完整记录
 * @param {Object} user 包含所有需要更新字段的用户对象
 * @returns {Promise} 返回更新结果的Promise
 */
function updateUser(user) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error("数据库未初始化"));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readwrite');
        const usersStore = transaction.objectStore('users');
        
        // 获取用户
        const getRequest = usersStore.get(user.username);
        
        getRequest.onsuccess = (event) => {
            const existingUser = event.target.result;
            
            if (!existingUser) {
                resolve({ success: false, message: "用户不存在" });
                return;
            }
            
            // 确保不会覆盖密码
            user.password = existingUser.password;
            
            // 保存更新后的用户数据
            const updateRequest = usersStore.put(user);
            
            updateRequest.onsuccess = () => {
                // 如果更新的是当前登录用户，同时更新会话存储
                const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
                if (currentUserData.username === user.username) {
                    // 创建安全的用户对象（不包含密码）
                    const safeUser = {...user};
                    delete safeUser.password;
                    sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
                }
                
                resolve({ success: true, message: "用户信息更新成功", user: user });
            };
            
            updateRequest.onerror = (event) => {
                reject(new Error("更新用户信息失败: " + event.target.error));
            };
        };
        
        getRequest.onerror = (event) => {
            reject(new Error("获取用户信息失败: " + event.target.error));
        };
    });
}

// 导出数据库功能
const UserDB = {
    init: initDatabase,
    addUser,
    authenticateUser,
    updateUserOrganization,
    getAllUsers,
    deleteUser,
    isUserLoggedIn,
    getCurrentUser,
    getUser,
    updateUser,
    logout
};

// 在全局作用域中暴露模块
window.UserDB = UserDB; 