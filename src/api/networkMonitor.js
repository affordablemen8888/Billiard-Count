/**
 * 网络状态监听器
 * 
 * 该模块负责监听网络状态变化，并在网络恢复时尝试重新连接API
 */

import apiService from './apiService';
import userService from './userService';

// 网络状态
let isNetworkAvailable = true;
// 最后一次网络变化时间
let lastNetworkChangeTime = 0;
// 是否已经初始化监听器
let isInitialized = false;

/**
 * 初始化网络监听器
 */
export function initNetworkMonitor() {
  if (isInitialized) return;
  
  try {
    console.log('初始化网络状态监听器');
    
    // 获取当前网络状态
    uni.getNetworkType({
      success: res => {
        const networkType = res.networkType;
        isNetworkAvailable = networkType !== 'none';
        console.log(`当前网络状态: ${networkType}, 网络可用: ${isNetworkAvailable}`);
      }
    });
    
    // 监听网络状态变化
    uni.onNetworkStatusChange(res => {
      const now = Date.now();
      const previousState = isNetworkAvailable;
      isNetworkAvailable = res.isConnected;
      
      console.log(`网络状态变化: ${res.networkType}, 网络可用: ${isNetworkAvailable}`);
      
      // 更新最后一次网络变化时间
      lastNetworkChangeTime = now;
      
      // 如果网络从断开状态变为可用状态，尝试重新连接API
      if (!previousState && isNetworkAvailable) {
        console.log('网络恢复，尝试重新连接API');
        setTimeout(() => reconnectApi(), 1000); // 延迟1秒后尝试连接，确保网络稳定
      }
    });
    
    isInitialized = true;
  } catch (error) {
    console.error('初始化网络监听器失败:', error);
  }
}

/**
 * 尝试重新连接API
 */
async function reconnectApi() {
  // 如果网络不可用或者5秒内已经尝试过，不重复尝试
  const now = Date.now();
  if (!isNetworkAvailable || (now - lastNetworkChangeTime < 5000)) {
    return;
  }
  
  try {
    console.log('尝试重新连接API服务器...');
    
    // 测试API连接
    const isConnected = await apiService.testConnection();
    
    if (isConnected) {
      console.log('API重新连接成功');
      
      // 尝试刷新当前用户数据
      try {
        await userService.getCurrentUser(true);
      } catch (error) {
        console.warn('刷新用户数据失败:', error);
      }
      
      // 显示连接成功提示
      uni.showToast({
        title: '网络已恢复',
        icon: 'success',
        duration: 2000
      });
    } else {
      console.warn('API重新连接失败');
    }
  } catch (error) {
    console.error('API重新连接过程中发生错误:', error);
  }
}

/**
 * 获取当前网络状态
 * @returns {boolean} - 网络是否可用
 */
export function isNetworkConnected() {
  return isNetworkAvailable;
}

/**
 * 手动触发API重连
 * @returns {Promise<boolean>} - 重连是否成功
 */
export async function triggerReconnect() {
  if (!isNetworkAvailable) {
    console.warn('网络不可用，无法重连');
    return false;
  }
  
  try {
    return await apiService.testConnection();
  } catch (error) {
    console.error('手动触发重连失败:', error);
    return false;
  }
} 