<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="page-container">
    <div class="page-header">
      <el-page-header @back="goBack">
        <template #content>
          <div class="header-content">
            <span class="page-title">个人征信分析</span>
            <el-button type="primary" link @click="showHistory = true">
              <el-icon><clock /></el-icon>
              分析记录
            </el-button>
          </div>
        </template>
      </el-page-header>
    </div>

    <div class="page-content" v-loading="loading" 
         :element-loading-text="loadingText"
         element-loading-spinner="el-icon-loading"
         element-loading-background="rgba(255, 255, 255, 0.9)">
      <div class="intro-section">
        <h2>智能个人征信分析</h2>
        <p>上传您的个人征信报告，AI将为您提供专业的分析和建议。</p>
      </div>

      <!-- 文件上传组件 -->
      <FileUpload v-if="!analysisResult" @file-uploaded="handleFileUploaded" />

      <!-- 分析结果展示 -->
      <div v-else class="analysis-container">
        <div class="analysis-header">
          <h3>分析报告</h3>
          <div class="action-buttons">
            <el-button @click="downloadPDF">
              <el-icon><download /></el-icon>
              下载PDF
            </el-button>
            <el-button @click="showSourceCode = !showSourceCode">
              {{ showSourceCode ? '隐藏源码' : '查看源码' }}
            </el-button>
            <el-button @click="resetAnalysis">重新上传</el-button>
          </div>
        </div>
        <div class="analysis-content">
          <div v-if="!showSourceCode" v-html="analysisResult"></div>
          <div v-else class="source-code-view">
            <pre><code>{{ analysisResult }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析进度提示 -->
    <el-dialog
      v-model="showProgress"
      title="分析进度"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false">
      <div class="progress-container">
        <el-steps :active="currentStep" finish-status="success">
          <el-step title="文件处理" description="正在处理您上传的文件..." />
          <el-step title="内容分析" description="AI正在分析报告内容..." />
          <el-step title="生成报告" description="正在整理分析结果，即将完成..." />
          <el-step title="完成" description="分析完成" />
        </el-steps>
        <div class="progress-tips">
          <p>{{ getCurrentStepTip }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 分析记录组件 -->
    <AnalysisHistory v-model="showHistory" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Clock } from '@element-plus/icons-vue'
import html2pdf from 'html2pdf.js'
import FileUpload from '@/components/h5/CreditReport/FileUpload.vue'
import AnalysisHistory from '@/components/h5/CreditReport/AnalysisHistory.vue'
import { chatWithAI } from '@/api/deepseek'

export default {
  name: 'PersonalCreditPage',
  components: {
    FileUpload,
    Download,
    Clock,
    AnalysisHistory
  },
  setup() {
    const router = useRouter()
    const analysisResult = ref(null)
    const loading = ref(false)
    const loadingText = ref('准备分析...')
    const showProgress = ref(false)
    const currentStep = ref(0)
    const elapsedTime = ref(0)
    const timerInterval = ref(null)
    const showSourceCode = ref(false)
    const reportGenerationDesc = ref('正在生成分析报告...')
    const showHistory = ref(false)
    const originalFile = ref(null)

    const progressTips = [
      '正在处理您上传的文件，请稍候...',
      'AI正在深入分析报告内容，这可能需要一点时间...',
      '正在整理分析结果，即将完成...',
      '分析完成！'
    ]

    // 获取当前步骤的提示（包含耗时）
    const getCurrentStepTip = computed(() => {
      if (currentStep.value < 1 || currentStep.value > progressTips.length) return ''
      const baseText = progressTips[currentStep.value - 1]
      return elapsedTime.value > 0 && currentStep.value < 4
        ? `${baseText}（${elapsedTime.value}秒）`
        : baseText
    })

    // 开始计时器
    const startTimer = () => {
      elapsedTime.value = 0
      timerInterval.value = setInterval(() => {
        elapsedTime.value++
      }, 1000)
    }

    // 停止计时器
    const stopTimer = () => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }

    // 处理文件上传
    const handleFileUploaded = async (fileData) => {
      loading.value = true
      showProgress.value = true
      currentStep.value = 1
      startTimer() // 从第一步就开始计时
      
      try {
        // 文件处理阶段
        await new Promise(resolve => setTimeout(resolve, 1000))
        currentStep.value = 2
        loadingText.value = '正在分析内容...'

        // AI分析阶段
        // 获取文件内容
        let content = fileData.content
        
        // 记录原始文件信息
        originalFile.value = {
          name: fileData.name,
          type: fileData.type
        }
        
        // 调用AI分析，确保参数顺序正确
        const aiResponse = await chatWithAI(content, 'personal-credit')
        
        // 检查AI响应
        if (!aiResponse.success) {
          throw new Error(aiResponse.error || '分析失败')
        }
        
        currentStep.value = 3
        loadingText.value = '生成报告中...'

        // 生成报告阶段
        await new Promise(resolve => setTimeout(resolve, 1000))
        analysisResult.value = aiResponse.data
        currentStep.value = 4
        stopTimer() // 完成时停止计时
        
        // 完成
        await new Promise(resolve => setTimeout(resolve, 500))
        showProgress.value = false
      } catch (error) {
        stopTimer() // 出错时停止计时
        ElMessage.error(error.message || '分析失败，请重试')
      } finally {
        loading.value = false
        loadingText.value = '准备分析...'
      }
    }

    // 下载PDF
    const downloadPDF = async () => {
      if (!analysisResult.value) return
      
      const element = document.querySelector('.analysis-content')
      const opt = {
        margin: 1,
        filename: '个人征信分析报告.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }

      try {
        loading.value = true
        loadingText.value = '正在生成PDF...'
        await html2pdf().from(element).set(opt).save()
      } catch (error) {
        ElMessage.error('PDF生成失败，请重试')
      } finally {
        loading.value = false
      }
    }

    // 重置分析
    const resetAnalysis = () => {
      analysisResult.value = null
      currentStep.value = 0
      elapsedTime.value = 0
      stopTimer()
      showSourceCode.value = false
    }

    // 返回首页
    const goBack = () => {
      if (analysisResult.value) {
        ElMessageBox.confirm('返回将丢失当前分析结果，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          analysisResult.value = null
          router.push('/')
        })
      } else {
        router.push('/')
      }
    }

    // 组件卸载时清理计时器
    onUnmounted(() => {
      stopTimer()
    })

    return {
      analysisResult,
      loading,
      loadingText,
      showProgress,
      currentStep,
      progressTips,
      elapsedTime,
      showSourceCode,
      reportGenerationDesc,
      handleFileUploaded,
      downloadPDF,
      resetAnalysis,
      goBack,
      showHistory,
      getCurrentStepTip,
      originalFile
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  position: relative;
}

.page-header {
  background-color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
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

.analysis-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 24px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.analysis-header h3 {
  font-size: 20px;
  color: #202124;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.analysis-content {
  line-height: 1.6;
  font-size: 14px;
}

.progress-container {
  padding: 20px;
}

.progress-tips {
  margin-top: 20px;
  text-align: center;
  color: #409EFF;
  font-size: 14px;
}

.progress-tips p {
  margin: 0;
  line-height: 1.5;
}

:deep(.el-steps) {
  max-width: 800px;
  margin: 0 auto;
}

:deep(.analysis-content) {
  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0;
    color: #202124;
  }

  p {
    margin: 12px 0;
    line-height: 1.6;
  }

  ul, ol {
    padding-left: 24px;
    margin: 12px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  th, td {
    border: 1px solid #eee;
    padding: 12px;
    text-align: left;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 500;
  }
}

.source-code-container {
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.source-code-container h4 {
  margin: 0 0 16px 0;
  color: #202124;
  font-size: 16px;
}

.source-code-container pre {
  margin: 0;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 4px;
  overflow-x: auto;
}

.source-code-container code {
  color: #fff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.elapsed-time {
  margin-top: 8px;
  font-size: 14px;
  color: #409EFF;
  font-weight: 500;
}

:deep(.el-collapse-transition) {
  transition: all 0.3s ease-in-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

:deep(.el-button--link) {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

:deep(.el-icon) {
  font-size: 16px;
}

.source-code-view {
  background: #2d2d2d;
  border-radius: 4px;
  padding: 16px;
  margin-top: 0;
}

.source-code-view pre {
  margin: 0;
  overflow-x: auto;
}

.source-code-view code {
  color: #fff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style> 