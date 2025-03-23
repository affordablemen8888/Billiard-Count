/**
 * API服务入口
 * 
 * 整合所有API相关服务，便于在项目中导入
 */

import apiService from './apiService';
import userService from './userService';
import { handleApiError, ErrorTypes, handleUnauthenticated } from './errorHandler';
import { checkCurrentPage, setupRouteGuard } from './routeGuard';
import { initNetworkMonitor, isNetworkConnected, triggerReconnect } from './networkMonitor';

export {
  apiService,
  userService,
  handleApiError,
  ErrorTypes,
  handleUnauthenticated,
  checkCurrentPage,
  setupRouteGuard,
  initNetworkMonitor,
  isNetworkConnected,
  triggerReconnect
};

// 默认导出userService，因为它是最常用的
export default userService; 