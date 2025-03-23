/**
 * 台球比赛系统 用户服务
 * 
 * 该服务封装了用户相关的操作和状态管理
 */

import apiService from './apiService';

// 用户数据的本地缓存键
const CURRENT_USER_KEY = 'billiards_current_user';

/**
 * 用户服务类 - 用于管理用户相关的操作和状态
 */
class UserService {
  constructor() {
    // 尝试从本地存储获取当前用户
    this.currentUser = null;
    this.isUserLoaded = false;
    
    // 从本地存储加载用户数据
    const savedUser = uni.getStorageSync(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        console.error('解析本地用户数据失败', e);
        uni.removeStorageSync(CURRENT_USER_KEY);
      }
    }
  }

  /**
   * 初始化API连接
   * @returns {Promise<boolean>} - 连接是否成功
   */
  async initializeConnection() {
    try {
      // 使用apiService的连接测试方法
      const isConnected = await apiService.testConnection();
      
      if (isConnected) {
        console.log('API连接初始化成功');
        // 尝试刷新当前用户信息
        if (this.currentUser) {
          await this.refreshCurrentUser();
        }
        return true;
      }
      
      console.warn('无法连接到API服务器，将使用本地缓存');
      return false;
    } catch (error) {
      console.error('API连接初始化失败:', error);
      return false;
    }
  }

  /**
   * 刷新当前用户信息
   */
  async refreshCurrentUser() {
    try {
      await this.getCurrentUser(true);
    } catch (err) {
      console.warn('刷新用户信息失败，将使用本地缓存', err);
    }
  }

  /**
   * 保存当前用户到本地存储
   * @param {Object} userData - 用户数据
   * @private
   */
  _saveCurrentUser(userData) {
    this.currentUser = userData;
    uni.setStorageSync(CURRENT_USER_KEY, JSON.stringify(userData));
  }

  /**
   * 清除本地存储的用户信息
   * @private
   */
  _clearCurrentUser() {
    this.currentUser = null;
    uni.removeStorageSync(CURRENT_USER_KEY);
  }

  /**
   * 获取当前用户信息
   * @param {boolean} forceRefresh - 是否强制从服务器刷新
   * @returns {Promise<Object>} - 当前用户信息
   */
  async getCurrentUser(forceRefresh = false) {
    // 如果已加载且不需要强制刷新，直接返回缓存的用户
    if (this.currentUser && !forceRefresh) {
      return this.currentUser;
    }
    
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.user) {
        this._saveCurrentUser(response.user);
        this.isUserLoaded = true;
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return this.currentUser; // 如果网络请求失败，返回本地缓存
    }
  }

  /**
   * 用户注册
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} organization - 组织(可选)
   * @returns {Promise<Object>} - 注册结果
   */
  async register(username, password, organization = '') {
    try {
      const userData = { username, password };
      if (organization) {
        userData.organization = organization;
      }
      
      const response = await apiService.registerUser(userData);
      return response;
    } catch (error) {
      console.error('用户注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} - 登录结果
   */
  async login(username, password) {
    try {
      const response = await apiService.login(username, password);
      
      if (response.success && response.user) {
        this._saveCurrentUser(response.user);
        this.isUserLoaded = true;
      }
      
      return response;
    } catch (error) {
      console.error('用户登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   * @returns {Promise<Object>} - 登出结果
   */
  async logout() {
    try {
      const response = await apiService.logout();
      this._clearCurrentUser();
      this.isUserLoaded = false;
      return response;
    } catch (error) {
      console.error('用户登出失败:', error);
      // 即使API调用失败，也要清除本地用户信息
      this._clearCurrentUser();
      throw error;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns {Promise<boolean>} - 是否已登录
   */
  async isLoggedIn() {
    try {
      // 首先检查本地存储
      if (this.currentUser) {
        // 验证会话是否有效
        const status = await apiService.checkLoginStatus();
        return status;
      }
      return false;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 更新用户统计信息
   * @param {string} username - 用户名
   * @param {Object} statsData - 统计数据更新
   * @returns {Promise<Object>} - 更新结果
   */
  async updateUserStats(username, statsData) {
    try {
      const response = await apiService.updateUser(username, statsData);
      
      // 如果更新的是当前用户，同时更新本地缓存
      if (this.currentUser && this.currentUser.username === username && response.success && response.user) {
        this._saveCurrentUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('更新用户统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户组织
   * @param {string} username - 用户名
   * @param {string} organization - 新组织名称
   * @returns {Promise<Object>} - 更新结果
   */
  async updateOrganization(username, organization) {
    try {
      const response = await apiService.updateUserOrganization(username, organization);
      
      // 如果更新的是当前用户，更新本地缓存中的组织信息
      if (this.currentUser && this.currentUser.username === username && response.success) {
        this.currentUser.organization = organization;
        this._saveCurrentUser(this.currentUser);
      }
      
      return response;
    } catch (error) {
      console.error('更新用户组织失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有用户
   * @returns {Promise<Array>} - 用户列表
   */
  async getAllUsers() {
    try {
      const response = await apiService.getAllUsers();
      return response.success ? (response.users || []) : [];
    } catch (error) {
      console.error('获取所有用户失败:', error);
      return [];
    }
  }

  /**
   * 获取指定用户信息
   * @param {string} username - 用户名
   * @returns {Promise<Object>} - 用户信息
   */
  async getUserInfo(username) {
    try {
      const response = await apiService.getUserInfo(username);
      return response.success ? response.user : null;
    } catch (error) {
      console.error(`获取用户${username}信息失败:`, error);
      return null;
    }
  }

  /**
   * 删除用户
   * @param {string} username - 用户名
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteUser(username) {
    try {
      const response = await apiService.deleteUser(username);
      
      // 如果删除的是当前用户，清除本地缓存
      if (this.currentUser && this.currentUser.username === username && response.success) {
        this._clearCurrentUser();
      }
      
      return response;
    } catch (error) {
      console.error(`删除用户${username}失败:`, error);
      throw error;
    }
  }
}

// 创建单例实例
const userService = new UserService();
export default userService; 