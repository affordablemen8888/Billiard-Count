<script>
import userService from './api/userService';
import apiService from './api/apiService';
import { checkCurrentPage } from './api/routeGuard';

export default {
  onLaunch: async function() {
    console.log('App Launch');
    // 初始化API连接
    await this.initializeApp();
  },
  
  onShow: async function() {
    console.log('App Show');
    // 每次应用显示时检查当前页面是否需要登录
    await checkCurrentPage();
    
    // 如果应用曾经连接失败，尝试重新连接
    if (!apiService.isConnected) {
      this.retryConnection();
    }
  },
  
  onHide: function() {
    console.log('App Hide');
  },
  
  methods: {
    /**
     * 初始化应用
     */
    async initializeApp() {
      try {
        // 显示初始化加载中提示
        uni.showLoading({
          title: '正在连接服务器...',
          mask: true
        });
        
        // 测试API连接并获取合适的基础URL
        const isConnected = await apiService.testConnection();
        
        // 隐藏加载提示
        uni.hideLoading();
        
        if (isConnected) {
          console.log('API连接成功，应用初始化完成');
          
          // 显示成功提示
          uni.showToast({
            title: '服务器连接成功',
            icon: 'success',
            duration: 1500
          });
          
          // 检查当前页面权限
          await checkCurrentPage();
        } else {
          console.warn('API连接失败，应用将使用本地缓存模式');
          // 显示连接错误提示
          this.showConnectionError();
        }
      } catch (error) {
        console.error('应用初始化失败:', error);
        // 隐藏可能显示的加载提示
        uni.hideLoading();
        
        // 显示初始化错误提示
        uni.showToast({
          title: '应用初始化失败，请重启应用',
          icon: 'none',
          duration: 3000
        });
      }
    },
    
    /**
     * 显示连接错误对话框
     */
    showConnectionError() {
      uni.showModal({
        title: 'API连接状态',
        content: '连接到服务器失败。我们检测到您的浏览器可以访问API，但应用无法自动连接。\n\n请点击"重试"按钮再次尝试连接，或者点击"继续"使用本地缓存模式。',
        confirmText: '重试',
        cancelText: '继续',
        success: (res) => {
          if (res.confirm) {
            // 用户点击了重试
            this.retryConnection();
          } else {
            // 用户选择了继续，提示本地模式限制
            uni.showToast({
              title: '本地模式下部分功能受限',
              icon: 'none',
              duration: 3000
            });
          }
        }
      });
    },
    
    /**
     * 重试连接
     */
    async retryConnection() {
      try {
        uni.showLoading({
          title: '正在重新连接...',
          mask: true
        });
        
        // 重置API服务状态
        apiService.isConnected = false;
        
        // 尝试连接所有可能的API端点
        const isConnected = await apiService.testConnection();
        
        uni.hideLoading();
        
        if (isConnected) {
          uni.showToast({
            title: '连接成功！',
            icon: 'success',
            duration: 2000
          });
          
          // 连接成功后刷新用户数据
          await userService.refreshCurrentUser();
          
          // 检查当前页面权限
          await checkCurrentPage();
        } else {
          // 显示诊断信息
          this.showDiagnosticInfo();
        }
      } catch (error) {
        console.error('重试连接失败:', error);
        uni.hideLoading();
        
        // 显示诊断信息
        this.showDiagnosticInfo();
      }
    },
    
    /**
     * 显示诊断信息
     */
    showDiagnosticInfo() {
      uni.showModal({
        title: '连接诊断',
        content: `
API状态检查:
✓ 我们已经确认您可以在浏览器中访问API
✕ 应用程序无法自动连接到API

可能原因:
1. 浏览器存在跨域限制 (CORS)
2. 请求被浏览器扩展拦截
3. 网络环境限制了应用请求

解决方法:
1. 重启浏览器并禁用扩展
2. 尝试使用不同的网络环境
3. 点击"继续"使用本地模式
        `,
        confirmText: '重试',
        cancelText: '继续',
        success: (res) => {
          if (res.confirm) {
            this.retryConnection();
          } else {
            // 用户选择继续使用本地模式
            uni.showToast({
              title: '启用本地模式',
              icon: 'none',
              duration: 2000
            });
          }
        }
      });
    }
  }
}
</script>

<style>
/*每个页面公共css */
</style>
