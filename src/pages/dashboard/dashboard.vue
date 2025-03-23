<template>
  <view class="dashboard-container">
    <!-- 顶部导航 -->
    <view class="top-bar">
      <text class="title">台球比赛系统</text>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar">
        <text>{{ getUserInitial() }}</text>
      </view>
      <view class="user-info">
        <text class="username">{{ userData.username || '加载中...' }}</text>
        <text class="organization">{{ userData.organization || '未设置组织' }}</text>
      </view>
    </view>
    
    <!-- 统计数据 -->
    <view class="stats-section">
      <text class="section-title">比赛统计</text>
      
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ userData.matches || 0 }}</text>
          <text class="stat-label">总参赛届数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.wins || 0 }}</text>
          <text class="stat-label">胜利局数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.losses || 0 }}</text>
          <text class="stat-label">失败局数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.winMatches || 0 }}</text>
          <text class="stat-label">胜利比赛数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.lossMatches || 0 }}</text>
          <text class="stat-label">失败比赛数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.mvpCount || 0 }}</text>
          <text class="stat-label">MVP次数</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.scoreFor || 0 }}</text>
          <text class="stat-label">己方得分</text>
        </view>
        
        <view class="stat-card">
          <text class="stat-value">{{ userData.scoreAgainst || 0 }}</text>
          <text class="stat-label">对方得分</text>
        </view>
      </view>
    </view>
    
    <!-- 玩家排行榜 -->
    <view class="ranking-section" v-if="allUsers.length > 0">
      <text class="section-title">玩家排行榜</text>
      
      <view class="ranking-list">
        <view 
          v-for="(user, index) in rankUsersByWins()" 
          :key="user.username"
          class="ranking-item"
          :class="{ 'current-user': user.username === userData.username }"
        >
          <text class="ranking-number">{{ index + 1 }}</text>
          <text class="ranking-name">{{ user.username }}</text>
          <text class="ranking-org">{{ user.organization || '无组织' }}</text>
          <text class="ranking-wins">{{ user.wins || 0 }}胜</text>
          <text class="ranking-mvps">MVP: {{ user.mvpCount || 0 }}</text>
        </view>
      </view>
    </view>
    
    <!-- 功能按钮 -->
    <view class="action-buttons">
      <button class="action-btn start-match" @click="goToMatch">开始比赛</button>
      <button class="action-btn edit-profile" @click="goToProfile">编辑资料</button>
    </view>
    
    <!-- 加载状态 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 错误提示 -->
    <uni-popup ref="message" type="message">
      <uni-popup-message 
        :type="messageType" 
        :message="messageContent" 
        :duration="2000"
      ></uni-popup-message>
    </uni-popup>
  </view>
</template>

<script>
import { userService } from '@/api';
import { checkCurrentPage } from '@/api/routeGuard';

export default {
  data() {
    return {
      userData: {},
      allUsers: [],
      loading: true,
      messageType: 'error',
      messageContent: ''
    };
  },
  
  onLoad() {
    // 检查登录状态
    this.checkAuth();
  },
  
  methods: {
    // 显示消息提示
    showMessage(type, content) {
      this.messageType = type;
      this.messageContent = content;
      this.$refs.message.open();
    },
    
    // 检查身份认证
    async checkAuth() {
      try {
        // 使用路由守卫检查登录状态
        await checkCurrentPage();
        
        // 加载用户数据
        await this.loadData();
      } catch (error) {
        console.error('身份验证失败:', error);
      }
    },
    
    // 加载数据
    async loadData() {
      try {
        this.loading = true;
        
        // 获取当前用户信息
        const userData = await userService.getCurrentUser(true);
        if (userData) {
          this.userData = userData;
        } else {
          // 如果无法获取用户信息，可能是会话已过期
          this.showMessage('error', '无法获取用户信息，请重新登录');
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/login'
            });
          }, 1500);
          return;
        }
        
        // 获取所有用户用于排行榜
        const allUsers = await userService.getAllUsers();
        this.allUsers = allUsers;
      } catch (error) {
        this.showMessage('error', '加载数据失败: ' + (error.message || '网络错误'));
        console.error('加载数据错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 根据胜利数排序用户
    rankUsersByWins() {
      return [...this.allUsers].sort((a, b) => {
        const winsA = parseInt(a.wins || 0);
        const winsB = parseInt(b.wins || 0);
        
        if (winsB !== winsA) {
          return winsB - winsA; // 胜利数降序排序
        }
        
        // 胜利数相同时，比较MVP数
        const mvpA = parseInt(a.mvpCount || 0);
        const mvpB = parseInt(b.mvpCount || 0);
        return mvpB - mvpA;
      });
    },
    
    // 获取用户名首字母
    getUserInitial() {
      if (!this.userData.username) return '?';
      return this.userData.username.charAt(0).toUpperCase();
    },
    
    // 处理登出
    async handleLogout() {
      try {
        this.loading = true;
        await userService.logout();
        
        uni.redirectTo({
          url: '/pages/login/login'
        });
      } catch (error) {
        this.showMessage('error', '登出失败: ' + (error.message || '网络错误'));
      } finally {
        this.loading = false;
      }
    },
    
    // 跳转到比赛页面
    goToMatch() {
      uni.navigateTo({
        url: '/pages/match/match'
      });
    },
    
    // 跳转到个人资料页面
    goToProfile() {
      uni.navigateTo({
        url: '/pages/profile/profile'
      });
    }
  }
};
</script>

<style>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 40rpx;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.logout-btn {
  font-size: 28rpx;
  background: none;
  border: none;
  color: #007AFF;
  padding: 10rpx 20rpx;
  margin: 0;
  line-height: 1.5;
}

.logout-btn::after {
  border: none;
}

.user-card {
  margin: 30rpx;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: linear-gradient(to right, #007AFF, #0056D6);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 30rpx;
}

.avatar text {
  color: #fff;
  font-size: 60rpx;
  font-weight: bold;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.organization {
  font-size: 28rpx;
  color: #666;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin: 40rpx 30rpx 20rpx;
  display: block;
}

.stats-section {
  margin: 0 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding: 20rpx;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.stat-card {
  width: 22%;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 20rpx 10rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.ranking-section {
  margin: 0 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding: 20rpx;
  margin-top: 40rpx;
}

.ranking-list {
  max-height: 500rpx;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 20rpx 10rpx;
  border-bottom: 1rpx solid #eee;
}

.ranking-item:last-child {
  border-bottom: none;
}

.current-user {
  background-color: rgba(0, 122, 255, 0.05);
}

.ranking-number {
  width: 60rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.ranking-name {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  margin-right: 20rpx;
}

.ranking-org {
  width: 160rpx;
  font-size: 26rpx;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-wins {
  width: 80rpx;
  font-size: 28rpx;
  color: #007AFF;
  text-align: right;
}

.ranking-mvps {
  width: 120rpx;
  font-size: 26rpx;
  color: #f5a623;
  text-align: right;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin: 40rpx 30rpx;
}

.action-btn {
  width: 48%;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
}

.start-match {
  background: linear-gradient(to right, #007AFF, #0056D6);
  color: #fff;
}

.edit-profile {
  background-color: #fff;
  color: #007AFF;
  border: 1rpx solid #007AFF;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 