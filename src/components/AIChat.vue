<template>
  <div class="ai-chat">
    <div class="chat-container" ref="chatContainer">
      <!-- 文件上传提示区域 - 仅在个人征信分析页面显示且处于上传状态 -->
      <div v-if="(chatType === 'personal-credit' || chatType === 'business-credit') && analysisState === 'upload'" class="upload-container">
        <div class="upload-layout">
          <!-- 左侧上传区域 -->
          <div class="upload-main">
            <h2 class="upload-title"><el-icon><Document /></el-icon> 请上传{{ chatType === 'personal-credit' ? '个人' : '企业' }}征信报告</h2>
            
            <div class="upload-dropzone" 
                 :class="{'is-dragover': isDragover, 'has-file': fileList.length > 0}"
                 @dragover.prevent="isDragover = true"
                 @dragleave.prevent="isDragover = false"
                 @drop.prevent="handleFileDrop">
        <el-upload
          class="upload-area"
                drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
                :on-remove="handleFileRemove"
          :limit="1"
          :file-list="fileList"
          accept=".pdf"
        >
                <div class="upload-content">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                  <div class="upload-text">
                    <span v-if="fileList.length === 0">拖拽文件到此处或 <em>点击上传</em></span>
                    <span v-else>已选择文件: <strong>{{ fileList[0].name }}</strong></span>
            </div>
                  <div class="upload-hint">暂仅支持PDF文件，文件大小不超过10MB</div>
                </div>
        </el-upload>
            </div>
            
            <div class="upload-actions">
        <el-button 
          v-if="fileList.length > 0" 
                type="danger" 
                plain
                @click="resetFileList"
                :disabled="uploading"
                class="action-button"
              >
                <el-icon><Delete /></el-icon> 清除文件
              </el-button>
              
              <el-button 
                type="primary" 
                class="action-button" 
          @click="uploadFile"
          :loading="uploading"
                :disabled="fileList.length === 0"
        >
                <el-icon><CaretRight /></el-icon> 开始分析
        </el-button>
            </div>
      </div>
      
          <!-- 右侧说明区域 -->
          <div class="upload-sidebar">
            <div class="upload-instructions">
              <h3>使用说明</h3>
              <ul>
                <li><el-icon><Check /></el-icon> 请上传客户的PDF征信报告文件</li>
                <li><el-icon><Check /></el-icon> 文件大小不超过10MB</li>
                <li><el-icon><Check /></el-icon> 确保文件内容清晰可读</li>
                <li><el-icon><Check /></el-icon> 所有数据仅用于分析，不会被保存</li>
              </ul>
              
              <el-alert
                class="upload-alert"
                title="温馨提示"
                type="info"
                description="为了获得最佳分析效果，请确保上传的征信报告内容完整、清晰。分析过程可能需要几十秒钟时间。"
                show-icon
                :closable="false"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分析处理流程区域 - 在开始分析后显示 -->
      <div v-if="(chatType === 'personal-credit' || chatType === 'business-credit') && analysisState !== 'upload'" class="analysis-flow">
        <!-- 顶部步骤条 -->
        <div class="steps-header">
          <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
            <el-step title="上传报告文件" />
            <el-step title="提取报告内容" />
            <el-step title="AI分析报告" />
            <el-step title="报告分析结果" />
        </el-steps>
        </div>
        
        <!-- 提取内容步骤 - 左右分栏显示原文件和提取文字 -->
        <div v-if="activeStep === 2 || activeStep === 3" class="extraction-container">
          <div class="extraction-layout">
            <!-- 左侧显示原文件 -->
            <div class="original-file">
              <div class="panel-header">
                <h3>原始文件</h3>
                <span class="file-name">{{ fileList[0]?.name || '未知文件' }}</span>
              </div>
              <div class="panel-content">
                <div v-if="filePreviewUrl" class="file-preview">
                  <img v-if="isImageFile" :src="filePreviewUrl" alt="文件预览" />
                  <iframe v-else :src="filePreviewUrl" frameborder="0"></iframe>
                </div>
                <div v-else class="file-placeholder">
                  <el-icon><Document /></el-icon>
                  <p>文件加载中...</p>
                </div>
        </div>
      </div>
      
            <!-- 右侧显示提取的文字 -->
            <div class="extracted-text">
              <div class="panel-header">
                <h3>提取的文字</h3>
                <el-progress class="mini-progress" :percentage="extractionProgress" :stroke-width="4" />
              </div>
              <div class="panel-content">
                <div v-if="extractedText" class="text-content">
                  {{ extractedText }}
                </div>
                <div v-else class="text-placeholder">
                  <p>正在提取文字，请稍候...</p>
                </div>
              </div>
        </div>
        
            <!-- 提取完成后的蒙层 - 仅在AI分析阶段显示 -->
            <div v-if="activeStep === 3" class="extraction-overlay">
              <div class="overlay-content">
                <div class="loading-animation">
                  <div class="loading-spinner"></div>
                </div>
                <p class="overlay-message">AI正在分析您上传的征信报告...</p>
                <p class="overlay-timer">已耗时 {{ analysisTimer }} 秒</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分析结果步骤 - 多区域布局 -->
        <div v-if="activeStep === 4 && messages.length > 0 && analysisCompleted" class="result-container">
          <div class="result-layout">
            <!-- 左侧分析结果区域 -->
            <div class="result-left">
              <div class="panel-header">
                <h3>征信报告AI分析结果 <span v-if="analysisDuration > 0" class="analysis-duration">耗时{{analysisDuration}}秒</span></h3>
                <div class="header-actions">
                  <el-button size="small" type="primary" class="action-button" @click="downloadResult">
                    <el-icon><Download /></el-icon> 下载分析结果
                  </el-button>
                  <el-button size="small" type="warning" class="action-button" @click="resetAnalysis">
                    <el-icon><Upload /></el-icon> 重新上传报告
                  </el-button>
                </div>
              </div>
              <div class="panel-content">
        <div class="result-content markdown-content" v-html="renderMarkdown(messages[messages.length - 1].content)"></div>
              </div>
      </div>
      
            <!-- 右侧区域 -->
            <div class="result-right">
              <!-- 上方原始文件区域 -->
              <div class="result-file">
                <div class="panel-header">
                  <h3>用户征信报告</h3>
                  <div class="header-actions">
                    <el-button-group>
                      <el-button 
                        size="small"
                        class="action-button"
                        :type="showOriginalFile ? 'primary' : 'default'"
                        @click="showOriginalFile = true">
                        <el-icon><Document /></el-icon> 显示原文件
                      </el-button>
                      <el-button 
                        size="small"
                        class="action-button"
                        :type="!showOriginalFile ? 'primary' : 'default'"
                        @click="showOriginalFile = false">
                        <el-icon><Reading /></el-icon> 显示提取结果
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
                <div class="panel-content">
                  <div v-if="showOriginalFile && filePreviewUrl" class="file-preview">
                    <img v-if="isImageFile" :src="filePreviewUrl" alt="文件预览" />
                    <iframe v-else :src="filePreviewUrl" frameborder="0"></iframe>
                  </div>
                  <div v-else-if="!showOriginalFile && extractedText" class="text-content">
                    {{ extractedText }}
                  </div>
                </div>
              </div>
              
              <!-- 下方对话区域 -->
              <div class="result-chat">
                <div class="panel-header">
                  <h3>
                    继续向AI咨询
                    <span v-if="followupThinkingTimer > 0" class="thinking-status">
                      AI正在准备回答中{{followupThinkingDots}}，{{followupThinkingTimer}}秒
                    </span>
                    <span v-else-if="followupResponseStatus" class="response-status">
                      {{followupResponseStatus}} 耗时{{followupResponseTime}}秒
                    </span>
                  </h3>
                </div>
                <div class="panel-content chat-messages">
                  <div v-for="(message, index) in followupMessages" 
                       :key="index" 
                       :class="['message', message.role]">
                    <div class="message-content">
                      <div v-if="message.role === 'assistant'" class="ai-avatar">AI</div>
                      <div class="text" v-if="message.role === 'user'">{{ message.content }}</div>
                      <div class="text markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
                    </div>
                  </div>
                </div>
                <div class="chat-input">
                  <el-input
                    v-model="followupInput"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入您要咨询的内容..."
                    @keydown.enter.exact.prevent="sendFollowupMessage"
                    @keydown.shift.enter.exact="handleShiftEnter"
                  />
                  <el-button 
                    type="primary" 
                    :loading="followupLoading"
                    @click="sendFollowupMessage">
                    发送
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 可调整大小的分隔线 -->
            <div class="resizer-horizontal" @mousedown="startResizeHorizontal"></div>
            <div class="resizer-vertical" @mousedown="startResizeVertical"></div>
          </div>
        </div>
      </div>
      
      <!-- 常规聊天消息区域 - 仅在非征信分析页面显示 -->
      <div v-if="chatType !== 'personal-credit' && chatType !== 'business-credit'" class="messages">
        <div v-for="(message, index) in messages" 
             :key="index" 
             :class="['message', message.role]">
          <div class="message-content">
            <div v-if="message.role === 'assistant'" class="ai-avatar">AI</div>
            <div class="text" v-if="message.role === 'user'">{{ message.content }}</div>
            <div class="text markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 - 仅在非征信分析页面显示 -->
    <div class="input-area" v-if="chatType !== 'personal-credit' && chatType !== 'business-credit'">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        :placeholder="getPlaceholder"
        @keyup.enter.ctrl="sendMessage"
      />
      <el-button 
        type="primary" 
        :loading="loading"
        @click="sendMessage">
        发送
      </el-button>
    </div>
  </div>
