<template>
  <view class="login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.png"></image>
      <text class="title">台球比赛系统</text>
    </view>
    
    <view class="login-form">
      <view class="input-group">
        <text class="label">用户名</text>
        <input 
          class="input" 
          type="text" 
          v-model="username" 
          placeholder="请输入用户名" 
          maxlength="20"
        />
      </view>
      
      <view class="input-group">
        <text class="label">密码</text>
        <input 
          class="input" 
          type="password" 
          v-model="password" 
          placeholder="请输入密码" 
          password
          maxlength="20"
        />
      </view>
      
      <button 
        class="login-btn" 
        type="primary" 
        :loading="loading" 
        @click="handleLogin"
      >
        登录
      </button>
      
      <view class="actions">
        <text class="register-link" @click="goToRegister">注册新账号</text>
      </view>
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

export default {
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      messageType: 'error',
      messageContent: ''
    };
  },
  
  methods: {
    // 显示消息提示
    showMessage(type, content) {
      this.messageType = type;
      this.messageContent = content;
      this.$refs.message.open();
    },
    
    // 处理登录
    async handleLogin() {
      // 表单验证
      if (!this.username.trim()) {
        this.showMessage('error', '请输入用户名');
        return;
      }
      
      if (!this.password.trim()) {
        this.showMessage('error', '请输入密码');
        return;
      }
      
      try {
        this.loading = true;
        
        // 调用登录API
        const response = await userService.login(this.username, this.password);
        
        if (response.success) {
          this.showMessage('success', '登录成功');
          
          // 登录成功，延迟跳转到首页
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/dashboard/dashboard'
            });
          }, 1500);
        } else {
          this.showMessage('error', response.message || '登录失败');
        }
      } catch (error) {
        this.showMessage('error', error.message || '网络错误，请稍后重试');
        console.error('登录错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 跳转到注册页
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    }
  }
};
</script>

<style>
.login-container {
  padding: 40rpx;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  margin-top: 60rpx;
}

.logo {
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.login-form {
  background-color: #fff;
  padding: 40rpx;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  margin-bottom: 10rpx;
  color: #666;
}

.input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.login-btn {
  margin-top: 40rpx;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  background: linear-gradient(to right, #007AFF, #0056D6);
}

.actions {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
}

.register-link {
  color: #007AFF;
  font-size: 28rpx;
}
</style> 