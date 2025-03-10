<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="credit-report-upload">
    <el-upload
      class="upload-area"
      drag
      :action="uploadAction"
      :accept="config.accept"
      :before-upload="beforeUpload"
      :on-exceed="handleExceed"
      :limit="1"
      :auto-upload="false"
      @change="handleChange"
    >
      <div class="upload-content">
        <el-icon class="upload-icon"><upload-filled /></el-icon>
        <div class="credit-report-upload-text">
          <h3>{{ config.title }}</h3>
          <p>{{ config.description }}</p>
        </div>
      </div>
      <template #tip>
        <div class="credit-report-upload-tip">
          <p v-for="(tip, index) in config.tips" :key="index">{{ tip }}</p>
          <p>支持格式：{{ supportedFormats.join('、') }} | 文件大小不超过 {{ config.maxSize }}MB</p>
        </div>
      </template>
    </el-upload>

    <!-- 文件预览区域 -->
    <div v-if="selectedFile" class="preview-area">
      <div class="preview-header">
        <span class="file-name">{{ selectedFile.name }}</span>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          开始分析
        </el-button>
      </div>
    </div>
    
    <!-- PDF 文件提示对话框 -->
    <el-dialog
      v-model="showPdfDialog"
      title="PDF文件提示"
      width="80%">
      <div class="pdf-dialog-content">
        <p>AI无法直接分析PDF文件内容。请提供以下信息：</p>
        <el-form ref="pdfForm" :model="pdfFormData" label-width="120px">
          <el-form-item label="征信报告内容">
            <el-input
              v-model="pdfFormData.content"
              type="textarea"
              :rows="10"
              placeholder="请输入征信报告中的关键数据，如贷款信息、信用卡信息等"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPdfDialog = false">取消</el-button>
          <el-button type="primary" @click="submitPdfContent">提交分析</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import personalCreditConfig from '@/config/prompts/personal-credit'

export default {
  name: 'FileUpload',
  components: {
    UploadFilled
  },
  emits: ['file-uploaded'],
  setup(props, { emit }) {
    const config = personalCreditConfig.uploadTip
    const selectedFile = ref(null)
    const uploading = ref(false)
    const showPdfDialog = ref(false)
    const pdfFormData = ref({
      content: ''
    })

    // 计算支持的文件格式
    const supportedFormats = computed(() => {
      return config.accept.split(',').map(format => format.replace('.', '').toUpperCase())
    })

    // 上传地址（实际项目中应该是后端API地址）
    const uploadAction = '#'

    // 上传前验证
    const beforeUpload = (file) => {
      // 验证文件大小
      const isLt10M = file.size / 1024 / 1024 < config.maxSize
      if (!isLt10M) {
        ElMessage.error(`文件大小不能超过 ${config.maxSize}MB`)
        return false
      }

      return true
    }

    // 文件状态改变
    const handleChange = (uploadFile) => {
      selectedFile.value = uploadFile.raw
    }

    // 处理文件上传
    const handleUpload = async () => {
      if (!selectedFile.value) {
        ElMessage.warning('请先选择文件')
        return
      }

      uploading.value = true
      try {
        // 检查是否为PDF文件
        if (selectedFile.value.type === 'application/pdf') {
          // 显示PDF处理对话框
          showPdfDialog.value = true
          uploading.value = false
          return
        }
        
        const reader = new FileReader()
        reader.onload = async (e) => {
          // 发送文件内容给父组件
          emit('file-uploaded', {
            content: e.target.result,
            name: selectedFile.value.name,
            type: selectedFile.value.type
          })
          uploading.value = false
        }
        
        // 对于文本文件，使用readAsText
        reader.readAsText(selectedFile.value)
      } catch (error) {
        ElMessage.error('文件处理失败，请重试')
        uploading.value = false
      }
    }
    
    // 提交PDF内容
    const submitPdfContent = () => {
      if (!pdfFormData.value.content.trim()) {
        ElMessage.warning('请输入征信报告内容')
        return
      }
      
      emit('file-uploaded', {
        content: pdfFormData.value.content,
        name: selectedFile.value.name,
        type: 'text/plain' // 将类型改为文本
      })
      
      showPdfDialog.value = false
      pdfFormData.value.content = ''
    }

    // 处理超出限制
    const handleExceed = () => {
      ElMessage.warning('只能上传一个文件')
    }

    return {
      config,
      supportedFormats,
      uploadAction,
      selectedFile,
      uploading,
      showPdfDialog,
      pdfFormData,
      beforeUpload,
      handleChange,
      handleUpload,
      submitPdfContent,
      handleExceed
    }
  }
}
</script>

<style scoped>
.upload-area {
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.preview-area {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  color: #606266;
  font-size: 14px;
}

.pdf-dialog-content {
  margin-bottom: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
}

:deep(.el-upload) {
  width: 100%;
}
</style> 