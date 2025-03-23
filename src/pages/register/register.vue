<template>
  <view class="register-container">
    <view class="register-header">
      <image class="logo" src="/static/logo.png"></image>
      <text class="title">创建新账号</text>
    </view>
    
    <view class="register-form">
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
      
      <view class="input-group">
        <text class="label">确认密码</text>
        <input 
          class="input" 
          type="password" 
          v-model="confirmPassword" 
          placeholder="请再次输入密码" 
          password
          maxlength="20"
        />
      </view>
      
      <view class="input-group">
        <text class="label">所属组织 (可选)</text>
        <input 
          class="input" 
          type="text" 
          v-model="organization" 
          placeholder="请输入所属组织名称" 
          maxlength="30"
        />
      </view>
      
      <button 
        class="register-btn" 
        type="primary" 
        :loading="loading" 
        @click="handleRegister"
      >
        注册
      </button>
      
      <view class="actions">
        <text class="login-link" @click="goToLogin">已有账号？返回登录</text>
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
      confirmPassword: '',
      organization: '',
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
    
    // 处理注册
    async handleRegister() {
      // 表单验证
      if (!this.username.trim()) {
        this.showMessage('error', '请输入用户名');
        return;
      }
      
      if (this.username.length < 3) {
        this.showMessage('error', '用户名至少需要3个字符');
        return;
      }
      
      if (!this.password.trim()) {
        this.showMessage('error', '请输入密码');
        return;
      }
      
      if (this.password.length < 6) {
        this.showMessage('error', '密码至少需要6个字符');
        return;
      }
      
      if (this.password !== this.confirmPassword) {
        this.showMessage('error', '两次输入的密码不一致');
        return;
      }
      
      try {
        this.loading = true;
        
        // 调用注册API
        const response = await userService.register(
          this.username, 
          this.password, 
          this.organization
        );
        
        if (response.success) {
          this.showMessage('success', '注册成功');
          
          // 注册成功，延迟跳转到登录页
          setTimeout(() => {
            uni.redirectTo({
              url: '/pages/login/login'
            });
          }, 1500);
        } else {
          this.showMessage('error', response.message || '注册失败');
        }
      } catch (error) {
        this.showMessage('error', error.message || '网络错误，请稍后重试');
        console.error('注册错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 跳转到登录页
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
};
</script>

<style>
.register-container {
  padding: 40rpx;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  margin-top: 40rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.register-form {
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

.register-btn {
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

.login-link {
  color: #007AFF;
  font-size: 28rpx;
}
</style> 