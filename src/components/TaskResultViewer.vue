<!-- 最后修改记录时间 -> 2025-04-12 10:15:00 -->
<template>
  <div class="task-result-viewer">
    <!-- 头部信息 -->
    <div class="result-header">
      <div class="task-info">
        <h1 class="task-title">{{ taskTitle }}</h1>
        <div class="task-metadata">
          <div class="metadata-item">
            <span class="label">任务ID：</span>
            <span class="value">{{ taskData.id || '未知' }}</span>
          </div>
          <div class="metadata-item">
            <span class="label">提交时间：</span>
            <span class="value">{{ taskData.submitTime || '未知' }}</span>
          </div>
          <div class="metadata-item">
            <span class="label">完成时间：</span>
            <span class="value">{{ taskData.endTime || '未知' }}</span>
          </div>
          <div class="metadata-item" v-if="taskData.customerName">
            <span class="label">客户姓名：</span>
            <span class="value">{{ taskData.customerName }}</span>
          </div>
        </div>
      </div>
      <div class="actions">
        <el-button type="primary" @click="handleDownload">下载结果</el-button>
        <el-button type="default" @click="handlePrint">打印</el-button>
        <el-button type="default" @click="handleClose">关闭</el-button>
      </div>
    </div>

    <!-- 提示加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="error-container">
      <el-empty description="加载结果失败">
        <template #description>
          <p>{{ loadError }}</p>
        </template>
        <el-button type="primary" @click="loadTaskResult">重试</el-button>
      </el-empty>
    </div>

    <!-- 结果内容区域 - 根据任务类型展示不同内容 -->
    <div v-else class="result-content">
      <!-- 个人征信报告分析结果 -->
      <div v-if="taskType === '个人征信报告分析'" class="personal-credit-result">
        <div class="result-placeholder">
          <h2>个人征信报告分析结果</h2>
          <p>此处将显示个人征信报告的分析结果内容</p>
          <p class="note">具体内容展示格式待定，将根据后续需求进行调整</p>
        </div>
      </div>

      <!-- 企业征信报告分析结果 -->
      <div v-else-if="taskType === '企业征信报告分析'" class="business-credit-result">
        <div class="result-placeholder">
          <h2>企业征信报告分析结果</h2>
          <p>此处将显示企业征信报告的分析结果内容</p>
          <p class="note">具体内容展示格式待定，将根据后续需求进行调整</p>
        </div>
      </div>

      <!-- 买家顾问报告结果 -->
      <div v-else-if="taskType === '买家顾问报告'" class="buyer-advisor-result">
        <div class="result-placeholder">
          <h2>买家顾问报告结果</h2>
          <p>此处将显示买家顾问报告的结果内容</p>
          <p class="note">具体内容展示格式待定，将根据后续需求进行调整</p>
        </div>
      </div>

      <!-- 融资顾问报告结果 -->
      <div v-else-if="taskType === '融资顾问报告'" class="finance-advisor-result">
        <div class="result-placeholder">
          <h2>融资顾问报告结果</h2>
          <p>此处将显示融资顾问报告的结果内容</p>
          <p class="note">具体内容展示格式待定，将根据后续需求进行调整</p>
        </div>
      </div>

      <!-- 未知任务类型 -->
      <div v-else class="unknown-result">
        <el-empty description="未知的任务类型">
          <template #description>
            <p>暂不支持显示该类型任务的结果: {{ taskType }}</p>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'TaskResultViewer',
  props: {
    // 任务ID
    taskId: {
      type: String,
      required: true
    },
    // 任务类型
    taskType: {
      type: String,
      required: true
    },
    // 任务数据（可选，如果提供则不需要从API获取）
    taskData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    // 状态管理
    const loading = ref(true)
    const loadError = ref('')
    const taskResult = ref(null)

    // 计算任务标题
    const taskTitle = computed(() => {
      return props.taskType || '任务结果'
    })

    // 加载任务结果数据
    const loadTaskResult = async () => {
      // 如果没有任务ID，无法加载结果
      if (!props.taskId) {
        loadError.value = '无效的任务ID'
        loading.value = false
        return
      }

      // 重置状态
      loading.value = true
      loadError.value = ''

      try {
        // 模拟API请求获取任务结果
        // 实际项目中应该调用真实的API
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟获取结果成功
        taskResult.value = {
          // 示例结果数据
          id: props.taskId,
          type: props.taskType,
          content: `这是${props.taskType}的结果内容示例`,
          // 根据不同任务类型设置不同的示例数据
          // 在实际项目中，这里应该是从API返回的数据
        }

        loading.value = false
      } catch (error) {
        console.error('加载任务结果失败:', error)
        loadError.value = '加载结果数据失败，请稍后重试'
        loading.value = false
      }
    }

    // 处理下载结果
    const handleDownload = () => {
      ElMessage.info('下载功能尚未实现，将在后续版本中提供')
    }

    // 处理打印
    const handlePrint = () => {
      window.print()
    }

    // 处理关闭
    const handleClose = () => {
      window.close()
    }

    // 组件挂载后自动加载结果
    onMounted(() => {
      loadTaskResult()
    })

    return {
      loading,
      loadError,
      taskResult,
      taskTitle,
      loadTaskResult,
      handleDownload,
      handlePrint,
      handleClose
    }
  }
}
</script>

<style scoped>
.task-result-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.task-title {
  font-size: 22px;
  color: #303133;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.task-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.metadata-item {
  display: flex;
  align-items: center;
}

.metadata-item .label {
  color: #909399;
  margin-right: 5px;
}

.metadata-item .value {
  color: #606266;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 10px;
}

.loading-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
}

.error-container {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.result-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
  overflow-y: auto;
}

.result-placeholder {
  text-align: center;
  padding: 50px 20px;
  background-color: #f8f9fb;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.result-placeholder h2 {
  color: #303133;
  margin-bottom: 15px;
}

.result-placeholder p {
  color: #606266;
  margin-bottom: 10px;
}

.result-placeholder .note {
  color: #909399;
  font-size: 14px;
  font-style: italic;
}

/* 打印样式 */
@media print {
  .task-result-viewer {
    padding: 0;
    background-color: white;
  }
  
  .result-header {
    box-shadow: none;
    border-bottom: 1px solid #ebeef5;
    border-radius: 0;
  }
  
  .actions {
    display: none;
  }
  
  .result-content {
    box-shadow: none;
    border-radius: 0;
  }
}
</style> 