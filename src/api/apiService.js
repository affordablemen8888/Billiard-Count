/**
 * 台球比赛系统 API 服务
 * 
 * 该服务封装了与后端API的所有通信逻辑，处理了会话管理和错误处理
 */

import { handleApiError, ErrorTypes, handleUnauthenticated } from './errorHandler';

// API基础URL选项列表 (已确认可用)
const API_BASE_URLS = [
  'https://itxwukjnupfo.sealoshzh.site',  // 不带/api，将在请求中添加
  'https://itxwukjnupfo.sealoshzh.site:4000',
  'http://itxwukjnupfo.sealoshzh.site:4000'
];

// 存储当前使用的基础URL索引
let currentUrlIndex = 0;

/**
 * API服务类 - 用于处理与后端的所有通信
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URLS[currentUrlIndex];
    this.maxRetries = 1; // 最大重试次数
    this.requestQueue = []; // 请求队列，用于在连接恢复后重试
    this.isConnecting = false; // 是否正在连接
    this.isConnected = false; // 是否已连接
    this.lastTestedTime = 0; // 上次连接测试时间
  }

  /**
   * 获取下一个可用的基础URL
   * @returns {string|null} - 下一个基础URL，如果没有更多选项则返回null
   */
  getNextBaseUrl() {
    currentUrlIndex = (currentUrlIndex + 1) % API_BASE_URLS.length;
    return API_BASE_URLS[currentUrlIndex];
  }

  /**
   * 更新当前使用的基础URL
   * @param {number} index - URL索引
   */
  setBaseUrlByIndex(index) {
    if (index >= 0 && index < API_BASE_URLS.length) {
      currentUrlIndex = index;
      this.baseUrl = API_BASE_URLS[currentUrlIndex];
      console.log(`已切换到API基础URL: ${this.baseUrl}`);
    }
  }

  /**
   * 创建一个API请求
   * @param {string} endpoint - API端点
   * @param {string} method - HTTP方法(GET, POST, PUT, DELETE等)
   * @param {Object} data - 请求数据(对于POST, PUT请求)
   * @param {number} retryCount - 当前重试次数
   * @returns {Promise} 返回请求的Promise
   */
  async request(endpoint, method = 'GET', data = null, retryCount = 0) {
    // 如果没有确认连接过，先尝试验证连接
    if (!this.isConnected && !this.isConnecting) {
      await this.testConnection();
    }

    // 确保endpoint以/api开头
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseUrl}${apiEndpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // 重要: 包含凭证以支持会话
    };

    // 添加请求体数据(对于POST, PUT等请求)
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`发起API请求: ${method} ${url}`);
      const response = await fetch(url, options);
      
      // 处理HTTP错误状态码
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || '请求失败');
        error.status = response.status;
        error.data = errorData;
        
        // 处理401未授权错误 (未登录/会话过期)
        if (response.status === 401) {
          handleUnauthenticated();
        }
        
        throw error;
      }
      
      const result = await response.json();
      
      // 标记连接成功
      this.isConnected = true;
      this.lastTestedTime = Date.now();
      
      return result;
    } catch (error) {
      console.error(`API请求错误 [${method} ${url}]:`, error);
      
      // 处理网络错误
      const errorType = handleApiError(error, {
        showToast: retryCount === this.maxRetries, // 只在最后一次重试失败时显示提示
        onAuthError: handleUnauthenticated
      }).type;
      
      // 如果是网络错误且还有重试机会，尝试切换基础URL重试
      if (errorType === ErrorTypes.NETWORK && retryCount < this.maxRetries) {
        const nextBaseUrl = this.getNextBaseUrl();
        if (nextBaseUrl) {
          console.warn(`尝试使用备选URL重试: ${nextBaseUrl}`);
          this.baseUrl = nextBaseUrl;
          return this.request(endpoint, method, data, retryCount + 1);
        }
      }
      
      throw error;
    }
  }

  /**
   * 使用简单的fetch请求来测试URL是否可访问
   * @param {string} url - 要测试的URL
   * @returns {Promise<boolean>} - URL是否可访问
   */
  async pingUrl(url) {
    try {
      // 添加特定的端点用于检测状态
      const testUrl = `${url}/api/auth/status`;
      console.log(`测试API端点: ${testUrl}`);
      
      // 设置超时时间为3秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        // 添加随机参数避免缓存
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      // 只要能获取到响应就认为URL可用
      const data = await response.json();
      console.log(`API状态检查成功: ${JSON.stringify(data)}`);
      return true;
    } catch (error) {
      console.warn(`API端点不可用(${url}): ${error.message}`);
      return false;
    }
  }

  /**
   * 测试所有可能的API URL并找到可用的
   * @returns {Promise<number>} - 可用的URL索引，如果都不可用返回-1
   */
  async findAvailableApiUrl() {
    for (let i = 0; i < API_BASE_URLS.length; i++) {
      const url = API_BASE_URLS[i];
      const isAvailable = await this.pingUrl(url);
      
      if (isAvailable) {
        console.log(`找到可用的API URL: ${url}`);
        return i;
      }
    }
    
    console.error("无法连接到任何API端点");
    return -1;
  }

  /**
   * 测试API连接性
   * @returns {Promise<boolean>} - 测试是否成功
   */
  async testConnection() {
    console.log('开始API连接测试...');
    
    // 如果60秒内测试过且成功，不重复测试
    const now = Date.now();
    if (this.isConnected && (now - this.lastTestedTime < 60000)) {
      console.log('使用最近的连接测试结果 (已连接)');
      return true;
    }
    
    // 防止并发测试
    if (this.isConnecting) {
      console.log('已有连接测试正在进行中，等待结果...');
      return new Promise(resolve => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (this.isConnected || attempts > 50) {
            clearInterval(interval);
            console.log(`等待连接测试结果: ${this.isConnected ? '成功' : '失败'}`);
            resolve(this.isConnected);
          }
        }, 100);
      });
    }
    
    this.isConnecting = true;
    console.log('开始尝试连接到API...');
    
    try {
      // 直接测试当前URL
      console.log(`测试当前URL: ${this.baseUrl}`);
      if (await this.pingUrl(this.baseUrl)) {
        console.log(`当前API URL连接成功: ${this.baseUrl}`);
        this.isConnected = true;
        this.lastTestedTime = now;
        return true;
      }
      
      // 尝试所有备选URL
      console.log('当前URL不可用，尝试其他备选URL...');
      for (let i = 0; i < API_BASE_URLS.length; i++) {
        if (i === currentUrlIndex) continue; // 跳过当前已测试的URL
        
        const url = API_BASE_URLS[i];
        console.log(`尝试备选URL ${i}: ${url}`);
        if (await this.pingUrl(url)) {
          console.log(`备选URL ${i} 连接成功`);
          this.setBaseUrlByIndex(i);
          this.isConnected = true;
          this.lastTestedTime = now;
          return true;
        }
      }
      
      console.error('所有API连接尝试均失败');
      this.isConnected = false;
      return false;
    } catch (error) {
      console.error('API连接测试失败:', error);
      this.isConnected = false;
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  // ======================== 用户管理接口 ========================

  /**
   * 用户注册
   * @param {Object} userData - 用户数据 {username, password, organization}
   * @returns {Promise} - 注册结果
   */
  async registerUser(userData) {
    return this.request('/users', 'POST', userData);
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise} - 登录结果，包含用户信息
   */
  async login(username, password) {
    return this.request('/auth/login', 'POST', { username, password });
  }

  /**
   * 用户登出
   * @returns {Promise} - 登出结果
   */
  async logout() {
    return this.request('/auth/logout', 'POST');
  }

  /**
   * 获取当前登录用户信息
   * @returns {Promise} - 包含当前用户信息的Promise
   */
  async getCurrentUser() {
    return this.request('/auth/current', 'GET');
  }

  /**
   * 检查登录状态
   * @returns {Promise<boolean>} - 是否已登录
   */
  async checkLoginStatus() {
    try {
      const result = await this.request('/auth/status', 'GET');
      return result.loggedIn;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 获取指定用户信息
   * @param {string} username - 用户名
   * @returns {Promise} - 包含用户信息的Promise
   */
  async getUserInfo(username) {
    return this.request(`/users/${username}`, 'GET');
  }

  /**
   * 更新用户信息
   * @param {string} username - 用户名
   * @param {Object} userData - 更新的用户数据
   * @returns {Promise} - 更新结果
   */
  async updateUser(username, userData) {
    return this.request(`/users/${username}`, 'PUT', userData);
  }

  /**
   * 更新用户组织
   * @param {string} username - 用户名
   * @param {string} organization - 组织名称
   * @returns {Promise} - 更新结果
   */
  async updateUserOrganization(username, organization) {
    return this.request(`/users/${username}/organization`, 'PATCH', { organization });
  }

  /**
   * 获取所有用户
   * @returns {Promise} - 包含所有用户的Promise
   */
  async getAllUsers() {
    return this.request('/users', 'GET');
  }

  /**
   * 删除用户
   * @param {string} username - 要删除的用户名
   * @returns {Promise} - 删除结果
   */
  async deleteUser(username) {
    return this.request(`/users/${username}`, 'DELETE');
  }
}

// 创建单例实例
const apiService = new ApiService();
export default apiService; 