<template>
  <div class="page-container">
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #title>返回</template>
        <template #content>
          <span class="page-title">个人征信分析</span>
        </template>
      </el-page-header>
    </div>
    
    <div class="page-content">
      <creditReportAnalyse chat-type="personal-credit" />
    </div>
  </div>
</template>

<script>
import creditReportAnalyse from '../components/creditReportAnalyse.vue'

export default {
  name: 'PersonalCredit',
  components: {
    creditReportAnalyse
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  background: white;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
}

.page-content {
  flex: 1;
  overflow: hidden;
}
</style> 