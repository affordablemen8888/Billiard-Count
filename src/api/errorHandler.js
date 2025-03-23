/**
 * API错误处理器
 * 
 * 该模块提供统一的API错误处理机制，包括错误分类、提示和重试策略
 */

/**
 * API错误类型枚举
 */
export const ErrorTypes = {
  NETWORK: 'network',    // 网络连接错误
  SERVER: 'server',      // 服务器错误(5xx)
  AUTH: 'auth',          // 认证错误(401/403)
  VALIDATION: 'validation', // 验证错误(400)
  NOT_FOUND: 'notFound', // 资源不存在(404)
  UNKNOWN: 'unknown'     // 未知错误
};

/**
 * 分析API错误类型
 * @param {Error|Object} error - 错误对象或响应
 * @returns {string} 错误类型
 */
export function getErrorType(error) {
  // 网络错误
  if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || 
      error.message.includes('Network') || error.message.includes('网络')) {
    return ErrorTypes.NETWORK;
  }
  
  // HTTP状态码错误
  if (error.status) {
    if (error.status === 401 || error.status === 403) {
      return ErrorTypes.AUTH;
    } else if (error.status === 400) {
      return ErrorTypes.VALIDATION;
    } else if (error.status === 404) {
      return ErrorTypes.NOT_FOUND;
    } else if (error.status >= 500) {
      return ErrorTypes.SERVER;
    }
  }
  
  // 带有特定消息的错误
  if (error.message) {
    if (error.message.includes('未登录') || error.message.includes('登录过期')) {
      return ErrorTypes.AUTH;
    }
    if (error.message.includes('服务器错误') || error.message.includes('Server Error')) {
      return ErrorTypes.SERVER;
    }
    if (error.message.includes('不存在') || error.message.includes('未找到')) {
      return ErrorTypes.NOT_FOUND;
    }
  }
  
  return ErrorTypes.UNKNOWN;
}

/**
 * 处理API错误并显示合适的提示
 * @param {Error|Object} error - 错误对象
 * @param {Object} options - 处理选项
 * @param {boolean} options.showToast - 是否显示toast提示
 * @param {Function} options.onAuthError - 认证错误回调
 * @returns {Object} 包含错误类型和信息的对象
 */
export function handleApiError(error, options = {}) {
  const { showToast = true, onAuthError = null } = options;
  
  // 获取错误类型
  const errorType = getErrorType(error);
  
  // 获取错误信息
  let errorMessage = '';
  
  if (error.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = '未知错误';
  }
  
  // 根据错误类型自定义消息
  switch (errorType) {
    case ErrorTypes.NETWORK:
      errorMessage = '网络连接失败，请检查网络设置';
      break;
    case ErrorTypes.SERVER:
      errorMessage = '服务器暂时不可用，请稍后重试';
      break;
    case ErrorTypes.AUTH:
      errorMessage = '登录已过期，请重新登录';
      // 触发认证错误回调
      if (onAuthError) {
        setTimeout(() => onAuthError(error), 0);
      }
      break;
    case ErrorTypes.NOT_FOUND:
      errorMessage = '请求的资源不存在';
      break;
  }
  
  // 显示Toast提示
  if (showToast) {
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000
    });
  }
  
  console.error(`API错误(${errorType}):`, error);
  
  // 返回错误信息
  return {
    type: errorType,
    message: errorMessage,
    original: error
  };
}

/**
 * 处理未登录情况
 */
export function handleUnauthenticated() {
  console.log('用户未登录，重定向到登录页面');
  
  // 获取当前页面路径，用于登录后返回
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  let returnUrl = '';
  
  if (currentPage) {
    returnUrl = `/${currentPage.route}`;
    
    // 添加参数
    if (currentPage.options && Object.keys(currentPage.options).length > 0) {
      const queryString = Object.keys(currentPage.options)
        .map(key => `${key}=${currentPage.options[key]}`)
        .join('&');
      returnUrl += `?${queryString}`;
    }
  }
  
  // 跳转到登录页面，并传递返回URL
  uni.redirectTo({
    url: `/pages/login/login?returnUrl=${encodeURIComponent(returnUrl)}`
  });
} 