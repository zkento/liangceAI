<template>
  <div class="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <router-link to="/" class="logo">
            <img src="@/assets/logo.png" alt="良策AI Logo" class="logo-image" />
            良策AI
            <span class="subtitle">智能分析平台<span class="beta-tag"> Beta</span></span>
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
  padding: 0;
  height: 64px !important;
  line-height: 64px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  color: white;
  font-size: 24px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  height: 64px;
}

.logo-image {
  height: 36px;
  margin-right: 40px;
}

.subtitle {
  font-size: 16px;
  font-weight: normal;
  margin-left: 8px;
  opacity: 0.9;
}

.beta-tag {
  color: #cacaca;
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
</style> 