<template>
  <div class="model-selector">
    <el-popover
      placement="bottom"
      :width="320"
      trigger="click"
      popper-class="model-selector-popper"
    >
      <template #reference>
        <div class="model-trigger" :class="{ 'is-loading': loading }">
          <el-tooltip :content="currentModel ? currentModel.name : '选择模型'" placement="top">
            <div class="model-info">
              <div class="model-icon">
                <el-icon v-if="loading"><Loading /></el-icon>
                <el-icon v-else-if="currentModel && currentModel.type === 'local'"><Monitor /></el-icon>
                <el-icon v-else><Connection /></el-icon>
              </div>
              <span class="model-name">{{ currentModel ? currentModel.name : '选择模型' }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
          </el-tooltip>
        </div>
      </template>
      
      <!-- 模型选择面板 -->
      <div class="model-panel">
        <div class="panel-header">
          <h3>选择AI模型</h3>
        </div>
        
        <div class="model-list">
          <div
            v-for="model in availableModels"
            :key="model.id"
            class="model-item"
            :class="{
              'is-active': currentModelId === model.id,
              'is-disabled': loading
            }"
            @click="handleModelSelect(model.id)"
          >
            <div class="model-item-icon">
              <el-icon v-if="model.type === 'local'"><Monitor /></el-icon>
              <el-icon v-else><Connection /></el-icon>
            </div>
            
            <div class="model-item-info">
              <div class="model-item-name">{{ model.name }}</div>
              <div class="model-item-desc">{{ model.description }}</div>
            </div>
            
            <div class="model-item-tags">
              <el-tag 
                v-for="(tag, index) in model.tags" 
                :key="index" 
                size="small" 
                effect="plain"
              >{{ tag }}</el-tag>
            </div>
            
            <div class="model-item-status">
              <el-icon v-if="currentModelId === model.id"><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { 
  Monitor, 
  Connection, 
  Loading, 
  Check, 
  ArrowDown 
} from '@element-plus/icons-vue'

export default {
  name: 'ModelSelector',
  components: {
    Monitor,
    Connection,
    Loading,
    Check,
    ArrowDown
  },
  emits: ['model-changed'],
  setup(props, { emit }) {
    const store = useStore()
    const loading = computed(() => store.getters['user/isModelSwitching'])
    const currentModelId = computed(() => store.getters['user/currentModelId'])
    const availableModels = computed(() => store.getters['user/availableModels'])
    const currentModel = computed(() => {
      return availableModels.value.find(model => model.id === currentModelId.value) || null
    })

    // 处理模型选择
    async function handleModelSelect(modelId) {
      if (loading.value || currentModelId.value === modelId) return
      
      try {
        const result = await store.dispatch('user/switchModel', modelId)
        if (result.success) {
          emit('model-changed', modelId)
        }
      } catch (error) {
        console.error('切换模型失败:', error)
        ElMessage.error(`切换模型失败: ${error.message || '未知错误'}`)
      }
    }

    return {
      loading,
      currentModelId,
      availableModels,
      currentModel,
      handleModelSelect
    }
  }
}
</script>

<style lang="scss" scoped>
.model-selector {
  display: inline-block;
}

.model-trigger {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  transition: all 0.3s;
  
  &:hover {
    border-color: #c0c4cc;
  }
  
  &.is-loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.model-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.model-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
}

.model-name {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  font-size: 12px;
  color: #909399;
}

.panel-header {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.model-list {
  max-height: 400px;
  overflow-y: auto;
}

.model-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #f2f6fc;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.is-active {
    background-color: #ecf5ff;
  }
  
  &.is-disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.model-item-icon {
  margin-right: 12px;
  color: var(--el-color-primary);
  font-size: 20px;
  padding-top: 2px;
}

.model-item-info {
  flex: 1;
  min-width: 0;
}

.model-item-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.model-item-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.model-item-status {
  display: flex;
  align-items: center;
  margin-left: 8px;
  color: var(--el-color-success);
}
</style>

<style>
.model-selector-popper {
  padding: 0;
}
</style> 