</template>

<script>
import { sendMessage, uploadPDFFile } from '../api/chat'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Upload, Document, Check, Delete, CaretRight, RefreshLeft, Download, Reading } from '@element-plus/icons-vue'

export default {
  name: 'AIChat',
  components: {
    Upload,
    Document,
    Check,
    Delete,
    CaretRight,
    RefreshLeft,
    Download,
    Reading
  },
  props: {
    chatType: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      messages: [],
      userInput: '',
      loading: false,
      fileList: [],
      uploading: false,
      analysisState: 'upload', // 'upload', 'analyzing', 'result'
      activeStep: 1,
      analysisProgress: 0,
      extractionProgress: 0,
      progressInterval: null,
      extractionInterval: null,
      progressMessage: 'AI正在分析您的征信报告，请稍候...',
      isDragover: false,
      filePreviewUrl: null,
      isImageFile: false,
      extractedText: '',
      analysisStartTime: 0,
      analysisEndTime: 0,
      analysisDuration: 0,
      analysisTimerInterval: null,
      followupMessages: [],
      followupInput: '',
      followupLoading: false,
      horizontalSplit: 50,
      verticalSplit: 50,
      isResizingHorizontal: false,
      isResizingVertical: false,
      analysisCompleted: false,
      resizeThrottleTimeout: null,
      lastResizeTime: 0,
      isTaskCancelled: false,
      cancelTokenSource: null,
      analysisTimer: 0,
      showOriginalFile: true,
      followupThinkingTimer: 0,
      followupThinkingInterval: null,
      followupThinkingDots: '',
      followupResponseStatus: '',
      followupResponseTime: 0
    }
  },
  computed: {
    getPlaceholder() {
      const placeholders = {
        'personal-credit': '请输入您的个人征信相关问题...',
        'business-credit': '请输入您的企业征信相关问题...',
        'property-advice': '请描述您的置业需求...',
        'finance-advice': '请描述您的融资需求...'
      }
      return placeholders[this.chatType] || '请输入您的问题...'
    }
  },
  methods: {
    renderMarkdown(text) {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      })
      
      const rawHtml = marked(text)
      const cleanHtml = DOMPurify.sanitize(rawHtml)
      
      return cleanHtml
    },
    handleFileChange(file) {
      const isLt10M = file.size / 1024 / 1024 < 10
      
      if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
        this.fileList = []
        return
      }
      
      const fileType = file.name.split('.').pop().toLowerCase()
      const allowedTypes = ['pdf']
      
      if (!allowedTypes.includes(fileType)) {
        ElMessage.error('只支持PDF格式!')
        this.fileList = []
        return
      }
      
      this.fileList = [file]
      this.isDragover = false
    },
    handleFileRemove() {
      this.fileList = []
    },
    resetFileList() {
      this.fileList = []
    },
    handleFileDrop(e) {
      this.isDragover = false
      const files = e.dataTransfer.files
      
      if (files.length === 0) return
      
      const file = files[0]
      
      const fileType = file.name.split('.').pop().toLowerCase()
      const allowedTypes = ['pdf']
      
      if (!allowedTypes.includes(fileType)) {
        ElMessage.error('只支持PDF格式!')
        return
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
        return
      }
      
      const fileListItem = {
        name: file.name,
        size: file.size,
        raw: file
      }
      
      this.fileList = [fileListItem]
    },
    async uploadFile() {
      if (this.fileList.length === 0) {
        ElMessage.warning('请先选择文件')
        return
      }
      
      this.uploading = true
      this.analysisCompleted = false
      this.isTaskCancelled = false
      
      try {
        const file = this.fileList[0].raw
        const fileName = file.name
        const fileType = file.type
        
        console.log('准备上传文件:', fileName, '类型:', fileType, '大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
        
        this.analysisState = 'analyzing'
        this.activeStep = 1
        
        this.createFilePreview(file)
        
        // 第一步：上传文件
        setTimeout(() => {
          if (this.isTaskCancelled) return
          
          this.activeStep = 2 // 进入第二步：提取报告内容
          this.startExtractionAnimation()
          
        const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
          const isImage = fileType.startsWith('image/')
          
          if (isPDF || isImage) {
            try {
              console.log(`开始上传${isPDF ? 'PDF' : '图片'}文件...`)
              
              // 创建一个FormData对象
              const formData = new FormData()
              formData.append('file', file)
              formData.append('chatType', this.chatType)
              
              // 发送请求到服务器提取文本
              fetch('/api/extract-text', {
                method: 'POST',
                body: formData,
                // 不设置超时，使用服务器端的超时控制
              })
              .then(response => {
                if (this.isTaskCancelled) return
                
                if (!response.ok) {
                  // 处理HTTP错误状态
                  if (response.status === 504) {
                    throw new Error('请求超时，文件可能过大或服务器处理时间过长')
                  } else if (response.status === 413) {
                    throw new Error('文件大小超过限制（20MB）')
                  } else {
                    return response.text().then(text => {
                      try {
                        // 尝试解析JSON
                        const errorData = JSON.parse(text)
                        throw new Error(errorData.error || `服务器错误 (${response.status})`)
                      } catch (e) {
                        // 如果不是JSON，直接使用文本
                        throw new Error(`服务器错误 (${response.status}): ${text.substring(0, 100)}`)
                      }
                    })
                  }
                }
                return response.json()
              })
              .then(data => {
                if (this.isTaskCancelled) return
                
                if (data.success) {
                  // 显示提取的文本
                  this.extractedText = data.text
                  console.log('提取的文本长度:', this.extractedText.length)
                  this.extractionProgress = 100
                  
                  // 延迟进入下一步
                  setTimeout(() => {
                    if (this.isTaskCancelled) return
                    
                    // 进入AI分析阶段，显示蒙层
                    this.activeStep = 3
                    // 启动分析计时器
                    this.startAnalysisTimer()
                    
                    // 调用API进行分析
                    uploadPDFFile(file, this.chatType).then(response => {
                      if (this.isTaskCancelled) return
                      
                      console.log(`${isPDF ? 'PDF' : '图片'}上传成功，获取到响应:`, response)
                      
            const userMessage = {
              role: 'user',
                        content: `我上传了征信报告${isPDF ? 'PDF文件' : '图片'}：${fileName}，请帮我分析。`
            }
            
            this.messages.push(userMessage)
            this.messages.push(response)
            
                      // 确保只有在成功获取AI分析结果后才更新状态
                      this.$nextTick(() => {
                        if (this.isTaskCancelled) return
                        
                        this.analysisCompleted = true
            this.analysisState = 'result'
            this.activeStep = 4
                        this.stopAnalysisTimer()
                        this.scrollToBottom()
                      })
                    }).catch(error => {
                      if (this.isTaskCancelled) return
                      
                      console.error(`${isPDF ? 'PDF' : '图片'}处理错误详情:`, error)
                      const errorMessage = error.message || '未知错误'
                      ElMessage.error(`${isPDF ? 'PDF' : '图片'}处理失败: ${errorMessage}`)
            this.resetAnalysis()
                    })
                  }, 2000)
        } else {
                  throw new Error(data.error || '文本提取失败')
                }
              })
              .catch(error => {
                if (this.isTaskCancelled) return
                
                // 处理网络错误、超时等
                let errorMessage = error.message || '未知错误'
                
                // 特殊处理常见错误
                if (error.name === 'AbortError') {
                  errorMessage = '请求超时，文件可能过大或网络连接不稳定'
                } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                  errorMessage = '网络连接错误，请检查您的网络连接'
                } else if (errorMessage.includes('SyntaxError')) {
                  errorMessage = '服务器返回了无效的数据格式'
                }
                
                console.error('文本提取错误:', error)
                ElMessage.error(`文本提取失败: ${errorMessage}`)
                this.resetAnalysis()
              })
      } catch (error) {
              if (this.isTaskCancelled) return
              
              console.error(`${isPDF ? 'PDF' : '图片'}处理错误详情:`, error)
              ElMessage.error(`${isPDF ? 'PDF' : '图片'}处理失败: ${error.message || '未知错误'}`)
        this.resetAnalysis()
            }
          } else {
            ElMessage.error('不支持的文件类型，请上传PDF或图片文件')
            this.resetAnalysis()
          }
        }, 1000)
      } catch (error) {
        if (!this.isTaskCancelled) {
          console.error('文件上传过程中发生错误:', error)
          ElMessage.error(`文件上传失败: ${error.message || '未知错误'}`)
          this.resetAnalysis()
        }
      } finally {
        this.uploading = false
      }
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return

      const userMessage = {
        role: 'user',
        content: this.userInput.trim()
      }

      this.messages.push(userMessage)
      this.userInput = ''
      this.loading = true

      try {
        const response = await sendMessage(this.messages, this.chatType)
        this.messages.push(response)
      } catch (error) {
        ElMessage.error('发送消息失败，请重试')
      } finally {
        this.loading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    scrollToBottom() {
      const container = this.$refs.chatContainer
      if (container) {
      container.scrollTop = container.scrollHeight
      }
    },
    resetAnalysis() {
      this.analysisState = 'upload'
      this.activeStep = 1
      this.analysisProgress = 0
      this.extractionProgress = 0
      this.messages = []
      this.extractedText = ''
      this.followupMessages = []
      this.followupInput = ''
      this.analysisCompleted = false
      this.fileList = []
      this.isTaskCancelled = false
      
      if (this.filePreviewUrl) {
        URL.revokeObjectURL(this.filePreviewUrl)
        this.filePreviewUrl = null
      }
      
      this.stopProgressAnimation()
      this.stopExtractionAnimation()
      this.stopAnalysisTimer()
      this.analysisTimer = 0
    },
    startProgressAnimation() {
      this.stopProgressAnimation()
      
      this.analysisProgress = 0
      this.progressInterval = setInterval(() => {
        let increment = 0
        
        if (this.activeStep === 1) {
          increment = Math.random() * 8
          if (this.analysisProgress >= 25) {
            this.activeStep = 2
            this.progressMessage = '正在提取文件内容...'
          }
        } else if (this.activeStep === 2) {
          increment = Math.random() * 4
          if (this.analysisProgress >= 50) {
            this.activeStep = 3
            this.progressMessage = '正在分析征信数据...'
          }
        } else if (this.activeStep === 3) {
          increment = Math.random() * 2
          if (this.analysisProgress >= 85) {
            this.activeStep = 4
            this.progressMessage = '正在生成分析报告...'
          }
        } else {
          increment = Math.random() * 1
        }
        
        if (this.analysisProgress < 95) {
          this.analysisProgress += increment
          if (this.analysisProgress > 95) {
            this.analysisProgress = 95
          }
        }
      }, 800)
    },
    stopProgressAnimation() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval)
        this.progressInterval = null
      }
    },
    createFilePreview(file) {
      if (this.filePreviewUrl) {
        URL.revokeObjectURL(this.filePreviewUrl)
      }
      
      this.filePreviewUrl = URL.createObjectURL(file)
      
      this.isImageFile = file.type.startsWith('image/')
    },
    startExtractionAnimation() {
      this.stopExtractionAnimation()
      
      this.extractionProgress = 0
      this.extractedText = ''
      
      this.extractionInterval = setInterval(() => {
        if (this.extractionProgress < 95) {
          this.extractionProgress += Math.random() * 5
          if (this.extractionProgress > 95) {
            this.extractionProgress = 95
          }
          
          if (this.extractionProgress > 20 && !this.extractedText) {
            this.extractedText = '正在提取文本...'
          }
          
          if (this.extractionProgress > 50 && this.extractedText === '正在提取文本...') {
            this.extractedText = '正在提取文本...\n\n已提取部分内容，继续处理中...'
          }
        }
      }, 200)
    },
    stopExtractionAnimation() {
      if (this.extractionInterval) {
        clearInterval(this.extractionInterval)
        this.extractionInterval = null
      }
    },
    startAnalysisTimer() {
      this.analysisTimer = 0
      this.analysisStartTime = Date.now()
      this.analysisTimerInterval = setInterval(() => {
        this.analysisTimer++
      }, 1000)
    },
    stopAnalysisTimer() {
      if (this.analysisTimerInterval) {
        clearInterval(this.analysisTimerInterval)
        this.analysisTimerInterval = null
        this.analysisEndTime = Date.now()
        this.analysisDuration = Math.round((this.analysisEndTime - this.analysisStartTime) / 1000)
      }
    },
    startFollowupThinking() {
      this.followupThinkingTimer = 0
      this.followupThinkingDots = ''
      this.followupResponseStatus = ''
      this.followupResponseTime = 0
      
      // 启动计时器
      this.followupThinkingInterval = setInterval(() => {
        this.followupThinkingTimer++
        // 动态更新省略号
        this.followupThinkingDots = '.'.repeat((this.followupThinkingTimer % 3) + 1)
      }, 1000)
    },
    
    stopFollowupThinking(status = 'success', error = '') {
      if (this.followupThinkingInterval) {
        clearInterval(this.followupThinkingInterval)
        this.followupThinkingInterval = null
        this.followupResponseTime = this.followupThinkingTimer
        this.followupThinkingTimer = 0
        this.followupThinkingDots = ''
        
        // 设置响应状态
        if (status === 'success') {
          this.followupResponseStatus = 'AI已回复'
        } else {
          this.followupResponseStatus = error || '请求失败'
        }
      }
    },
    
    async sendFollowupMessage() {
      if (!this.followupInput.trim() || this.followupLoading) return
      
      const userMessage = {
        role: 'user',
        content: this.followupInput.trim()
      }
      
      this.followupMessages.push(userMessage)
      this.followupInput = ''
      this.followupLoading = true
      
      // 启动思考状态显示
      this.startFollowupThinking()
      
      try {
        const contextMessages = [
          {
            role: 'system',
            content: '请结合本次对话刚开始时提供的待分析的内容，继续回答'
          },
          ...this.messages,
          userMessage
        ]
        
        const response = await sendMessage(contextMessages, 'followup-chat')
        this.followupMessages.push(response)
        // 成功获取回复
        this.stopFollowupThinking('success')
      } catch (error) {
        // 发生错误
        this.stopFollowupThinking('error', error.message || '发送消息失败，请重试')
        ElMessage.error('发送消息失败，请重试')
      } finally {
        this.followupLoading = false
        this.$nextTick(() => {
          const chatMessages = document.querySelector('.chat-messages')
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight
          }
        })
      }
    },
    
    // 处理Shift+Enter键，用于换行
    handleShiftEnter(e) {
      // 不阻止默认行为，允许换行
    },
    async downloadResult() {
      try {
        const content = document.querySelector('.result-content')
        if (!content) {
          throw new Error('未找到分析结果内容')
        }

        // 获取原始markdown文本
        const markdownContent = this.messages[this.messages.length - 1].content

        // 添加标题和元信息
        const header = `# 征信报告分析结果\n\n` +
          `- 生成时间：${new Date().toLocaleString()}\n` +
          `- 分析耗时：${this.analysisDuration}秒\n\n` +
          `---\n\n`

        const fullContent = header + markdownContent

        // 创建Blob对象
        const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' })

        // 创建下载链接
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `征信报告分析结果_${new Date().toISOString().slice(0, 10)}.md`

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 清理URL对象
        URL.revokeObjectURL(link.href)

        ElMessage.success('分析结果已下载')
      } catch (error) {
        console.error('下载分析结果时出错:', error)
        ElMessage.error('下载失败，请重试')
      }
    },
    startResizeHorizontal(e) {
      this.isResizingHorizontal = true
      document.addEventListener('mousemove', this.resizeHorizontal)
      document.addEventListener('mouseup', this.stopResizeHorizontal)
      e.preventDefault()
    },
    resizeHorizontal(e) {
      if (!this.isResizingHorizontal) return
      
      const now = Date.now()
      if (now - this.lastResizeTime < 16) { // 约60fps
        return
      }
      this.lastResizeTime = now
      
      if (this.resizeThrottleTimeout) {
        return
      }
      
      this.resizeThrottleTimeout = setTimeout(() => {
        const container = document.querySelector('.result-layout')
        if (!container) return
        
        const containerRect = container.getBoundingClientRect()
        const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100
        
        if (percentage > 20 && percentage < 80) {
          requestAnimationFrame(() => {
            this.horizontalSplit = percentage
            document.documentElement.style.setProperty('--horizontal-split', `${this.horizontalSplit}%`)
          })
        }
        
        this.resizeThrottleTimeout = null
      }, 16) // 约60fps
    },
    stopResizeHorizontal() {
      this.isResizingHorizontal = false
      document.removeEventListener('mousemove', this.resizeHorizontal)
      document.removeEventListener('mouseup', this.stopResizeHorizontal)
    },
    startResizeVertical(e) {
      this.isResizingVertical = true
      document.addEventListener('mousemove', this.resizeVertical)
      document.addEventListener('mouseup', this.stopResizeVertical)
      e.preventDefault()
    },
    resizeVertical(e) {
      if (!this.isResizingVertical) return
      
      const now = Date.now()
      if (now - this.lastResizeTime < 16) {
        return
      }
      this.lastResizeTime = now
      
      if (this.resizeThrottleTimeout) {
        return
      }
      
      this.resizeThrottleTimeout = setTimeout(() => {
        const container = document.querySelector('.result-right')
        if (!container) return
        
        const containerRect = container.getBoundingClientRect()
        const percentage = ((e.clientY - containerRect.top) / containerRect.height) * 100
        
        if (percentage > 20 && percentage < 80) {
          requestAnimationFrame(() => {
            this.verticalSplit = percentage
            document.documentElement.style.setProperty('--vertical-split', `${this.verticalSplit}%`)
          })
        }
        
        this.resizeThrottleTimeout = null
      }, 16)
    },
    stopResizeVertical() {
      this.isResizingVertical = false
      document.removeEventListener('mousemove', this.resizeVertical)
      document.removeEventListener('mouseup', this.stopResizeVertical)
    },
    // 中止当前任务
    cancelCurrentTask() {
      this.isTaskCancelled = true;
      
      // 如果有取消令牌，则取消请求
      if (this.cancelTokenSource) {
        this.cancelTokenSource.cancel('用户取消了操作');
        this.cancelTokenSource = null;
      }
      
      // 停止所有动画和计时器
      this.stopProgressAnimation();
      this.stopExtractionAnimation();
      this.stopAnalysisTimer();
      
      // 中止所有正在进行的fetch请求
      // 由于fetch API不支持直接取消，我们通过标记来控制后续处理
      
      // 重置状态
      this.analysisState = 'upload';
      this.activeStep = 1;
      this.analysisProgress = 0;
      this.extractionProgress = 0;
      this.extractedText = '';
      this.followupMessages = [];
      this.followupInput = '';
      this.analysisCompleted = false;
      
      // 在控制台输出中止成功消息
      console.log('任务中止成功');
      
      // 显示提示消息
      ElMessage({
        message: '任务已成功中止',
        type: 'success',
        duration: 2000
      });
    },
    
    // 设置页面头部返回按钮的事件监听
    setupBackButtonListener() {
      // 使用MutationObserver监听DOM变化，确保能捕获到动态添加的返回按钮
      const observer = new MutationObserver((mutations) => {
        const backButton = document.querySelector('.el-page-header__back')
        if (backButton && !backButton._hasListener && this.chatType === 'personal-credit' && this.analysisState !== 'upload') {
          backButton._hasListener = true
          backButton.addEventListener('click', this.handleBackButtonClick)
        }
      })
      
      observer.observe(document.body, { childList: true, subtree: true })
      
      // 初始检查
      setTimeout(() => {
        const backButton = document.querySelector('.el-page-header__back')
        if (backButton && !backButton._hasListener && this.chatType === 'personal-credit' && this.analysisState !== 'upload') {
          backButton._hasListener = true
          backButton.addEventListener('click', this.handleBackButtonClick)
        }
      }, 500)
      
      // 保存observer引用以便在组件销毁时断开连接
      this._backButtonObserver = observer
    },
    
    // 处理页面头部返回按钮点击
    handleBackButtonClick(event) {
      // 只在非上传状态时处理
      if (this.chatType === 'personal-credit' && this.analysisState !== 'upload') {
        event.preventDefault()
        event.stopPropagation()
        
        // 确认是否要中止当前任务
        ElMessageBox.confirm('确定要返回上传页面吗？当前任务将被中止。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 用户确认中止任务
          this.cancelCurrentTask()
          this.resetAnalysis()
        }).catch(() => {
          // 用户取消操作
          console.log('用户取消了返回操作')
        })
        
        return false
      }
    },
  },
  mounted() {
    document.documentElement.style.setProperty('--horizontal-split', `${this.horizontalSplit}%`)
    document.documentElement.style.setProperty('--vertical-split', `${this.verticalSplit}%`)
    
    // 添加对页面头部返回按钮的事件监听
    this.setupBackButtonListener()
  },
  beforeUnmount() {
    this.stopProgressAnimation()
    this.stopExtractionAnimation()
    this.stopAnalysisTimer()
    
    document.removeEventListener('mousemove', this.resizeHorizontal)
    document.removeEventListener('mouseup', this.stopResizeHorizontal)
    document.removeEventListener('mousemove', this.resizeVertical)
    document.removeEventListener('mouseup', this.stopResizeVertical)
    
    // 移除返回按钮的事件监听
    const backButton = document.querySelector('.el-page-header__back')
    if (backButton && backButton._hasListener) {
      backButton.removeEventListener('click', this.handleBackButtonClick)
    }
    
    // 断开MutationObserver连接
    if (this._backButtonObserver) {
      this._backButtonObserver.disconnect()
    }
    
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl)
    }
    
    // 清理节流定时器
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout)
    }
    
    this.stopFollowupThinking()
  }
}
</script>

