<template>
  <div class="credit-report-analyse">
    <div class="chat-container" ref="chatContainer">
      <!-- 文件上传提示区域 - 仅在个人征信分析页面显示且处于上传状态 -->
      <div v-if="(chatType === 'personal-credit' || chatType === 'business-credit') && analysisState === 'upload'" class="upload-container">
        <div class="upload-layout">
          <!-- 左侧上传区域 -->
          <div class="upload-main">
            <h2 class="upload-title"><el-icon><Document /></el-icon> 请上传{{ chatType === 'personal-credit' ? '个人' : '企业' }}征信报告</h2>
            
            <!-- 文件类型选择器 -->
            <div class="file-type-selector">
              <div class="file-type-cards">
                <div 
                  class="file-type-card" 
                  :class="{'active': fileUploadType === 'pdf', 'disabled': fileList.length > 0}"
                  @click="fileList.length === 0 && (fileUploadType = 'pdf')"
                >
                  <div class="file-type-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="file-type-info">
                    <div class="file-type-name">PDF文件</div>
                    <div class="file-type-desc">上传征信报告原版或扫描版文件（建议）</div>
                  </div>
                </div>
                <div 
                  class="file-type-card" 
                  :class="{'active': fileUploadType === 'images', 'disabled': fileList.length > 0}"
                  @click="fileList.length === 0 && (fileUploadType = 'images')"
                >
                  <div class="file-type-icon">
                    <el-icon><Picture /></el-icon>
                  </div>
                  <div class="file-type-info">
                    <div class="file-type-name">图片文件</div>
                    <div class="file-type-desc">上传征信报告的拍照图片文件</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="upload-dropzone" 
                 :class="{'is-dragover': isDragover, 'has-file': fileList.length > 0}"
                 @dragover.prevent="isDragover = true"
                 @dragleave.prevent="isDragover = false"
                 @drop.prevent="handleFileDrop">
              <!-- 右上角清除按钮 -->
              <div v-if="fileList.length > 0" class="clear-files-button" @click.stop="resetFileList">
                <el-icon><Delete /></el-icon>
                <span class="clear-text">清除文件</span>
              </div>
              
        <el-upload
          class="upload-area"
                drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
                :on-remove="handleFileRemove"
          :limit="fileUploadType === 'pdf' ? 1 : 100"
          :file-list="fileList"
          :accept="fileAcceptType"
          :multiple="fileUploadType === 'images'"
          list-type="picture"
          ref="uploadRef"
          :show-file-list="false"
        >
                <div class="upload-content">
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="upload-text">
                    <span v-if="fileList.length === 0">拖拽文件到此处或 <em>点击上传</em></span>
                    <span v-else>已上传: <strong>{{ fileUploadCountText }}</strong>
                      <em v-if="fileUploadType === 'images' && fileList.length < 100" class="continue-upload-hit">继续上传</em>
                    </span>
                  </div>
                  <div class="upload-hint">
                    <template v-if="fileUploadType === 'pdf'">
                      限PDF单文件，大小不要超过100MB
                    </template>
                    <template v-else>
                      单张图片不要超过10MB，上限100张
                    </template>
                  </div>
                </div>
        </el-upload>
            </div>
            
            <!-- 图片预览区 -->
            <div v-if="fileUploadType === 'images' && fileList.length > 0" class="image-preview-container">
              <h3 class="preview-title">已上传的图片 
                <span class="sort-hint" 
                  v-if="fileUploadType === 'images' && fileList.length > 1">
                  可拖拽图片调整排序
                </span>
                <div class="preview-switch">
                  <span class="switch-label">大图预览</span>
                  <el-switch
                    v-model="previewEnabled"
                    active-text="开"
                    inactive-text="关"
                    inline-prompt
                  />
                </div>
              </h3>
              <div class="image-preview-list">
                <div v-for="(file, index) in fileList" 
                     :key="index" 
                     class="image-preview-item"
                     draggable="true"
                     @dragstart="handleDragStart($event, index)"
                     @dragover.prevent="handleDragOver($event, index)"
                     @drop="handleDrop($event, index)"
                     @dragenter.prevent
                     @dragleave.prevent
                     @mousedown="handleImageMouseDown"
                     @mouseup="handleImageMouseUp">
                  <div class="image-preview-wrapper">
                    <img :src="file.url" 
                        :alt="file.name" 
                        class="preview-image" 
                        @mouseover="showImagePreview(file)" 
                        @mouseleave="hideImagePreview()"/>
                    <div class="image-preview-actions">
                      <el-button type="danger" circle size="small" @click="removeImageAt(index)" 
                        :disabled="uploading" class="remove-image-btn">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <div class="image-preview-index">{{ index + 1 }}</div>
                  </div>
                  <div class="image-preview-name">{{ file.name }}</div>
                </div>
              </div>
            </div>
            
            <!-- 图片悬浮预览 -->
            <div v-if="hoverPreview.show" class="image-hover-preview" :style="hoverPreview.style">
              <img :src="hoverPreview.url" alt="预览" />
              <div class="hover-preview-info">
                <span>{{ hoverPreview.name }}</span>
                <span>{{ hoverPreview.size }}</span>
              </div>
            </div>
            
            <!-- 添加客户姓名输入框 -->
            <div class="customer-name-input">
              <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" @submit.prevent>
                <el-form-item prop="customerName" :rules="[
                  { required: true, message: '请输入客户姓名', trigger: 'blur' },
                  { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
                ]">
                  <el-input 
                    v-model="uploadForm.customerName"
                    placeholder="请输入客户姓名（必填，方便你查询结果）"
                    clearable
                    :disabled="uploading"
                    @keydown.enter.prevent="handleNameEnter"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-form>
            </div>
            
            <div class="upload-actions">
              <el-button 
                type="primary" 
                class="action-button" 
                @click="uploadFile"
                :loading="uploading"
                :disabled="fileList.length === 0"
              >
                <el-icon v-if="!processingImages"><CaretRight /></el-icon>
                <span v-if="!processingImages">开始分析</span>
                <span v-else>图片处理中...{{ processingProgress }}%</span>
              </el-button>
            </div>
      </div>
      
          <!-- 右侧说明区域 -->
          <div class="upload-sidebar">
            <div class="upload-instructions">
              <h3>使用说明</h3>
              <ul>
                <li><el-icon><Check /></el-icon> 请上传客户的PDF征信报告或清晰的报告照片</li>
                <li><el-icon><Check /></el-icon> 支持上传1个PDF文件（不超过100MB）</li>
                <li><el-icon><Check /></el-icon> 或上传最多100张图片文件（每张不超过10MB）</li>
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
                <span class="file-name">
                  {{ fileList?.length ? (fileList[0]?.name + (fileList.length > 1 ? '等' + fileList.length + '个文件' : '')) : '未知文件' }}
                </span>
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
import { Upload, Document, Check, Delete, CaretRight, RefreshLeft, Download, Reading, User, Picture } from '@element-plus/icons-vue'
import { jsPDF } from 'jspdf'

