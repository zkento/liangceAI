<template>
  <div class="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <router-link to="/" class="logo-container">
            <img src="@/assets/logo.png" alt="良策网络 Logo" class="logo-image" />
            <div class="separator"></div>
            <div class="site-title">
              <span class="title-text">良策AI</span>
              <span class="subtitle">智能分析平台<span class="beta-tag"> Beta</span></span>
            </div>
          </router-link>
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.app {
  min-height: 100vh;
}

.el-header {
  background-color: #1b68de;
  padding: 0 5%;
  height: 64px !important;
  line-height: 64px;
  display: flex;
  justify-content: flex-start;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo-container {
  display: flex;
  align-items: center;
  text-decoration: none;
  height: 64px;
}

.logo-image {
  height: 32px;
}

.separator {
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.4);
  margin: 0 20px;
}

.site-title {
  display: flex;
  align-items: center;
  line-height: normal;
}

.title-text {
  color: white;
  font-size: 22px;
  font-weight: 600;
}

.subtitle {
  color: white;
  font-size: 16px;
  font-weight: normal;
  opacity: 0.9;
  margin-left: 8px;
}

.beta-tag {
  color: var(--el-text-color-placeholder);
}

.el-main {
  padding: 0;
  background-color: #f5f7fa;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

:root {
  --primary-color: #1b68de;
}

.el-button--primary {
  --el-button-bg-color: var(--primary-color) !important;
  --el-button-border-color: var(--primary-color) !important;
  --el-button-hover-bg-color: #4285f4 !important;
  --el-button-hover-border-color: #4285f4 !important;
}

/* 添加响应式布局样式 */
@media (max-width: 768px) {
  .el-header {
    padding: 0 4%;
  }
  
  .separator {
    margin: 0 15px;
  }
  
  .title-text {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 13px;
    margin-left: 6px;
  }
  
  .logo-image {
    height: 32px;
  }
}

@media (max-width: 480px) {
  .el-header {
    padding: 0 3%;
  }
  
  .separator {
    margin: 0 10px;
  }
  
  .title-text {
    font-size: 18px;
  }
  
  .subtitle {
    font-size: 12px;
    margin-left: 4px;
  }
  
  .logo-image {
    height: 28px;
  }
}
</style> 