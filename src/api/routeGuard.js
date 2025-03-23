/**
 * 路由拦截器
 * 
 * 用于保护需要认证的页面，确保未登录用户会被重定向到登录页面
 */

import userService from './userService';

// 需要登录才能访问的页面路径
const protectedPages = [
  'pages/dashboard/dashboard',
  'pages/match/match',
  'pages/user/profile'
];

// 不需要登录检查的页面路径
const publicPages = [
  'pages/login/login',
  'pages/register/register'
];

/**
 * 注册全局页面导航拦截器
 */
export function setupRouteGuard() {
  // 监听页面跳转
  uni.addInterceptor('navigateTo', {
    // 页面跳转前进行拦截
    invoke(e) {
      return checkLoginStatus(e.url);
    }
  });

  // 监听页面重定向
  uni.addInterceptor('redirectTo', {
    invoke(e) {
      return checkLoginStatus(e.url);
    }
  });

  // 监听页面切换
  uni.addInterceptor('switchTab', {
    invoke(e) {
      return checkLoginStatus(e.url);
    }
  });

  // 监听页面重启动
  uni.addInterceptor('reLaunch', {
    invoke(e) {
      return checkLoginStatus(e.url);
    }
  });
}

/**
 * 检查登录状态并决定是否允许导航
 * @param {string} url - 目标页面URL
 * @returns {boolean} - 是否允许导航
 */
async function checkLoginStatus(url) {
  // 从URL中提取页面路径
  const targetPage = extractPagePath(url);

  // 如果是公开页面，直接允许访问
  if (publicPages.some(page => targetPage.includes(page))) {
    return true;
  }

  // 如果是受保护页面，检查登录状态
  if (protectedPages.some(page => targetPage.includes(page))) {
    const isLoggedIn = await userService.isLoggedIn();
    
    if (!isLoggedIn) {
      // 未登录，重定向到登录页
      uni.redirectTo({
        url: '/pages/login/login'
      });
      return false;
    }
  }

  // 默认允许导航
  return true;
}

/**
 * 从URL中提取页面路径
 * @param {string} url - 完整URL
 * @returns {string} - 页面路径
 */
function extractPagePath(url) {
  // 去除查询参数
  return url.split('?')[0];
}

/**
 * 自动检查当前页面是否需要登录保护
 */
export async function checkCurrentPage() {
  // 获取当前页面路径
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (!currentPage) return;
  
  const currentPath = currentPage.route;
  
  // 如果当前页面是受保护的，且用户未登录，重定向到登录页
  if (protectedPages.some(page => currentPath.includes(page))) {
    const isLoggedIn = await userService.isLoggedIn();
    
    if (!isLoggedIn) {
      uni.redirectTo({
        url: '/pages/login/login'
      });
    }
  }
} 