export default {
  name: 'creditReportAnalyse',
  components: {
    Upload,
    Document,
    Check,
    Delete,
    CaretRight,
    RefreshLeft,
    Download,
    Reading,
    User,
    Picture
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
      followupResponseTime: 0,
      uploadForm: {
        customerName: ''
      },
      uploadRules: {
        customerName: [
          { required: true, message: '请输入客户姓名', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
        ]
      },
      uploadFormRef: null,
      fileUploadType: 'pdf',
      mergedPdfFile: null,
      processingImages: false,
      processingProgress: 0,
      hoverPreview: {
        show: false,
        url: '',
        name: '',
        size: '',
        style: {
          top: '0px',
          left: '0px'
        }
      },
      dragIndex: -1,
      previewEnabled: true,
      isDragging: false,
      _fileChangeMessageTimer: null,
      _dropMessageTimer: null,
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
    },
    fileAcceptType() {
      return this.fileUploadType === 'pdf' ? '.pdf' : 'image/*'
    },
    fileUploadCountText() {
      if (this.fileUploadType === 'pdf') {
        return this.fileList.length > 0 ? this.fileList[0].name : ''
      } else {
        return `${this.fileList.length}张图片`
      }
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
    handleFileChange(file, fileList) {
      console.log('文件变更:', file, fileList);
      
      // 使用一个标志来控制批量上传时只显示一次消息
      // 将消息处理推迟到nextTick中，以确保在一个批次中只显示一条消息
      clearTimeout(this._fileChangeMessageTimer);
      
      // 验证当前文件是否为最后一个变更的文件
      // 如果不是最后一个，则只做验证不做提示，等最后一个文件时统一处理
      const isLastFile = file.uid === fileList[fileList.length - 1].uid;
      
      // 验证文件类型
      const isPdf = file.raw.type === 'application/pdf'
      const isImage = file.raw.type.startsWith('image/')
      
      // 验证文件与当前选择的上传类型是否匹配
      if (this.fileUploadType === 'pdf' && !isPdf) {
        ElMessage.error('请上传PDF格式的文件!')
        this.fileList = this.fileList.filter(f => f.uid !== file.uid)
        return false
      }
      
      if (this.fileUploadType === 'images' && !isImage) {
        ElMessage.error('请上传图片格式的文件!')
        this.fileList = this.fileList.filter(f => f.uid !== file.uid)
        return false
      }
      
      // 验证文件大小
      const maxSize = this.fileUploadType === 'pdf' ? 100 : 10 // PDF 100MB, 图片 10MB
      const isFileSizeValid = file.size / 1024 / 1024 < maxSize
      
      if (!isFileSizeValid) {
        const sizeLimit = this.fileUploadType === 'pdf' ? '100MB' : '10MB'
        ElMessage.error(`文件大小不能超过${sizeLimit}!`)
        this.fileList = this.fileList.filter(f => f.uid !== file.uid)
        return false
      }
      
      // 处理超出数量限制的文件
      if (this.fileUploadType === 'pdf' && fileList.length > 1) {
        // 对于PDF，只保留最后一个文件
        this.fileList = [fileList[fileList.length - 1]];
        
        // 提示用户，只在最后一个文件时提示
        if (isLastFile) {
          this._fileChangeMessageTimer = setTimeout(() => {
            ElMessage.warning(`只能上传1个PDF文件，已上传最后选中的文件。`);
          }, 0);
        }
      } else if (this.fileUploadType === 'images') {
        // 对于图片，检查是否超过100张的限制
        if (fileList.length > 100) {
          const droppedCount = fileList.length - 100;
          
          // 只保留前100张图片
          this.fileList = fileList.slice(0, 100);
          
          // 提示用户，只在最后一个文件时提示
          if (isLastFile) {
            this._fileChangeMessageTimer = setTimeout(() => {
              ElMessage.warning(`有${droppedCount}张图片因超出最大上传数量(100张)，不再上传。`);
            }, 0);
          }
        } else {
          // 更新fileList (在限制范围内)
          this.fileList = [...fileList];
          
          // 批量上传完成后的提示，只在最后一个文件时提示
          if (isLastFile) {
            // 获取本次批量上传的总数量
            const batchAddedFiles = fileList.filter(f => {
              // 使用时间戳前缀作为批次标识，精确到秒
              const now = Math.floor(Date.now() / 1000);
              const fileTime = Math.floor(f.uid / 1000);
              return now - fileTime < 5; // 5秒内上传的视为同一批次
            });
            
            if (batchAddedFiles.length > 0) {
              this._fileChangeMessageTimer = setTimeout(() => {
                // 修改成功消息，使用总数而不是每次都显示单独的消息
                ElMessage.success(`已成功添加 ${batchAddedFiles.length} 张图片`);
              }, 0);
            }
          }
        }
        
        // 为图片创建预览URL，无论是否是最后一个都需要创建预览
        this.fileList.forEach(fileItem => {
          if (!fileItem.url && fileItem.raw) {
            fileItem.url = URL.createObjectURL(fileItem.raw);
          }
        });
      } else {
        // 更新fileList (在限制范围内)
        this.fileList = [...fileList];
        
        // 默认成功提示，只在最后一个文件时提示
        if (isLastFile && fileList.length > 0) {
          this._fileChangeMessageTimer = setTimeout(() => {
            ElMessage.success(`已成功添加文件`);
          }, 0);
        }
      }
      
      this.isDragover = false
      return true
    },
    handleFileRemove(file) {
      if (this.fileUploadType === 'images' && file.url) {
        URL.revokeObjectURL(file.url)
        
        // 清除悬浮预览，确保当前预览的图片被删除时，预览也会消失
        if (this.hoverPreview.show && this.hoverPreview.url === file.url) {
          this.hideImagePreview();
        }
      }
    },
    removeImageAt(index) {
      if (index >= 0 && index < this.fileList.length) {
        const file = this.fileList[index]
        if (file.url) {
          URL.revokeObjectURL(file.url)
          
          // 清除悬浮预览，确保当前预览的图片被删除时，预览也会消失
          if (this.hoverPreview.show && this.hoverPreview.url === file.url) {
            this.hideImagePreview();
          }
        }
        this.fileList.splice(index, 1)
      }
    },
    resetFileList() {
      // 清理所有图片URL
      this.fileList.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
      })
      this.fileList = []
      
      // 清理合并后的PDF
      if (this.mergedPdfFile) {
        this.mergedPdfFile = null
      }
      
      // 清除悬浮预览
      this.hideImagePreview();
    },
    handleFileDrop(e) {
      this.isDragover = false;
      const files = e.dataTransfer.files;
      
      if (files.length === 0) return;
      
      // 清除任何现有的消息定时器
      clearTimeout(this._dropMessageTimer);
      
      // 检查文件类型和大小
      const validFiles = [];
      const invalidTypeFiles = [];
      const oversizedFiles = [];
      
      const maxSize = this.fileUploadType === 'pdf' ? 100 : 10; // PDF 100MB, 图片 10MB
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPdf = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');
        
        // 验证文件与当前选择的上传类型是否匹配
        if ((this.fileUploadType === 'pdf' && !isPdf) || 
            (this.fileUploadType === 'images' && !isImage)) {
          invalidTypeFiles.push(file);
          continue;
        }
        
        // 验证文件大小
        const isFileSizeValid = file.size / 1024 / 1024 < maxSize;
        
        if (!isFileSizeValid) {
          oversizedFiles.push(file);
          continue;
        }
        
        validFiles.push(file);
      }
      
      // 只显示一条汇总错误信息
      let errorMessages = [];
      
      // 处理文件类型错误的提示
      if (invalidTypeFiles.length > 0) {
        const fileType = this.fileUploadType === 'pdf' ? 'PDF' : '图片';
        errorMessages.push(`${invalidTypeFiles.length}个文件不是${fileType}格式`);
      }
      
      // 处理文件大小超限的提示
      if (oversizedFiles.length > 0) {
        const sizeLimit = this.fileUploadType === 'pdf' ? '100MB' : '10MB';
        errorMessages.push(`${oversizedFiles.length}个文件大小超过${sizeLimit}`);
      }
      
      // 显示汇总错误信息
      if (errorMessages.length > 0) {
        this._dropMessageTimer = setTimeout(() => {
          ElMessage.error(`上传失败：${errorMessages.join('，')}，已忽略`);
        }, 0);
      }
      
      if (validFiles.length === 0) {
        if (errorMessages.length === 0) {
          this._dropMessageTimer = setTimeout(() => {
            ElMessage.error('没有符合要求的文件可以上传');
          }, 0);
        }
        return;
      }
      
      // 处理有效文件
      if (this.fileUploadType === 'pdf') {
        // 对于PDF，只保留一个文件
        if (validFiles.length > 1) {
          this._dropMessageTimer = setTimeout(() => {
            ElMessage.warning(`只能上传1个PDF文件，仅保留了第一个文件。`);
          }, 0);
        }
        
        const file = validFiles[0];
        const fileListItem = {
          name: file.name,
          size: file.size,
          raw: file,
          uid: Date.now()
        };
        
        this.fileList = [fileListItem];
        
        this._dropMessageTimer = setTimeout(() => {
          ElMessage.success(`已成功添加文件 ${file.name}`);
        }, 0);
      } else {
        // 处理图片文件，确保不超过100张
        const currentCount = this.fileList.length;
        let remainingSlots = 100 - currentCount;
        
        if (remainingSlots <= 0) {
          this._dropMessageTimer = setTimeout(() => {
            ElMessage.warning('已达到最大上传数量(100张)，无法继续添加。');
          }, 0);
          return;
        }
        
        // 计算能添加的图片数量
        let filesToAdd = validFiles;
        let droppedCount = 0;
        
        if (validFiles.length > remainingSlots) {
          filesToAdd = validFiles.slice(0, remainingSlots);
          droppedCount = validFiles.length - remainingSlots;
        }
        
        // 添加所有有效图片文件
        const newFiles = filesToAdd.map(file => ({
          name: file.name,
          size: file.size,
          raw: file,
          uid: Date.now() + Math.random(),
          url: URL.createObjectURL(file)
        }));
        
        this.fileList = [...this.fileList, ...newFiles];
        
        // 提示用户
        let messages = [];
        
        // 提示成功添加
        messages.push(`成功添加图片`);
        
        // 如果有文件被丢弃，添加警告信息
        if (droppedCount > 0) {
          messages.push(`${droppedCount}张图片因超出限制不再上传`);
        }
        
        // 显示一条综合提示
        if (messages.length > 0) {
          this._dropMessageTimer = setTimeout(() => {
            if (droppedCount > 0) {
              ElMessage.warning(messages.join('，'));
            } else {
              ElMessage.success(messages[0]);
            }
          }, 0);
        }
      }
    },
    async uploadFile() {
      if (this.fileList.length === 0) {
        ElMessage.warning('请先上传文件')
        return
      }
      
      // 表单验证
      try {
        await this.$refs.uploadFormRef.validate()
      } catch (error) {
        // 表单验证失败，聚焦到客户姓名输入框
        this.$nextTick(() => {
          const customerNameInput = this.$refs.uploadFormRef.$el.querySelector('input')
          if (customerNameInput) {
            customerNameInput.focus()
          }
        })
        return // 表单验证失败，不继续执行
      }

      this.uploading = true
      
      try {
        // 如果是图片模式，需要先将图片合并为PDF
        let fileToUpload = null
        
        if (this.fileUploadType === 'pdf') {
          fileToUpload = this.fileList[0].raw
          this.createFilePreview(fileToUpload)
        } else {
          // 显示处理进度
          this.processingImages = true
          this.processingProgress = 0
          
          // 合并图片为PDF
          fileToUpload = await this.mergeImagesToPdf()
          this.createFilePreview(fileToUpload)
          
          this.processingImages = false
          this.processingProgress = 100
        }
        
        // 在提交给服务器的数据中添加客户姓名
        const formData = new FormData()
        formData.append('file', fileToUpload)
        formData.append('customerName', this.uploadForm.customerName)
        formData.append('taskType', this.chatType)
        
        // 更新分析状态
        this.analysisState = 'processing'
        this.activeStep = 2
        this.startProgressAnimation()
        this.startExtractionAnimation()
        this.startAnalysisTimer()
        
        // 模拟分析过程（在真实应用中替换为实际API调用）
        setTimeout(() => {
          // 提取完成
          this.stopExtractionAnimation()
          this.extractionProgress = 100
          this.extractedText = '征信报告内容已成功提取，正在分析中...'
          
          // 模拟3秒后分析完成
          setTimeout(() => {
            this.stopProgressAnimation()
            this.stopAnalysisTimer()
            this.analysisProgress = 100
            this.analysisCompleted = true
            
            // 模拟分析结果
            let analysisResult
            if (this.chatType === 'personal-credit') {
              analysisResult = `# 个人征信报告分析\n\n## 客户信息\n\n**客户姓名**: ${this.uploadForm.customerName}\n\n## 基本情况\n\n- 信用状况: 良好\n- 逾期情况: 无\n- 贷款总额: 50万元\n\n## 详细分析\n\n您的信用状况整体良好，近两年内无逾期记录...`
            } else if (this.chatType === 'business-credit') {
              analysisResult = `# 企业征信报告分析\n\n## 企业信息\n\n**企业名称**: ${this.uploadForm.customerName}\n\n## 基本情况\n\n- 信用评级: B+\n- 逾期情况: 轻微\n- 贷款总额: 500万元\n\n## 详细分析\n\n贵公司信用状况一般，近期有小额逾期记录...`
            }
            
            this.messages.push({
              role: 'assistant',
              content: analysisResult
            })
          }, 3000)
        }, 2000)
      } catch (error) {
        ElMessage.error('上传失败，请重试')
        console.error(error)
        this.processingImages = false
      } finally {
        this.uploading = false
      }
    },
    // 将图片合并为PDF
    async mergeImagesToPdf() {
      return new Promise(async (resolve, reject) => {
        try {
          // 直接使用fileList的当前顺序（已经是用户调整后的顺序）
          const sortedImages = [...this.fileList];
          
          const totalImages = sortedImages.length;
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px'
          });
          
          // 处理每张图片
          for (let i = 0; i < totalImages; i++) {
            const file = sortedImages[i];
            
            // 更新进度
            this.processingProgress = Math.round((i / totalImages) * 90); // 最多到90%，留10%给最后的PDF生成
            
            // 加载图片
            const imgData = await this.loadImageAsDataURL(file.raw);
            
            // 获取图片尺寸
            const imgProps = await this.getImageDimensions(imgData);
            
            // 不是第一页就添加新页
            if (i > 0) {
              doc.addPage();
            }
            
            // 调整图片适应页面
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;
            
            // 缩放图片以适应页面
            if (imgWidth > pageWidth) {
              const ratio = pageWidth / imgWidth;
              imgWidth = pageWidth;
              imgHeight = imgHeight * ratio;
            }
            
            if (imgHeight > pageHeight) {
              const ratio = pageHeight / imgHeight;
              imgHeight = pageHeight;
              imgWidth = imgWidth * ratio;
            }
            
            // 居中图片
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            // 添加图片到PDF
            doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
          }
          
          // 生成PDF Blob
          this.processingProgress = 95;
          const pdfBlob = doc.output('blob');
          
          // 创建File对象
          const fileName = `${this.uploadForm.customerName}_征信报告_${new Date().toISOString().slice(0, 10)}.pdf`;
          const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
          
          // 保存合并后的PDF
          this.mergedPdfFile = pdfFile;
          this.processingProgress = 100;
          
          resolve(pdfFile);
        } catch (error) {
          console.error('合并图片为PDF时出错:', error);
          reject(error);
        }
      });
    },
    // 加载图片为DataURL
    loadImageAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })
    },
    // 获取图片尺寸
    getImageDimensions(dataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          })
        }
        img.onerror = (e) => reject(e)
        img.src = dataUrl
      })
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
      
      // 重置客户姓名表单
      this.uploadForm.customerName = ''
      if (this.$refs.uploadFormRef) {
        this.$refs.uploadFormRef.resetFields()
      }
      
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
    handleDragStart(e, index) {
      this.dragIndex = index;
      this.isDragging = true; // 标记开始拖拽
      // 强制隐藏悬浮预览
      this.hideImagePreview();
      e.dataTransfer.effectAllowed = 'move';
      // 设置拖拽图像
      const img = new Image();
      e.dataTransfer.setDragImage(img, 0, 0);
      
      // 添加视觉指示
      e.target.classList.add('dragging');
    },
    
    handleDragOver(e, index) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // 当拖过不同的项时添加视觉指示
      const items = document.querySelectorAll('.image-preview-item');
      items.forEach(item => item.classList.remove('drag-over'));
      e.currentTarget.classList.add('drag-over');
    },
    
    handleDrop(e, index) {
      e.preventDefault();
      // 移除所有视觉指示
      const items = document.querySelectorAll('.image-preview-item');
      items.forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
      });
      
      // 如果拖到自己身上，不做任何改变
      if (this.dragIndex === index) return;
      
      // 重新排序图片
      const draggedItem = this.fileList[this.dragIndex];
      const newFileList = [...this.fileList];
      
      // 从原位置删除
      newFileList.splice(this.dragIndex, 1);
      // 插入到新位置
      newFileList.splice(index, 0, draggedItem);
      
      // 更新fileList
      this.fileList = newFileList;
      this.dragIndex = -1;

      // 拖拽结束
      this.isDragging = false;
    },
    
    showImagePreview(file) {
      // 如果预览功能关闭或者正在拖拽，则不显示预览
      if (!this.previewEnabled || this.isDragging) return;
      
      // 检查文件是否还在fileList中
      const fileExists = this.fileList.some(f => f.url === file.url);
      if (!fileExists) {
        return; // 如果文件已被删除，不显示预览
      }
      
      // 转换文件大小为易读格式
      const fileSize = this.formatFileSize(file.size);
      
      // 预先设置悬浮预览数据
      this.hoverPreview = {
        show: true,
        url: file.url,
        name: file.name,
        size: fileSize,
        style: {
          top: '0px',
          left: '0px'
        }
      };
      
      // 延迟计算位置，确保DOM已更新
      this.$nextTick(() => {
        // 获取预览元素
        const previewEl = document.querySelector('.image-hover-preview');
        if (!previewEl) return;
        
        // 获取触发预览的原始图片元素位置
        const imgElement = event.target;
        const imgRect = imgElement.getBoundingClientRect();
        
        // 获取预览元素尺寸
        const previewWidth = previewEl.offsetWidth;
        const previewHeight = previewEl.offsetHeight;
        
        // 获取窗口尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 设置边距
        const margin = 4; // 设置预览与原图边距为4px
        
        // 计算最佳位置，优先放在原图右侧
        let left = imgRect.right + margin;
        let top = imgRect.top;
        
        // 检查右侧空间是否足够
        if (left + previewWidth > windowWidth - margin) {
          // 右侧空间不足，尝试左侧
          left = imgRect.left - previewWidth - margin;
          
          // 如果左侧也不够，则放在上方或下方
          if (left < margin) {
            // 左侧空间不足，尝试下方
            left = imgRect.left;
            top = imgRect.bottom + margin;
            
            // 如果下方空间不足，尝试上方
            if (top + previewHeight > windowHeight - margin) {
              top = imgRect.top - previewHeight - margin;
              
              // 如果上方空间也不足，则放在右下角且大小适应
              if (top < margin) {
                left = windowWidth - previewWidth - margin;
                top = windowHeight - previewHeight - margin;
              }
            }
          }
        }
        
        // 确保不超出屏幕
        left = Math.max(margin, Math.min(windowWidth - previewWidth - margin, left));
        top = Math.max(margin, Math.min(windowHeight - previewHeight - margin, top));
        
        // 更新位置
        this.hoverPreview.style = {
          top: `${top}px`,
          left: `${left}px`
        };
      });
    },
    
    hideImagePreview() {
      this.hoverPreview.show = false;
      this.hoverPreview.url = '';
      this.hoverPreview.name = '';
      this.hoverPreview.size = '';
    },
    
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },
    // 处理姓名输入框回车事件
    handleNameEnter() {
      // 如果文件已上传且名称已填写，触发开始分析
      if (this.fileList.length > 0 && this.uploadForm.customerName.trim()) {
        this.uploadFile();
      }
    },
    // 添加鼠标按下事件处理
    handleImageMouseDown() {
      // 立即隐藏悬浮预览
      this.hideImagePreview();
      // 设置全局mouseup事件监听，以防止鼠标在组件外释放
      document.addEventListener('mouseup', this.handleGlobalMouseUp);
    },
    
    // 处理鼠标释放事件
    handleImageMouseUp(event) {
      // 鼠标松开后，如果鼠标在图片上，并且不在拖拽状态，则重新触发预览
      const file = this.fileList[this.fileList.findIndex((_, i) => 
        event.currentTarget === document.querySelectorAll('.image-preview-item')[i])];
      
      if (file && !this.isDragging && this.previewEnabled) {
        this.showImagePreview(file);
      }
    },
    
    // 处理全局鼠标释放事件
    handleGlobalMouseUp() {
      // 移除全局监听
      document.removeEventListener('mouseup', this.handleGlobalMouseUp);
      
      // 如果不在拖拽状态，重置isDragging
      if (!this.dragIndex) {
        this.isDragging = false;
      }
    },
  },
  mounted() {
    document.documentElement.style.setProperty('--horizontal-split', `${this.horizontalSplit}%`)
    document.documentElement.style.setProperty('--vertical-split', `${this.verticalSplit}%`)
    
    // 添加对页面头部返回按钮的事件监听
    this.setupBackButtonListener()
    
    // 延时检查文件列表状态
    setTimeout(() => {
      console.log('组件挂载完成，文件列表状态:', this.fileList);
      
      // 如果有上传组件引用，尝试修复文件列表
      if (this.$refs.uploadRef && this.$refs.uploadRef.uploadFiles && this.$refs.uploadRef.uploadFiles.length > 0) {
        console.log('从上传组件同步文件列表');
        this.fileList = [...this.$refs.uploadRef.uploadFiles];
      }
    }, 500);
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
    
    // 清理文件预览URL
    if (this.filePreviewUrl) {
      URL.revokeObjectURL(this.filePreviewUrl)
    }
    
    // 清理所有图片预览URL
    this.fileList.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    
    // 清理节流定时器
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout)
    }
    
    // 清理消息定时器
    if (this._fileChangeMessageTimer) {
      clearTimeout(this._fileChangeMessageTimer)
    }
    
    if (this._dropMessageTimer) {
      clearTimeout(this._dropMessageTimer)
    }
    
    this.stopFollowupThinking()
  }
}
</script>

