// ... existing code ...

<template>
  <div class="property-advisor-report">
    <!-- 步骤导航 - 只在步骤2和3展示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success">
        <el-step title="需求收集" description="填写购房需求"></el-step>
        <el-step title="房源匹配" description="AI匹配最佳房源"></el-step>
        <el-step title="报告生成" description="查看并下载报告"></el-step>
      </el-steps>
    </div>
    
    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤1: 需求收集表单 -->
      <div v-if="activeStep === 1" class="step-container step-container-form">
        <PropertyAdvisorForm :initial-data="formData" @submit="handleFormSubmit" />
      </div>
      
      <!-- 步骤2: 房源匹配 -->
      <div v-if="activeStep === 2" class="step-container">
        <div class="matching-container">
          <div class="matching-layout">
            <!-- 左侧面板: AI思考过程 -->
            <div class="matching-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><cpu /></el-icon>
                  AI匹配分析
                  <span v-if="matchingStatus === 'matching' || matchingStatus === 'thinking'" class="matching-progress">
                    <el-icon class="rotating"><loading /></el-icon>
                    {{ matchingTimer }}秒
                  </span>
                </h3>
                <div class="header-actions">
                  <el-button v-if="matchingStatus === 'idle'" size="small" type="primary" @click="startPropertyMatching">
                    开始匹配
                  </el-button>
                </div>
              </div>
              <div class="panel-content">
                <div v-if="matchingStatus === 'idle'" class="placeholder-content">
                  <el-icon><info-filled /></el-icon>
                  <p>点击"开始匹配"按钮开始AI匹配分析</p>
                </div>
                <div v-else-if="matchingStatus === 'matching'" class="matching-animation">
                  <div class="animation-item"></div>
                  <div class="animation-item"></div>
                  <div class="animation-item"></div>
                </div>
                <div v-else-if="matchingStatus === 'thinking' || matchingStatus === 'complete'" class="thinking-content">
                  <div class="thinking-process" v-html="renderMarkdown(displayedThinkingProcess)"></div>
                </div>
              </div>
            </div>
            
            <!-- 右侧面板: 匹配结果和客户信息 -->
            <div class="matching-right">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><house /></el-icon>
                  匹配结果
                </h3>
              </div>
              <div class="panel-content">
                <div v-if="matchingStatus !== 'complete'" class="placeholder-content">
                  <p>匹配结果将在分析完成后显示</p>
                </div>
                <div v-else class="matching-results">
                  <div class="result-header">
                    <h4>
                      最佳匹配房源
                      <span class="result-count">{{ matchingProperties.length }}个结果</span>
                    </h4>
                  </div>
                  
                  <!-- 匹配房源列表 -->
                  <div class="property-cards">
                    <div v-for="property in matchingProperties" :key="property.id" class="property-card">
                      <div class="property-image">
                        <img :src="property.imageUrl" :alt="property.name">
                      </div>
                      <div class="property-info">
                        <h5 class="property-name">{{ property.name }}</h5>
                        <div class="property-meta">
                          <span class="property-price">{{ property.price }}万</span>
                          <span class="property-area">{{ property.area }}㎡</span>
                          <span class="property-type">{{ property.type }}</span>
                        </div>
                        <div class="property-address">{{ property.address }}</div>
                        <div class="property-tags">
                          <el-tag v-for="(tag, index) in property.tags" :key="index" size="small" class="keyword-tag">
                            {{ tag }}
                          </el-tag>
                        </div>
                        <div class="property-match">
                          <span class="match-label">匹配度</span>
                          <el-rate v-model="property.matchScore" disabled show-score text-color="#ff9900" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 客户需求摘要 -->
                <div class="customer-summary" v-if="formData.name">
                  <div class="summary-section">
                    <h4>客户基本信息</h4>
                    <div class="summary-item">
                      <span class="item-label">客户姓名</span>
                      <span class="item-value">{{ formData.name }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="item-label">联系方式</span>
                      <span class="item-value">{{ formData.phone }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="item-label">购房目的</span>
                      <span class="item-value">{{ getPurposeText(formData.purpose) }}</span>
                    </div>
                  </div>
                  
                  <div class="summary-section">
                    <h4>预算信息</h4>
                    <div class="summary-item">
                      <span class="item-label">总预算</span>
                      <span class="item-value">{{ formData.totalBudget }}万元</span>
                    </div>
                    <div class="summary-item">
                      <span class="item-label">首付比例</span>
                      <span class="item-value">{{ formData.downPaymentRatio }}%</span>
                    </div>
                  </div>
                  
                  <div class="summary-section">
                    <h4>核心需求</h4>
                    <div class="summary-item">
                      <span class="item-label">区域偏好</span>
                      <span class="item-value">{{ getAreasText(formData.preferredAreas) }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="item-label">户型要求</span>
                      <span class="item-value">{{ getHouseTypeText(formData.houseType) }}</span>
                    </div>
                    <div class="summary-item">
                      <span class="item-label">面积需求</span>
                      <span class="item-value">{{ getAreaRangeText() }}</span>
                    </div>
                  </div>
                  
                  <div v-if="formData.aiKeywords && formData.aiKeywords.length > 0" class="summary-section">
                    <h4>AI关键词</h4>
                    <div class="keywords-tags">
                      <el-tag 
                        v-for="(keyword, index) in formData.aiKeywords" 
                        :key="index" 
                        size="small"
                        class="keyword-tag"
                      >
                        {{ keyword }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <div class="panel-footer">
                <div class="footer-actions">
                  <el-button v-if="matchingStatus === 'complete'" type="primary" @click="nextStep">
                    生成报告
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 步骤3: 报告生成 -->
      <div v-if="activeStep === 3" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧: 报告内容 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><document /></el-icon>
                  买家顾问报告
                  <span v-if="reportGenerationDuration > 0" class="report-duration">
                    生成耗时: {{ reportGenerationDuration }}秒
                  </span>
                </h3>
                <div class="header-actions">
                  <el-button v-if="reportContent" size="small" @click="downloadReport">
                    <el-icon><download /></el-icon>
                    下载报告
                  </el-button>
                </div>
              </div>
              <div class="panel-content">
                <div v-if="isThinking" class="thinking-content">
                  <div class="thinking-process" v-html="renderMarkdown(displayedThinkingProcess)"></div>
                </div>
                <div v-else-if="reportContent" class="report-content">
                  <div class="markdown-content" v-html="renderMarkdown(reportContent)"></div>
                </div>
                <div v-else class="placeholder-content">
                  <p>报告生成中，请稍候...</p>
                </div>
              </div>
            </div>
            
            <!-- 右侧: 额外面板 -->
            <div class="report-right">
              <!-- 右上: 房源匹配结果摘要 -->
              <div class="right-top-panel">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><house /></el-icon>
                    匹配房源摘要
                  </h3>
                </div>
                <div class="panel-content">
                  <div v-if="matchingProperties.length > 0" class="property-cards">
                    <div v-for="property in matchingProperties.slice(0, 1)" :key="property.id" class="property-card">
                      <div class="property-image">
                        <img :src="property.imageUrl" :alt="property.name">
                      </div>
                      <div class="property-info">
                        <h5 class="property-name">{{ property.name }}</h5>
                        <div class="property-meta">
                          <span class="property-price">{{ property.price }}万</span>
                          <span class="property-area">{{ property.area }}㎡</span>
                        </div>
                        <div class="property-address">{{ property.address }}</div>
                        <div class="property-match">
                          <span class="match-label">匹配度</span>
                          <el-rate v-model="property.matchScore" disabled show-score text-color="#ff9900" />
                        </div>
                      </div>
                    </div>
                    
                    <div v-if="matchingProperties.length > 1" class="more-matches">
                      还有{{ matchingProperties.length - 1 }}个匹配房源
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 右下: AI顾问咨询 -->
              <div class="right-bottom-panel">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><chat-dot-square /></el-icon>
                    AI置业顾问
                  </h3>
                </div>
                <div class="panel-content">
                  <div class="chat-messages">
                    <div v-for="(message, index) in consultationMessages" :key="index" 
                         :class="['message', message.role]">
                      <div class="message-content">
                        <div v-if="message.role === 'assistant'" class="ai-avatar">AI</div>
                        <div class="text" v-html="renderMarkdown(message.content)"></div>
                      </div>
                      
                      <!-- 思考过程 -->
                      <div v-if="message.role === 'assistant' && consultationThinkingProcesses[index - 1]" 
                           class="thinking-process-container">
                        <div class="thinking-process-toggle" 
                             @click="toggleThinkingProcess(index - 1)">
                          <el-icon>
                            <arrow-down v-if="!thinkingProcessExpanded[index - 1]" />
                            <arrow-up v-else />
                          </el-icon>
                          {{ thinkingProcessExpanded[index - 1] ? '收起思考过程' : '查看思考过程' }}
                        </div>
                        <div v-if="thinkingProcessExpanded[index - 1]" class="thinking-process">
                          {{ consultationThinkingProcesses[index - 1] }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- 思考中状态 -->
                    <div v-if="consultationLoading" class="message assistant">
                      <div class="message-content">
                        <div class="ai-avatar">AI</div>
                        <div class="text">
                          <span class="thinking-status">
                            <el-icon class="rotating"><timer /></el-icon>
                            思考中{{ consultationThinkingDots }}
                            <span v-if="consultationThinkingTimer > 0">
                              {{ consultationThinkingTimer }}秒
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 输入框 -->
                  <div class="chat-input">
                    <el-input
                      v-model="consultationInput"
                      type="textarea"
                      :rows="1"
                      autosize
                      placeholder="输入您的置业问题..."
                      @input="adjustInputHeight"
                      @keyup.enter.ctrl="sendConsultationMessage"
                    />
                    <el-button 
                      type="primary" 
                      :disabled="consultationLoading || !consultationInput.trim()"
                      @click="sendConsultationMessage">
                      发送
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PropertyAdvisorForm from './PropertyAdvisorForm.vue'
import { 
  Cpu, 
  Loading, 
  InfoFilled, 
  Refresh, 
  ArrowDown, 
  Document, 
  Download,
  House, 
  ChatDotSquare, 
  ArrowUp,
  Timer
} from '@element-plus/icons-vue'

export default {
  name: 'PropertyAdvisorReport',
  components: {
    PropertyAdvisorForm,
    Loading,
    Download,
    InfoFilled,
    Refresh,
    ArrowDown,
    Document,
    Cpu,
    ChatDotSquare,
    ArrowUp,
    House,
    Timer
  },
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['step-change', 'report-complete'],
  setup(props, { emit }) {
    // 当前活动步骤
    const activeStep = ref(1)
    
    // 用户提交的表单数据
    const formData = ref(props.initialData || {})
    
    // 匹配产品的状态
    const matchingStatus = ref('idle') // idle, matching, thinking, generating, complete
    
    // 匹配计时器
    const matchingTimer = ref(0)
    let matchingTimerInterval = null
    
    // 匹配结果
    const matchingProperties = ref([])
    
    // AI匹配房源思考过程
    const aiThinkingProcess = ref('')
    const displayedThinkingProcess = ref('') // 用于逐字显示的思考过程
    const isThinking = ref(false) // AI是否正在思考
    let thinkingInterval = null // 思考过程展示的计时器
    let thinkingIndex = 0 // 当前处理到的思考内容索引
    
    // 报告内容
    const reportContent = ref('')
    const reportGenerationDuration = ref(0)
    
    // 咨询相关
    const consultationMessages = ref([])
    const consultationInput = ref('')
    const consultationLoading = ref(false)
    const consultationThinkingTimer = ref(0)
    const consultationThinkingDots = ref('')
    const consultationResponseStatus = ref('')
    const consultationResponseTime = ref(0)
    const consultationThinkingProcesses = ref([]) // 存储多个思考过程的数组
    const thinkingProcessExpanded = ref({}) // 跟踪每个思考过程的展开/折叠状态
    let consultationThinkingInterval = null
    let mutationObserver = null // 用于监听输入框高度变化
    let autoHeightCheckInterval = null // 用于定期检查高度变化
    
    // 分栏调整
    const horizontalSplit = ref(60)
    const isResizingHorizontal = ref(false)
    let resizeThrottleTimeout = null
    let lastResizeTime = 0
    
    // 垂直分隔线相关
    const verticalSplit = ref(50)
    const isResizingVertical = ref(false)
    
    // 初始匹配房源的思考内容
    const matchThinkingContent = ref('')
    
    // 渲染Markdown内容
    const renderMarkdown = (content) => {
      if (!content) return '';
      try {
        // 使用marked解析Markdown
        const rawHtml = marked(content);
        // 使用DOMPurify清理HTML，防止XSS攻击
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        return cleanHtml;
      } catch (error) {
        console.error('Markdown渲染错误:', error);
        return content; // 如果解析失败，返回原始内容
      }
    }
    
    // 更多方法和逻辑将在下一部分添加...
    // ... existing code ...
    // 更多方法和逻辑将在下一部分添加...
    
    // 辅助函数 - 获取购房目的文本
    const getPurposeText = (purpose) => {
      const purposeMap = {
        'self': '自住',
        'investment': '投资',
        'upgrade': '改善',
        'retirement': '养老',
        'education': '子女教育'
      }
      return purpose ? purposeMap[purpose] : '未提供'
    }
    
    // 辅助函数 - 获取区域文本
    const getAreasText = (areas) => {
      if (!areas || areas.length === 0) return '未提供'
      
      const areaMap = {
        'downtown': '市中心',
        'east': '城东',
        'west': '城西',
        'south': '城南',
        'north': '城北',
        'suburb': '郊区'
      }
      
      return areas.map(area => areaMap[area] || area).join('、')
    }
    
    // 辅助函数 - 获取户型文本
    const getHouseTypeText = (type) => {
      const typeMap = {
        '1': '一室',
        '2': '两室',
        '3': '三室',
        '4': '四室',
        '5+': '五室及以上'
      }
      return type ? typeMap[type] : '未提供'
    }
    
    // 辅助函数 - 获取装修文本
    const getDecorationText = (decoration) => {
      const decorationMap = {
        'undecorated': '毛坯',
        'basic': '简装',
        'deluxe': '精装',
        'luxury': '豪装'
      }
      return decoration ? decorationMap[decoration] : '未提供'
    }
    
    // 辅助函数 - 获取面积范围文本
    const getAreaRangeText = () => {
      if (formData.value.minArea && formData.value.maxArea) {
        return `${formData.value.minArea}-${formData.value.maxArea}㎡`
      } else if (formData.value.minArea) {
        return `${formData.value.minArea}㎡以上`
      } else if (formData.value.maxArea) {
        return `${formData.value.maxArea}㎡以下`
      } else {
        return '未提供'
      }
    }
    
    // 辅助函数 - 获取楼层偏好文本
    const getFloorText = (floor) => {
      const floorMap = {
        'low': '低楼层',
        'middle': '中楼层',
        'high': '高楼层',
        'penthouse': '顶楼带露台',
        'any': '无特殊要求'
      }
      return floor ? floorMap[floor] : '未提供'
    }
    
    // 辅助函数 - 获取朝向文本
    const getOrientationText = (orientations) => {
      if (!orientations || orientations.length === 0) return '未提供'
      
      const orientationMap = {
        'south': '坐北朝南',
        'east': '东向',
        'west': '西向',
        'north': '北向',
        'southeast': '东南',
        'southwest': '西南',
        'northeast': '东北',
        'northwest': '西北'
      }
      
      return orientations.map(o => orientationMap[o] || o).join('、')
    }
    
    // 辅助函数 - 获取配套设施文本
    const getFacilitiesText = (facilities) => {
      if (!facilities || facilities.length === 0) return '未提供'
      
      const facilityMap = {
        'education': '教育配套',
        'hospital': '医疗设施',
        'shopping': '商业购物',
        'transportation': '交通便利',
        'park': '公园绿地',
        'community': '社区环境'
      }
      
      return facilities.map(f => facilityMap[f] || f).join('、')
    }
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      console.log('接收到表单数据:', data)
      formData.value = data
      
      // 为了演示，我们在提交后展示所有数据
      console.log('客户姓名:', data.name)
      console.log('联系方式:', data.phone)
      console.log('购房目的:', getPurposeText(data.purpose))
      console.log('总预算:', data.totalBudget, '万元')
      console.log('首付比例:', data.downPaymentRatio, '%')
      console.log('期望区域:', getAreasText(data.preferredAreas))
      
      // 进入下一步
      nextStep()
    }
    
    // 开始匹配房源
    const startPropertyMatching = () => {
      if (matchingStatus.value !== 'idle') return
      
      matchingStatus.value = 'matching'
      startMatchingTimer()
      
      // 演示：创建模拟思考过程
      setTimeout(() => {
        matchingStatus.value = 'thinking'
        isThinking.value = true
        
        // 创建思考过程内容
        const thinkingContent = `## 客户需求分析

1. **基本情况**
   - 客户姓名：${formData.value.name || '未提供'}
   - 购房目的：${getPurposeText(formData.value.purpose)}
   - 家庭人口：${formData.value.familySize || '未提供'}人

2. **预算分析**
   - 总预算：${formData.value.totalBudget ? formData.value.totalBudget + '万元' : '未提供'}
   - 首付比例：${formData.value.downPaymentRatio ? formData.value.downPaymentRatio + '%' : '未提供'}
   - 贷款能力：总预算的${100 - (formData.value.downPaymentRatio || 30)}%，约${Math.round(formData.value.totalBudget * (1 - (formData.value.downPaymentRatio || 30)/100))}万元

3. **需求偏好**
   - 期望区域：${getAreasText(formData.value.preferredAreas)}
   - 户型要求：${getHouseTypeText(formData.value.houseType)}
   - 装修状况：${getDecorationText(formData.value.decoration)}
   - 面积需求：${getAreaRangeText()}
   - 楼层偏好：${getFloorText(formData.value.floorPreference)}
   - 朝向要求：${getOrientationText(formData.value.orientation)}

4. **关键词提取**
   ${formData.value.aiKeywords && formData.value.aiKeywords.length > 0 ? 
   '- ' + formData.value.aiKeywords.join('\n   - ') : 
   '- 未提供关键词'}

## 房源匹配策略

1. **区域优先级**
   - 首选区域：${getAreasText(formData.value.preferredAreas)}
   - 匹配度权重：30%

2. **价格匹配**
   - 目标价格区间：${Math.max(0, formData.value.totalBudget * 0.9)}-${formData.value.totalBudget * 1.1}万元
   - 匹配度权重：25%

3. **户型面积匹配**
   - 目标户型：${getHouseTypeText(formData.value.houseType)}
   - 目标面积：${getAreaRangeText()}
   - 匹配度权重：20%

4. **其他条件匹配**
   - 装修状况：${getDecorationText(formData.value.decoration)}
   - 楼层偏好：${getFloorText(formData.value.floorPreference)}
   - 朝向要求：${getOrientationText(formData.value.orientation)}
   - 匹配度权重：15%

5. **特殊需求匹配**
   - 关键词匹配：${formData.value.aiKeywords?.join(', ') || '无'}
   - 匹配度权重：10%

正在检索房源数据库...
已找到132个初始匹配房源
应用筛选条件后，剩余27个符合基本条件的房源
根据匹配算法评分，选出前3个最佳匹配房源`
        
        aiThinkingProcess.value = thinkingContent
        startThinkingProcess(thinkingContent)
        
        // 5秒后显示匹配结果
        setTimeout(() => {
          stopThinkingProcess()
          stopMatchingTimer()
          matchingStatus.value = 'complete'
          isThinking.value = false
          
          // 模拟3个匹配房源
          matchingProperties.value = [
            {
              id: 1,
              name: '阳光花园 3室2厅',
              price: Math.round(formData.value.totalBudget * 0.95),
              area: formData.value.minArea ? Math.round((formData.value.minArea + (formData.value.maxArea || formData.value.minArea * 1.2)) / 2) : 120,
              type: getHouseTypeText(formData.value.houseType) || '三室两厅',
              address: `${getAreasText(formData.value.preferredAreas).split('、')[0] || '城南'}区 阳光花园小区`,
              imageUrl: 'https://via.placeholder.com/300x200?text=阳光花园',
              tags: ['近地铁', '学区房', '南北通透', '精装修'],
              matchScore: 4.8
            },
            {
              id: 2,
              name: '江景豪庭 4室2厅',
              price: Math.round(formData.value.totalBudget * 1.05),
              area: formData.value.minArea ? Math.round((formData.value.minArea + (formData.value.maxArea || formData.value.minArea * 1.3)) / 2) : 140,
              type: parseInt(formData.value.houseType || '3') + 1 + '室两厅',
              address: `${getAreasText(formData.value.preferredAreas).split('、')[0] || '城东'}区 江景豪庭小区`,
              imageUrl: 'https://via.placeholder.com/300x200?text=江景豪庭',
              tags: ['江景房', '大平层', '双卫生间', '车位充足'],
              matchScore: 4.5
            },
            {
              id: 3,
              name: '森林公园旁 绿地小区 3室1厅',
              price: Math.round(formData.value.totalBudget * 0.9),
              area: formData.value.minArea ? Math.round((formData.value.minArea + (formData.value.maxArea || formData.value.minArea * 1.1)) / 2) : 110,
              type: getHouseTypeText(formData.value.houseType) || '三室一厅',
              address: `${getAreasText(formData.value.preferredAreas).split('、')[1] || '城北'}区 绿地小区`,
              imageUrl: 'https://via.placeholder.com/300x200?text=绿地小区',
              tags: ['靠近公园', '环境优美', '配套完善', '性价比高'],
              matchScore: 4.2
            }
          ]
        }, 5000)
      }, 2000)
    }

    // ... existing code ...
    
    // 显示思考过程
    const startThinkingProcess = (content) => {
      if (!content) return
      
      thinkingIndex = 0
      displayedThinkingProcess.value = ''
      
      clearInterval(thinkingInterval)
      thinkingInterval = setInterval(() => {
        if (thinkingIndex < content.length) {
          // 每次添加一个字符
          displayedThinkingProcess.value += content[thinkingIndex++]
        } else {
          // 思考过程显示完毕，清除定时器
          clearInterval(thinkingInterval)
          thinkingInterval = null
        }
      }, 5) // 调整速度，数字越小越快
    }
    
    // 停止思考过程显示
    const stopThinkingProcess = () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval)
        thinkingInterval = null
      }
      
      // 确保显示完整内容
      if (aiThinkingProcess.value) {
        displayedThinkingProcess.value = aiThinkingProcess.value
      }
    }
    
    // 开始匹配计时器
    const startMatchingTimer = () => {
      matchingTimer.value = 0
      clearInterval(matchingTimerInterval)
      
      matchingTimerInterval = setInterval(() => {
        matchingTimer.value++
      }, 1000)
    }
    
    // 停止匹配计时器
    const stopMatchingTimer = () => {
      clearInterval(matchingTimerInterval)
      matchingTimerInterval = null
    }
    
    // 进入下一步
    const nextStep = () => {
      activeStep.value++
      
      // 根据当前步骤执行相应的操作
      if (activeStep.value === 3) {
        // 生成报告步骤
        generateReport()
      }
    }
    
    // 生成报告内容
    const generateReport = () => {
      const currentDate = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
      
      // 记录开始时间
      const startTime = Date.now()
      
      // 启动思考状态
      matchingStatus.value = 'thinking'
      isThinking.value = true
      
      // 创建思考过程内容
      const reportThinkingProcess = `## 买家顾问报告生成流程

1. **收集客户需求数据**
   - 基本信息：${formData.value.name}，${formData.value.phone}
   - 购房目的：${getPurposeText(formData.value.purpose)}
   - 预算信息：${formData.value.totalBudget}万元，首付${formData.value.downPaymentRatio}%

2. **分析区域市场行情**
   - 检索目标区域：${getAreasText(formData.value.preferredAreas)}
   - 分析近3个月成交数据
   - 评估价格走势与政策影响

3. **房源匹配结果分析**
   - 匹配房源数量：3
   - 最高匹配度：${matchingProperties.value[0]?.matchScore || 4.8}分
   - 价格区间：${Math.min(...matchingProperties.value.map(p => p.price))}万 - ${Math.max(...matchingProperties.value.map(p => p.price))}万
   - 面积区间：${Math.min(...matchingProperties.value.map(p => p.area))}㎡ - ${Math.max(...matchingProperties.value.map(p => p.area))}㎡

4. **制定金融方案**
   - 根据首付比例计算首付金额
   - 评估贷款额度与月供
   - 分析各银行利率情况
   - 设计最优贷款方案

5. **补充配套与装修建议**
   - 分析客户配套需求重点：${getFacilitiesText(formData.value.facilities)}
   - 根据房源特点提供装修建议
   - 评估装修预算与周期

正在生成最终报告...`
      
      aiThinkingProcess.value = reportThinkingProcess
      startThinkingProcess(reportThinkingProcess)
      
      // 模拟生成报告的过程，5秒后展示报告内容
      setTimeout(() => {
        // 停止思考过程显示
        stopThinkingProcess()
        isThinking.value = false
        
        // 计算报告生成耗时
        reportGenerationDuration.value = Math.round((Date.now() - startTime) / 1000)
        
        // 生成报告内容（内容太长，这里只显示部分示例）
        reportContent.value = `# 买家顾问报告

编制日期：${currentDate}

## 一、客户需求与市场分析

**客户姓名**：${formData.value.name || '未提供'}
**联系电话**：${formData.value.phone || '未提供'}
**总预算**：${formData.value.totalBudget ? formData.value.totalBudget + '万元' : '未提供'}
**购房目的**：${getPurposeText(formData.value.purpose)}
**详细需求描述**：${formData.value.additionalNotes || '用户未提供详细描述'}
**需求关键词**：${formData.value.aiKeywords?.join('、') || '无'}

### 1. 市场行情分析
**价格波动**：目标区域近3个月房价整体呈现平稳微涨趋势，涨幅约2-3%，低于全市平均水平。

**政策利好**：近期出台的限购放松政策和首套房贷款利率下调政策，对购房者较为有利。

**供需情况**：目标区域新房供应有限，二手房交易活跃，优质房源仍有一定竞争。

### 2. 客户需求拆解
**核心矛盾**：预算有限但对区位和配套要求较高。

**解决方案**：
1. 聚焦性价比较高的区域
2. 适当放宽对装修和楼龄的要求
3. 优先考虑交通便利性，其次是教育和商业配套

## 二、房源推荐（按综合优先级排序）

### 推荐1：${matchingProperties.value[0]?.name || '阳光花园 3室2厅'}（总价：${matchingProperties.value[0]?.price || '380'}万元）

**a. 房源概况**
- 建筑面积：${matchingProperties.value[0]?.area || '120'}㎡
- 户型结构：${matchingProperties.value[0]?.type || '三室两厅'}
- 所在区域：${matchingProperties.value[0]?.address?.split(' ')[0] || '城南区'}
- 小区名称：${matchingProperties.value[0]?.address?.split(' ')[1] || '阳光花园小区'}
- 装修情况：${formData.value.decoration ? getDecorationText(formData.value.decoration) : '精装修'}
- 楼层情况：${formData.value.floorPreference ? getFloorText(formData.value.floorPreference) : '中楼层'}（共18层）
- 建筑年代：2015年
- 房屋朝向：${formData.value.orientation?.length ? getOrientationText(formData.value.orientation) : '南北通透'}

**b. 配套设施详解**
- 教育：小区内有幼儿园，500米内有市重点小学，1.5公里内有省级示范高中
- 交通：距离地铁2号线仅300米，公交站点2个，出行便利
- 商业：小区对面有大型购物中心，超市、餐饮、银行一应俱全
- 医疗：1公里内有三甲医院，小区内设有社区医疗服务点
- 其他：小区绿化率40%，配有游泳池、健身房等高端设施

[房源信息和详细报告内容续...]`
        
        // 初始化咨询消息
        consultationMessages.value = [
          {
            role: 'system',
            content: '您的置业顾问报告已生成。关于本次购房需求，你可以继续向AI咨询以获取更多建议。'
          }
        ]
        
        // 更新状态
        matchingStatus.value = 'complete'
      }, 5000)
    }
    
    // 下载报告
    const downloadReport = () => {
      try {
        if (!reportContent.value) {
          throw new Error('未找到报告内容')
        }

        // 创建Blob对象
        const blob = new Blob([reportContent.value], { type: 'text/markdown;charset=utf-8' })

        // 创建下载链接
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `买家顾问报告_${new Date().toISOString().slice(0, 10)}.md`

        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // 清理URL对象
        URL.revokeObjectURL(link.href)

        ElMessage.success('报告已下载')
      } catch (error) {
        console.error('下载报告时出错:', error)
        ElMessage.error('下载失败，请重试')
      }
    }
    
    // 重置顾问流程
    const restartAdvisor = () => {
      ElMessageBox.confirm('确定要重新开始新的买家顾问流程吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置所有状态
        activeStep.value = 1 // 设置为第一步，显示需求提交表单
        formData.value = {}
        reportContent.value = ''
        aiThinkingProcess.value = ''
        displayedThinkingProcess.value = ''
        consultationMessages.value = []
        matchingStatus.value = 'idle'
        consultationInput.value = ''
        matchingProperties.value = []
        
        // 清除思考进程
        stopThinkingProcess()
        
        ElMessage({
          type: 'success',
          message: '已重置顾问报告流程'
        })
      }).catch(() => {
        // 用户取消操作
      })
    }
    
    // 折叠/展开思考过程
    const toggleThinkingProcess = (index) => {
      thinkingProcessExpanded.value[index] = !thinkingProcessExpanded.value[index]
    }
    
    // 调整输入框高度
    const adjustInputHeight = () => {
      nextTick(() => {
        const textarea = document.querySelector('.chat-input textarea')
        if (textarea) {
          textarea.style.height = 'auto'
          textarea.style.height = textarea.scrollHeight + 'px'
        }
      })
    }
    
    // 发送咨询消息
    const sendConsultationMessage = async () => {
      if (!consultationInput.value.trim() || consultationLoading.value) return
      
      const userMessage = {
        role: 'user',
        content: consultationInput.value.trim()
      }
      
      consultationMessages.value.push(userMessage)
      consultationInput.value = ''
      consultationLoading.value = true
      
      // 重置输入框高度
      setTimeout(adjustInputHeight, 10)
      
      // 模拟AI思考和回复过程
      consultationThinkingTimer.value = 0
      consultationThinkingDots.value = ''
      
      // 启动思考计时器
      const thinkingInterval = setInterval(() => {
        consultationThinkingTimer.value++
        consultationThinkingDots.value = '.'.repeat(consultationThinkingTimer.value % 4)
      }, 1000)
      
      try {
        // 创建一个模拟的AI思考过程内容
        const question = userMessage.content
        
        // 等待2-4秒模拟思考
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
        
        // 模拟AI回复
        const aiMessage = {
          role: 'assistant',
          content: generateMockResponse(question)
        }
        
        consultationMessages.value.push(aiMessage)
        consultationResponseStatus = '回复成功'
        consultationResponseTime.value = consultationThinkingTimer.value
        
        // 添加思考过程记录
        consultationThinkingProcesses.value.push(`思考过程：分析"${question}"...`)
        thinkingProcessExpanded.value[consultationThinkingProcesses.value.length - 1] = false
      } catch (error) {
        console.error('发送咨询消息失败:', error)
        ElMessage.error('发送消息失败，请重试')
      } finally {
        clearInterval(thinkingInterval)
        consultationLoading.value = false
        consultationThinkingTimer.value = 0
        consultationThinkingDots.value = ''
        
        // 滚动到底部
        nextTick(() => {
          const chatMessages = document.querySelector('.chat-messages')
          if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight
          }
        })
      }
    }
    
    // 生成模拟回复
    const generateMockResponse = (question) => {
      // 根据问题内容生成不同的回复
      if (question.includes('首付') || question.includes('贷款')) {
        return `关于您询问的首付和贷款问题，我有以下建议：

1. **首付比例**：对于${formData.value.totalBudget}万元的房产，您计划的${formData.value.downPaymentRatio || 30}%首付是合理的。实际金额约为${Math.round(formData.value.totalBudget * (formData.value.downPaymentRatio || 30) / 100)}万元。

2. **贷款方案**：
   - 商业贷款：当前利率在LPR+0.55%(约4.0%)左右
   - 公积金贷款：利率较低，约3.1%，但额度有限
   - 综合贷款：可以考虑公积金与商业贷款组合使用

3. **月供压力**：以${Math.round(formData.value.totalBudget * (1 - (formData.value.downPaymentRatio || 30)/100))}万贷款30年计算，每月还款约${Math.round((formData.value.totalBudget || 400) * (1 - (formData.value.downPaymentRatio || 30)/100) * 10000 * 0.0048 / 12)}元。建议您的月收入至少应该达到这个数字的3倍以上，确保还贷压力不会过大。

如果您有更具体的贷款问题，可以随时咨询我。`
      } else if (question.includes('看房') || question.includes('预约')) {
        return `关于看房预约，我们可以为您安排：

1. **看房时间**：我们可以按照您的时间安排，包括工作日和周末。建议安排在白天自然光充足的时间，这样可以更好地观察房屋采光情况。

2. **看房路线**：我们会根据您的需求，将${getAreasText(formData.value.preferredAreas)}区域的3个推荐房源安排在同一天看房，优化路线以节省您的时间。

3. **看房重点**：
   - 阳光花园：重点观察周边教育配套和地铁便利性
   - 江景豪庭：重点体验江景视野和大空间布局
   - 绿地小区：重点感受园林环境和性价比优势

4. **服务内容**：我们将提供专业置业顾问全程陪同，并准备详细的户型图和价格分析，帮助您做出明智决策。

您可以通过电话或微信联系我们预约看房时间，我们会根据房源状态和您的时间安排最佳看房计划。`
      } else if (question.includes('价格') || question.includes('议价')) {
        return `关于房屋价格和议价空间，我可以提供以下专业建议：

1. **市场行情**：${getAreasText(formData.value.preferredAreas)}区域近期成交价格在每平米${Math.round(formData.value.totalBudget / 120 * 9500)}元至${Math.round(formData.value.totalBudget / 120 * 10500)}元之间，总体较为稳定。

2. **议价空间**：
   - 阳光花园：挂牌价${matchingProperties.value[0]?.price || 380}万，估计有3-5%的议价空间
   - 江景豪庭：挂牌价${matchingProperties.value[1]?.price || 420}万，议价空间较小，约2-3%
   - 绿地小区：挂牌价${matchingProperties.value[2]?.price || 350}万，议价空间约5-8%

3. **议价策略**：
   - 了解房源挂牌时间，挂牌时间越长议价空间越大
   - 调查同小区近期成交价格，准备充分的市场数据
   - 注意业主心理价位，避免出价过低导致谈判破裂
   - 合理利用房屋缺点作为议价理由

4. **付款方式影响**：如果能够一次性付款或较大比例首付，通常可获得更大的价格优惠。

希望这些信息对您有所帮助。如果您有具体的议价问题，可以进一步咨询我。`
      } else {
        // 默认回复
        return `感谢您的咨询。基于您的购房需求和我们推荐的房源，我建议您:

1. 优先考虑阳光花园项目，它在交通便利性和教育配套方面非常符合您的核心需求。

2. 您提到的${formData.value.additionalNotes ? formData.value.additionalNotes.substring(0, 20) + '...' : '具体需求'}确实很重要，我们在推荐时已经将这些因素纳入考量。

3. 目前市场行情看，${getAreasText(formData.value.preferredAreas)}区域的房价趋势相对稳定，总体仍处于合理购买区间。

4. 建议您尽快安排实地看房，一方面是因为优质房源可能很快就被抢走，另一方面也是为了亲身体验房屋的实际情况和周边环境。

如果您有更具体的问题，请随时向我咨询。`
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      // 可以在这里初始化组件，如果需要的话
      console.log('PropertyAdvisorReport 组件已挂载')
    })
    
    onUnmounted(() => {
      // 清理资源
      stopMatchingTimer()
      stopThinkingProcess()
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval)
      }
    })
    
    // 返回所有需要在模板中使用的变量和方法
    return {
      activeStep,
      formData,
      matchingStatus,
      matchingTimer,
      matchingProperties,
      aiThinkingProcess,
      displayedThinkingProcess,
      isThinking,
      reportContent,
      reportGenerationDuration,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationThinkingDots,
      consultationResponseStatus,
      consultationResponseTime,
      consultationThinkingProcesses,
      thinkingProcessExpanded,
      renderMarkdown,
      getPurposeText,
      getAreasText,
      getHouseTypeText,
      getDecorationText,
      getAreaRangeText,
      getFloorText,
      getOrientationText,
      getFacilitiesText,
      handleFormSubmit,
      startPropertyMatching,
      nextStep,
      downloadReport,
      restartAdvisor,
      toggleThinkingProcess,
      adjustInputHeight,
      sendConsultationMessage
    }
  }
}
</script>

