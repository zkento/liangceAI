<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="page-container">
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">融资建议</span>
        </template>
      </el-page-header>
    </div>

    <div class="page-content">
      <div class="intro-section">
        <h2>智能融资顾问</h2>
        <p>描述您的融资需求和具体情况，AI将为您提供专业的融资建议和方案。</p>
      </div>

      <AIChat type="financing-advice" />
    </div>
  </div>
</template>

<script>
import AIChat from '@/components/h5/AIChat/index.vue'

export default {
  name: 'FinancingAdvicePage',
  components: {
    AIChat
  },
  methods: {
    goBack() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  background-color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #202124;
}

.page-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.intro-section {
  margin-bottom: 32px;
  text-align: center;
}

.intro-section h2 {
  font-size: 24px;
  color: #202124;
  margin-bottom: 12px;
}

.intro-section p {
  color: #5f6368;
  font-size: 16px;
  line-height: 1.5;
}
</style> 