<style scoped>
/* 步骤条自定义样式 */
:deep(.el-steps--simple) {
  background-color: #ffffff !important;
}

:deep(.el-step__head.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

:deep(.el-step__title.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}


.ai-chat {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  position: relative;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
  background: white;
}

.messages {
  max-width: 1000px;
  margin: 0 auto;
}

.message {
  margin-bottom: 20px;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message.user .message-content {
  justify-content: flex-end;
}

.ai-avatar {
  width: 32px;
  height: 32px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.text {
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
  line-height: 1.5;
}

.message.assistant .text {
  background: #f5f7fa;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.message.user .text {
  background: #409EFF;
  color: white;
}

.input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 16px;
}

.input-area :deep(.el-textarea__inner) {
  resize: none;
}

.input-area .el-button {
  align-self: flex-end;
}

.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 0;
}

.upload-layout {
  display: flex;
  min-height: 350px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.upload-main {
  flex: 2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.upload-title {
  font-size: 20px;
  margin: 0 0 24px 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.upload-sidebar {
  flex: 1;
  background: #f5f7fa;
  padding: 24px;
  border-left: 1px solid #ebeef5;
}

.upload-dropzone {
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  background: #fafafa;
  position: relative;
  margin-bottom: 20px;
}

.upload-dropzone:hover {
  background-color: #edf4fe;
}

.upload-dropzone.is-dragover {
  border-color: #409EFF;
  background: #ecf5ff;
}

.upload-dropzone.has-file {
  border-color: #67C23A;
  background: #f0f9eb;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
  display: block;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  padding: 40px 20px;
  background: transparent;
  border: none;
}


.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-content .upload-icon {
  font-size: 48px;
  color: #409EFF;
  margin: 0;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.upload-text em {
  color: #1b68de;
  font-style: normal;
  text-decoration: underline;
}

.upload-text strong {
  color: #67C23A;
}

.upload-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-button {
  height: 34px !important;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.upload-instructions {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-instructions h3 {
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #303133;
}

.upload-instructions ul {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.upload-instructions li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
}

.upload-instructions li .el-icon {
  color: #67C23A;
}

.upload-alert {
  margin-top: auto;
}

.analysis-flow {
  width: 100%;
}

.steps-header {
  /* padding: 16px 20px; */
  border-bottom: 1px solid #ebeef5;
  background-color: white;
}

.extraction-container {
  padding: 0;
  position: relative;
}

.extraction-layout {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 400px;
}

.original-file, .extracted-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.original-file {
  border-right: 1px solid #ebeef5;
}

.panel-header {
  padding: 0 16px;
  height: 50px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f7fa;
  z-index: 1;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.file-name {
  font-size: 14px;
  color: #909399;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-progress {
  width: 120px;
}

.mini-progress :deep(.el-progress-bar__outer) {
  background-color: #e9ecef;
  border-radius: 4px;
}

.mini-progress :deep(.el-progress-bar__inner) {
  background-color: #409EFF;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  position: relative;
}

.file-preview {
  height: 100%;
  overflow: auto;
}

.file-preview img {
  max-width: 100%;
  display: block;
}

.file-preview iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.file-placeholder, .text-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.file-placeholder .el-icon, .text-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.text-content {
  padding: 16px;
  white-space: pre-wrap;
  font-family: monospace;
  line-height: 1.5;
}

.result-container {
  padding: 0;
  height: calc(100vh - 120px);
}

.result-layout {
  display: grid;
  grid-template-columns: var(--horizontal-split) 1fr;
  height: 100%;
  position: relative;
}

.result-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
}

.result-right {
  display: grid;
  grid-template-rows: var(--vertical-split) 1fr;
  overflow: hidden;
}

.result-file, .result-chat {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-file {
  border-bottom: 1px solid #dcdfe6;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chat-messages {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
  
  .el-textarea {
    flex: 1;
  }
  
  .el-button {
    height: auto;
    align-self: stretch;
  }
}

.resizer-horizontal {
  position: absolute;
  top: 0;
  left: var(--horizontal-split);
  width: 6px;
  height: 100%;
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  transform: translateX(-3px);
}

.resizer-horizontal:hover, .resizer-horizontal:active {
  background-color: rgba(64, 158, 255, 0.2);
}

.resizer-vertical {
  position: absolute;
  top: var(--vertical-split);
  left: var(--horizontal-split);
  width: calc(100% - var(--horizontal-split));
  height: 6px;
  background-color: transparent;
  cursor: row-resize;
  z-index: 10;
  transform: translateY(-3px);
}

.resizer-vertical:hover, .resizer-vertical:active {
  background-color: rgba(64, 158, 255, 0.2);
}

.message {
  margin-bottom: 16px;
  max-width: 90%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ai-avatar {
  width: 28px;
  height: 28px;
  background: #1b68de;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 12px;
}

.text {
  padding: 10px 12px;
  border-radius: 6px;
  line-height: 1.5;
}

.message.assistant .text {
  background: #f8f7f5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.message.user .text {
  background: #f8f7f5;
  color: black;
  white-space: pre-wrap;
}

/* Markdown样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.2em;
}

.markdown-content :deep(p) {
  margin-top: 0;
  margin-bottom: 10px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-content :deep(li) {
  margin-bottom: 4px;
}

.markdown-content :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.markdown-content :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-content :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
  word-break: normal;
  white-space: pre;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-content :deep(table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-content :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.markdown-content :deep(blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.markdown-content :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

.markdown-content :deep(.red),
.markdown-content :deep(span[style*="color:red"]),
.markdown-content :deep(span[style*="color: red"]) {
  color: #f56c6c !important;
  font-weight: bold;
}

.extraction-overlay {
  position: absolute;
  top: 50px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background-color: rgba(20, 20, 20, 0.7);
}

.overlay-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.overlay-message {
  color: #fff;
  font-size: 14px;
  margin: 0;
  white-space: nowrap;
}

.overlay-timer {
  color: #fff;
  font-size: 12px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.back-button {
  display: none;
}

.analysis-duration {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

.thinking-status {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
}

.thinking-status::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #1b5dd3;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 1s infinite;
}

.response-status {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style> 