<style scoped>
/* 添加图片处理进度条样式 */
.processing-progress {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-text {
  color: #67c23a;
  font-weight: 500;
}

.progress-percentage {
  color: #1b68de;
  font-weight: bold;
}

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

.credit-report-analyse {
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
  background: #1b68de;
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
  background: #1b68de;
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
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  /* background: #ecf5ff; */
  margin-bottom: 20px;
  min-height: 180px; /* 确保上传区有足够的高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-dropzone:hover {
  background-color: #ecf5ff;
  border: 1px dashed #1b68de;
}

.upload-dropzone.is-dragover {
  border-color: #1b68de;
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
  color: #1b68de;
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
  /* text-decoration: underline; */
}

.continue-upload-hit {
  color: #1b68de;
  font-style: normal;
  margin-left: 8px;
  /* text-decoration: underline; */
}

.upload-text strong {
  color: #67C23A;
}

.upload-actions {
  display: flex;
  margin-top: 16px;
  justify-content: center;
  gap: 16px;
}

.customer-name-input {
  margin-bottom: 16px;
  width: 100%;
}

.customer-name-input :deep(.el-form-item) {
  margin-bottom: 0;
}

.customer-name-input :deep(.el-input) {
  font-size: 14px;
}

.customer-name-input :deep(.el-input__prefix) {
  display: flex;
  align-items: center;
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
  background-color: #1b68de;
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

.file-type-selector {
  margin-bottom: 14px;
}

.file-type-cards {
  display: flex;
  gap: 16px;
}

.file-type-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 4px;
  /* background-color: #f8f9fa; */
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-type-card:hover:not(.disabled) {
  border-color: #1b68de;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.file-type-card.active {
  background-color: #ecf5ff;
  border-color: #1b68de;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.file-type-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e6f1ff;
  color: #1b68de;
  margin: 0 8px;
  font-size: 18px;
}

.file-type-card.active .file-type-icon {
  background-color: #1b68de;
  color: white;
}

.file-type-info {
  flex: 1;
}

.file-type-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.file-type-desc {
  font-size: 12px;
  color: #909399;
}

.image-preview-container {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 16px;
  background-color: #f8f8f8;
}

.preview-title {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #303133;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.image-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  scrollbar-width: thin; /* 添加滚动条宽度为thin */
}

/* 为WebKit浏览器(Chrome/Safari等)自定义滚动条 */
.image-preview-list::-webkit-scrollbar {
  width: 6px;
}

.image-preview-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.image-preview-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.image-preview-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.image-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview-wrapper:hover .image-preview-actions {
  opacity: 1;
}

.remove-image-btn {
  padding: 4px !important;
  font-size: 12px !important;
}

.image-preview-index {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
}

.image-preview-name {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 图片排序提示样式 */
.sort-hint {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
  margin-left: 4px;
}

/* 拖拽相关样式 */
.image-preview-item {
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-preview-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.image-preview-item.drag-over {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
}

/* 悬浮预览样式 */
.image-hover-preview {
  position: fixed;
  z-index: 9999;
  padding: 4px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: min(1000px, 80vw); /* 最大宽度为1000px或视口宽度的80%，取较小值 */
  max-height: min(1000px, 80vh); /* 最大高度为1000px或视口高度的80%，取较小值 */
  overflow: hidden;
  pointer-events: none;
}

.image-hover-preview img {
  width: 100%;
  object-fit: contain;
  max-height: min(1000px, calc(80vh - 30px)); /* 减去信息栏的高度 */
}

.hover-preview-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

/* 预览开关样式 */
.preview-switch {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 8px;
}

.switch-label {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
}

/* 清除文件按钮样式 */
.clear-files-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #feeeee;
  color: #f56c6c;
  border-radius: 4px;
  border: 1px solid #f56c6c;
  padding: 4px 8px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 24px; /* 固定高度 */
  box-sizing: border-box; /* 确保padding不会增加元素高度 */
  transition: all 0.3s;
  font-size: 12px;
}

.clear-files-button:hover {
  background-color: #f56c6c;
  color: #fff;
}

.clear-files-button .clear-text {
  display: none;
  white-space: nowrap;
  line-height: 1; /* 确保文本行高一致 */
}

.clear-files-button:hover .clear-text {
  display: inline;
}
</style> 