<style scoped>
.property-advisor-report {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

.steps-header {
  padding: 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.step-container {
  height: 100%;
  overflow: auto;
  flex: 1;
}

.step-container-form {
  display: flex;
  flex-direction: column;
}

/* 匹配房源样式 */
.matching-container {
  height: 100%;
  padding: 20px;
  overflow: hidden;
}

.matching-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 20px;
  height: 100%;
}

.matching-left, .matching-right {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 0 20px;
  height: 60px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1b68de;
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.panel-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.matching-progress {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.placeholder-content :deep(.el-icon) {
  font-size: 48px;
  margin-bottom: 20px;
  color: #c0c4cc;
}

.thinking-content {
  height: 100%;
  overflow: auto;
}

.thinking-process {
  font-family: monospace;
  white-space: pre-wrap;
  line-height: 1.5;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow: auto;
}

.matching-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  margin: 50px 0;
}

.animation-item {
  width: 20px;
  height: 20px;
  margin: 0 10px;
  background-color: #1b68de;
  border-radius: 50%;
  animation: bounce 1.5s infinite ease-in-out;
}

.animation-item:nth-child(2) {
  animation-delay: 0.2s;
}

.animation-item:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.matching-results {
  height: 100%;
}

.result-header {
  margin-bottom: 20px;
}

.result-header h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
}

.result-count {
  font-size: 14px;
  color: #909399;
  margin-left: 10px;
  font-weight: normal;
}

.property-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.property-card {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.property-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.property-image {
  width: 120px;
  height: 120px;
  overflow: hidden;
}

.property-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.property-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.property-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.property-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.property-price {
  color: #f56c6c;
  font-weight: bold;
}

.property-area, .property-type {
  color: #606266;
}

.property-address {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.property-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}

.property-match {
  margin-top: auto;
  display: flex;
  align-items: center;
}

.match-label {
  margin-right: 8px;
  color: #606266;
  font-size: 14px;
}

.customer-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-section {
  margin-bottom: 15px;
}

.summary-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
  padding-bottom: 5px;
  border-bottom: 1px solid #ebeef5;
}

.summary-item {
  display: flex;
  margin-bottom: 5px;
}

.item-label {
  width: 80px;
  color: #909399;
  font-size: 13px;
}

.item-value {
  flex: 1;
  color: #606266;
  font-size: 13px;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.keyword-tag {
  margin-right: 0;
}

/* 报告页面样式 */
.report-container {
  height: 100%;
  padding: 20px;
  overflow: hidden;
}

.report-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 20px;
  height: 100%;
}

.report-left {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
}

.report-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.right-top-panel, .right-bottom-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.right-top-panel {
  flex: 1;
  max-height: 40%;
}

.right-bottom-panel {
  flex: 2;
}

.right-bottom-panel .panel-content {
  display: flex;
  flex-direction: column;
}

.report-content {
  line-height: 1.6;
}

:deep(.markdown-content) {
  line-height: 1.6;
}

:deep(.markdown-content h1) {
  font-size: 24px;
  margin-top: 0;
  margin-bottom: 20px;
  color: #1b68de;
}

:deep(.markdown-content h2) {
  font-size: 20px;
  margin-top: 24px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

:deep(.markdown-content h3) {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 12px;
  color: #303133;
}

:deep(.markdown-content h4) {
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
  color: #303133;
}

:deep(.markdown-content p) {
  margin: 8px 0;
}

:deep(.markdown-content ul), :deep(.markdown-content ol) {
  padding-left: 24px;
  margin: 8px 0;
}

:deep(.markdown-content li) {
  margin: 4px 0;
}

:deep(.markdown-content blockquote) {
  border-left: 4px solid #1b68de;
  padding-left: 12px;
  margin: 16px 0;
  color: #606266;
}

:deep(.markdown-content code) {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px 4px;
  font-family: monospace;
}

:deep(.markdown-content pre) {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
}

.report-duration {
  font-size: 14px;
  color: #909399;
  margin-left: 8px;
  font-weight: normal;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.message {
  margin-bottom: 16px;
}

.message.user {
  display: flex;
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  display: flex;
}

.message.user .message-content {
  justify-content: flex-end;
}

.ai-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1b68de;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  margin-right: 10px;
}

.text {
  padding: 12px;
  border-radius: 8px;
  line-height: 1.5;
}

.message.user .text {
  background-color: #dcedff;
  color: #303133;
}

.message.assistant .text {
  background-color: #f5f7fa;
  color: #303133;
}

.message.system .text {
  background-color: #f0f9eb;
  color: #67c23a;
  width: 100%;
  text-align: center;
  font-size: 14px;
  padding: 8px;
}

.thinking-process-container {
  margin-top: 5px;
  margin-left: 42px;
}

.thinking-process-toggle {
  cursor: pointer;
  color: #1b68de;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.thinking-process {
  margin-top: 5px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow: auto;
}

.chat-input {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 18px;
  padding: 8px 16px;
}

.thinking-status, .response-status {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.action-button :deep(.el-icon) {
  margin-right: 4px;
}

@media (max-width: 1200px) {
  .matching-layout, .report-layout {
    grid-template-columns: 55% 45%;
  }
}

@media (max-width: 992px) {
  .matching-layout, .report-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .report-right {
    grid-row: 1;
  }
  
  .report-left {
    grid-row: 2;
  }
}
</style>