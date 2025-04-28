<template>
  <div class="property-advisor-report">
    <!-- 处理步骤区域 - 只在第一步之后显示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
        <el-step title="提交客户需求" />
        <el-step title="匹配楼盘字典" />
        <el-step title="购房建议报告" />
      </el-steps>
    </div>
    
    <!-- 各步骤对应的内容区域 -->
    <div class="step-content">
      <!-- 步骤1: 客户需求提交 -->
      <div v-if="activeStep === 1" class="step-container">
        <PropertyAdvisorForm @submit="handleFormSubmit" />
      </div>
      
      <!-- 步骤2: 匹配房产 -->
      <div v-if="activeStep === 2" class="step-container">
        <div class="product-matching-container">
          <!-- 匹配产品的蒙层，当AI未开始返回思考过程的内容前显示 -->
          <div v-if="matchingStatus === 'matching'" class="matching-overlay">
            <div class="overlay-content">
              <div class="animation-container">
                <div class="loading-brain">
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <path class="brain-path" d="M25,50 Q35,30 50,30 Q65,30 75,50 T50,70 T25,50" stroke="#1b5dd3" fill="none" stroke-width="3" />
                    <circle class="pulse-circle" cx="50" cy="50" r="3" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="35" cy="40" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="65" cy="40" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="30" cy="50" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="70" cy="50" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="40" cy="60" r="2" fill="#1b5dd3" />
                    <circle class="pulse-circle" cx="60" cy="60" r="2" fill="#1b5dd3" />
                  </svg>
                </div>
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
              </div>
                <div class="wait-footer">
                  <div class="ai-tip">
                    正在等待AI响应，请稍等...
                </div>
                  <div class="ai-timer">
                    <div class="timer-icon">
                      <el-icon><Timer /></el-icon>
                </div>
                    已耗时 {{ matchingTimer }} 秒
                  </div>
                </div>
                </div>
              </div>
            </div>
            
          
          <!-- AI思考过程内容容器，当思考模式开始后显示 -->
          <div v-if="matchingStatus === 'thinking' || matchingStatus === 'generating'" class="thinking-container">
              <div class="panel-header">
                <h3>
                <span v-if="isThinking" class="thinking-status">AI正在深度思考中...</span>
                <span v-else-if="matchingStatus === 'generating'" class="thinking-completed">AI思考已完成。</span>
                </h3>
              </div>
              <div class="panel-content">
              <!-- 报告生成过渡提示，不遮挡思考内容，而是以悬浮提示形式展示 -->
              <div v-if="matchingStatus === 'generating'" class="generating-overlay">
                <div class="generating-content">
                  <div class="loading-spinner"></div>
                  <div class="generating-message">即将生成购房建议报告...</div>
                </div>
                  </div>
                  
              <div class="thinking-display" :class="{ 'dimmed': matchingStatus === 'generating' }">
                <span v-html="displayedThinkingProcess"></span>
                      </div>
                  </div>
                </div>
                
          <!-- 这里是返回思考过程后的内容容器，当AI开始响应后会移除蒙层显示内容 -->
          <div v-if="matchingStatus === 'complete'" class="product-matching-content">
            <!-- 这里后面会添加内容 -->
                    </div>
                    </div>
                  </div>
                  
      <!-- 步骤3: 生成房产报告 -->
      <div v-if="activeStep === 3" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧AI分析结果 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><Document /></el-icon>
                  购房建议报告 <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
                </h3>
                <div class="header-actions">
                  <el-button 
                    v-show="reportContent" 
                    type="primary" 
                    size="small"
                    @click="downloadReport"
                    class="action-button"
                  >
                    <el-icon><Download /></el-icon>下载报告
                  </el-button>
                  <el-button 
                    v-show="reportContent" 
                    type="warning" 
                    size="small"
                    @click="restartAdvisor"
                    class="action-button"
                  >
                  <el-icon><House /></el-icon>新的任务
                  </el-button>
                </div>
              </div>
              <div class="panel-content">
                <div class="report-content markdown-content" v-html="renderMarkdown(reportContent)"></div>
              </div>
            </div>
            
            <!-- 右侧区域（AI思考过程和咨询）-->
            <div class="report-right">
              <!-- 上部分：AI匹配产品思考过程 -->
              <div class="report-right-top" :style="{ height: `var(--vertical-split, ${verticalSplit}%)` }">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><Cpu /></el-icon>
                    AI深度思考过程
                  </h3>
                </div>
                <div class="panel-content">
                  <div class="thinking-content">
                    <div v-if="aiThinkingProcess" class="match-thinking" v-html="matchThinkingContent"></div>
                    <template v-for="(thinking, index) in consultationThinkingProcesses" :key="index">
                      <div class="thinking-separator" v-if="index > 0 || aiThinkingProcess">
                        <span class="separator-line"></span>
                        <span class="separator-text">新的咨询AI思考过程</span>
                        <span class="separator-line"></span>
                      </div>
                      <div class="consultation-thinking" v-html="thinking"></div>
                    </template>
                  </div>
                </div>
              </div>
              
              <!-- 可调整大小的垂直分隔线 -->
              <div class="resizer-vertical" @mousedown="startResizeVertical"></div>
              
              <!-- 下部分：继续向AI咨询 -->
              <div class="report-right-bottom" :style="{ height: `calc(100% - var(--vertical-split, ${verticalSplit}%) - 6px)` }">
                <div class="panel-header">
                  <h3>
                    <el-icon class="header-icon"><ChatDotSquare /></el-icon>
                    继续向AI咨询
                    <span v-if="consultationThinkingTimer > 0" class="thinking-status">
                      AI正在回复中{{consultationThinkingDots}}，{{consultationThinkingTimer}}秒
                    </span>
                    <span v-else-if="consultationResponseStatus" class="response-status">
                      {{consultationResponseStatus}} 耗时{{consultationResponseTime}}秒
                    </span>
                  </h3>
                </div>
                <div class="panel-content chat-messages">
                  <div v-for="(message, index) in consultationMessages" 
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
                      v-model="consultationInput"
                      type="textarea"
                    :rows="2"
                    :autosize="{ minRows: 2, maxRows: 3 }"
                    placeholder="请输入您要咨询的内容...(Enter键发送，Shift+Enter键换行)"
                    @keydown.enter.exact.prevent="sendConsultationMessage"
                    @keydown.shift.enter.exact.prevent="handleShiftEnter"
                      @input="adjustInputHeight"
                    @focus="adjustInputHeight"
                    @blur="adjustInputHeight"
                    ref="chatInputRef"
                    />
                  <el-tooltip content="快捷键: Enter" placement="top" effect="dark">
                    <el-button 
                      type="primary" 
                      :loading="consultationLoading"
                      :disabled="!consultationInput.trim()"
                      @click="sendConsultationMessage"
                      style="min-width: 80px;">
                      发送
                    </el-button>
                  </el-tooltip>
                  </div>
                </div>
              </div>
            
            <!-- 可调整大小的分隔线 -->
            <div class="resizer-horizontal" @mousedown="startResizeHorizontal"></div>
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
import { sendMessage } from '../api/chat'
import propertyAdvicePrompt from '../config/prompts/property-advice.js'

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
    
    // 匹配房产的状态
    const matchingStatus = ref('idle') // idle, matching, thinking, generating, complete
    
    // 匹配计时器
    const matchingTimer = ref(0)
    let matchingTimerInterval = null
    
    // 匹配结果
    const matchingResult = ref(null)
    
    // 匹配的房产列表
    const matchingProperties = ref([])
    
    // AI匹配房产思考过程
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
    let consultationThinkingInterval = null
    let mutationObserver = null // 用于监听输入框高度变化
    let autoHeightCheckInterval = null // 用于定期检查高度变化
    let adjustHeightTimer = null // 防抖计时器
    
    // 分栏调整
    const horizontalSplit = ref(60)
    const isResizingHorizontal = ref(false)
    let resizeThrottleTimeout = null
    let lastResizeTime = 0
    
    // 垂直分隔线相关
    const verticalSplit = ref(50)
    const isResizingVertical = ref(false)
    
    // 初始匹配房产的思考内容
    const matchThinkingContent = ref('')
    
    // 开始匹配计时器
    const startMatchingTimer = () => {
      matchingTimer.value = 0;
      matchingTimerInterval = setInterval(() => {
        matchingTimer.value++;
      }, 1000);
    };
    
    // 停止匹配计时器
    const stopMatchingTimer = () => {
      if (matchingTimerInterval) {
        clearInterval(matchingTimerInterval);
        matchingTimerInterval = null;
      }
    };
    
    // 停止所有思考过程相关的计时器
    const stopThinkingProcess = () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      isThinking.value = false;
    };
    
    // 渲染Markdown内容
    const renderMarkdown = (text) => {
      if (!text) return '';
      
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
      });
      
      const rawHtml = marked(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
      
        return cleanHtml;
    }
    
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
    
    // 获取关键词文本
    const getKeywordsText = (keywords) => {
      if (!keywords || !keywords.length) return '无';
      
      if (typeof keywords[0] === 'string') {
        return keywords.join('、');
      } else if (typeof keywords[0] === 'object' && keywords[0].value) {
        return keywords.map(k => k.value).join('、');
      }
      
      return '无';
    };
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      // 更新表单数据
      formData.value = data;
      
      // 确保aiKeywords是可用的格式
      if (data.aiKeywords && Array.isArray(data.aiKeywords)) {
        // 检查关键词格式并处理
        if (data.aiKeywords.length > 0 && typeof data.aiKeywords[0] === 'object') {
          // 已经是对象格式，确保每个对象有value属性
          console.log('关键词是对象格式:', data.aiKeywords[0]);
        } else {
          // 是简单字符串数组，转换为对象格式
          console.log('关键词是字符串格式，转换为对象格式');
          formData.value.aiKeywords = data.aiKeywords.map((keyword, index) => ({
            key: `keyword_${index}`,
            value: keyword,
            type: 'black'
          }));
        }
      }
      
      // 移动到下一步
      nextStep();
      
      // 通知父组件步骤已变化
      emit('step-change', { step: activeStep.value, data: formData.value });
    };
    
    // 开始匹配房产
    const startPropertyMatching = async () => {
      try {
        matchingStatus.value = 'matching';
        startMatchingTimer();
        
        // 构建用于匹配房产的消息
        const propertyMatchingMessage = {
          role: 'user',
          content: `我需要购买房产，具体需求如下：
          - 购房目的: ${formData.value.purpose || '未指定'}
          - 总预算: ${formData.value.totalBudget ? formData.value.totalBudget + '万元' : '未指定'}
          - 首付比例: ${formData.value.downPaymentRatio || 0}%
          - 区域偏好: ${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '未指定'}
          - 户型要求: ${formData.value.houseType || '未指定'}
          - 面积需求: ${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米
          - 装修要求: ${formData.value.decorationRequirement || '未指定'}
          - 其他要求: ${formData.value.additionalNotes || '无'}
          - 关键词: ${getKeywordsText(formData.value.aiKeywords)}`
        };
        
        // 设置固定等待时间为5秒后再模拟AI思考过程
        // 在实际接入AI时，移除此代码，使用真实的等待时间
      setTimeout(() => {
          // 强制设置matchingTimer为5秒，模拟固定的等待时间
          matchingTimer.value = 5;
          
          // 模拟AI思考过程
          // 设置完整的AI思考过程数据
          const fullThinkingProcess = `正在分析客户需求：
"${formData.value.requirements}"

思考过程：
根据客户需求，我提取出以下关键信息：
1. 购房目的: ${formData.value.purpose === 'investment' ? '投资' : 
                formData.value.purpose === 'self_use' ? '自住' : 
                formData.value.purpose === 'both' ? '自住+投资' : '未指定'}
2. 预算情况: 
   - 总预算: ${formData.value.totalBudget || 0}万元
   - 首付比例: ${formData.value.downPaymentRatio || 0}%
   - 首付金额: ${Math.round((formData.value.totalBudget || 0) * (formData.value.downPaymentRatio || 0) / 100)}万元
   - 需贷款金额: ${Math.round((formData.value.totalBudget || 0) * (100 - (formData.value.downPaymentRatio || 0)) / 100)}万元
3. 区域偏好: ${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '未指定'}
4. 户型要求: ${formData.value.houseType === '1' ? '一室' : 
                formData.value.houseType === '2' ? '两室' : 
                formData.value.houseType === '3' ? '三室' : 
                formData.value.houseType === '4+' ? '四室及以上' : '未指定'}
5. 面积需求: ${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米
6. 装修要求: ${formData.value.decorationRequirement === 'rough' ? '毛坯房' : 
                formData.value.decorationRequirement === 'simple' ? '简装' : 
                formData.value.decorationRequirement === 'refined' ? '精装' : 
                formData.value.decorationRequirement === 'luxury' ? '豪装' : '未指定'}
7. 其他特殊要求: ${formData.value.additionalNotes || '无'}
8. 关键词: ${getKeywordsText(formData.value.aiKeywords)}

市场环境分析

根据当前市场状况，我将分析以下几个方面：
1. 区域市场分析:  
   客户偏好的${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : ''}区域目前市场情况如下：   
   - 平均房价：约18000-25000元/平方米
   - 近一年价格走势：稳中有升，增幅约3-5%
   - 区域规划：有地铁规划，未来3年内将新增2条地铁线
   - 教育资源：有3所省重点中学，5所区重点小学
   - 医疗资源：有2所三甲医院，覆盖基本医疗需求
   - 商业配套：商场、超市、餐饮等生活配套设施完善

2. 适合客户的房源特点:
   基于客户的需求，以下特点的房源可能最适合：   
   -房源类型：${formData.value.houseType === '1' ? '一室户型，适合单身或小两口' : 
                formData.value.houseType === '2' ? '两室户型，适合小三口家庭' : 
                formData.value.houseType === '3' ? '三室户型，适合三口或四口之家' : 
                formData.value.houseType === '4+' ? '四室及以上，适合大家庭' : '未指定'}
   - 面积：${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米，符合客户需求
   - 楼层：中高层为佳，采光通风良好
   - 小区环境：绿化率高，安保完善，生活设施齐全
   - 交通便利性：距离地铁站步行10分钟内，公交线路丰富

房源匹配分析

经过筛选，我找到了以下几处最符合客户需求的房源：
房源1：翡翠天际 - 三室两厅
- 售价：${formData.value.totalBudget * 0.95}万元（略低于预算）
- 面积：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2)}平方米
- 户型：三室两厅两卫
- 楼层：18层/33层
- 朝向：南北通透
- 装修：精装修
- 小区：2018年建成，物业费2.5元/平/月
- 配套：小区内有游泳池、健身房、儿童乐园
- 交通：距离地铁2号线仅500米
- 教育：学区房，对口市重点小学和初中
- 优势：南北通透，采光极佳，精装修拎包入住
- 不足：距离主干道较近，可能有轻微噪音
- 匹配度：★★★★★（95%）

房源2：绿城花园 - 三室一厅
- 售价：${formData.value.totalBudget * 0.9}万元（低于预算）
- 面积：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 0.9)}平方米
- 户型：三室一厅一卫
- 楼层：12层/28层
- 朝向：东南
- 装修：简装
- 小区：2015年建成，物业费1.8元/平/月
- 配套：小区环境优美，绿化率高达40%
- 交通：距离公交站200米，地铁站1.5公里
- 教育：对口区重点小学
- 优势：价格合理，小区环境优美，安静舒适
- 不足：距离地铁站较远，装修简单需要改造
- 匹配度：★★★★☆（85%）

房源3：华润万象城 - 四室两厅    
- 售价：${formData.value.totalBudget * 1.05}万元（略高于预算）
- 面积：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 1.1)}平方米
- 户型：四室两厅两卫
- 楼层：22层/35层
- 朝向：南北通透
- 装修：豪装
- 小区：2020年建成，物业费3.0元/平/月
- 配套：商业综合体，购物中心就在楼下
- 交通：地铁上盖，交通极其便利
- 教育：对口市重点小学和省重点中学
- 优势：地段极佳，配套设施一流，户型方正
- 不足：价格略高于预算，人流量大
- 匹配度：★★★★☆（90%）

综合推荐

综合分析以上房源，结合客户需求，我的推荐排序如下：
1. 翡翠天际：最符合客户的预算和需求，南北通透，学区房，距离地铁近，性价比最高
2. 华润万象城：虽然价格略高于预算，但地段和配套无可挑剔，适合重视生活品质的客户
3. 绿城花园：价格最实惠，但交通和装修状况稍有不足，需要客户权衡取舍

如果客户以自住为主要目的，推荐考虑翡翠天际；如果兼顾投资，则华润万象城可能升值潜力更大。`;

          // 开始模拟AI思考过程逐字显示
          aiThinkingProcess.value = fullThinkingProcess; // 保存完整内容以便后续使用
          displayedThinkingProcess.value = ''; // 清空已显示的内容
          thinkingIndex = 0; // 重置索引
          const startTime = Date.now(); // 记录开始时间
          
          // 切换状态到思考中
          matchingStatus.value = 'thinking';
          isThinking.value = true;
          
          // 计算文本总长度和每秒应该显示的字符数，以确保在30-50秒内完成
          const totalLength = fullThinkingProcess.length;
          // 每秒应该处理的字符数，按40秒计算（为了保证在30-50秒的区间内）
          const charsPerSecond = totalLength / 40;
          
          // 启动逐字显示
          if (thinkingInterval) clearInterval(thinkingInterval);
          thinkingInterval = setInterval(() => {
            if (thinkingIndex < fullThinkingProcess.length) {
              // 计算当前已经过的时间(秒)
              const elapsedTime = (Date.now() - startTime) / 1000;
              
              // 计算按当前速度应该显示到的索引位置
              const targetIndex = Math.floor(elapsedTime * charsPerSecond);
              
              // 计算本次应该显示多少字符
              let chunkSize = 1;
              
              // 如果落后于目标进度，则加速
              if (thinkingIndex < targetIndex - 20) {
                chunkSize = 3; // 严重落后，快速追赶
              } else if (thinkingIndex < targetIndex - 5) {
                chunkSize = 2; // 略有落后，稍微加速
              } else if (thinkingIndex > targetIndex + 10) {
                // 如果超前太多，则减速或暂停
                clearInterval(thinkingInterval);
        setTimeout(() => {
                  // 一段时间后再继续
                  thinkingInterval = setInterval(() => {
                    // 继续逐字显示的代码会在这里重新启动
                    if (thinkingIndex < fullThinkingProcess.length) {
                      displayedThinkingProcess.value += fullThinkingProcess[thinkingIndex];
                      thinkingIndex++;
                      
                      // 自动滚动到底部
                      scrollToBottom('.thinking-display');
                    } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 慢速显示
                }, 400); // 长时间暂停
                return;
              }
              
              // 保证不会越界
              const remainingChars = fullThinkingProcess.length - thinkingIndex;
              const actualChunkSize = Math.min(chunkSize, remainingChars);
              
              // 添加字符块到显示内容
              const nextChunk = fullThinkingProcess.substring(thinkingIndex, thinkingIndex + actualChunkSize);
              displayedThinkingProcess.value += nextChunk;
              thinkingIndex += actualChunkSize;
              
              // 检查是否遇到特殊字符需要停顿
              const lastChar = nextChunk[nextChunk.length - 1];
              if (lastChar === '。' || lastChar === '\n' || lastChar === '：') {
                // 句子结束后稍微暂停
                clearInterval(thinkingInterval);
                setTimeout(() => {
                  // 自动滚动到底部
                  scrollToBottom('.thinking-display');
                  
                  // 继续逐字显示
      thinkingInterval = setInterval(() => {
                    // 重新检查当前时间和进度
                    const currentElapsedTime = (Date.now() - startTime) / 1000;
                    const currentTargetIndex = Math.floor(currentElapsedTime * charsPerSecond);
                    
                    if (thinkingIndex < fullThinkingProcess.length) {
                      // 在暂停后，根据当前进度决定速度
                      let chunkSize = 1;
                      if (thinkingIndex < currentTargetIndex - 10) {
                        chunkSize = 2; // 如果落后，稍微加速
                      }
                      
                      const remainingChars = fullThinkingProcess.length - thinkingIndex;
                      const actualChunkSize = Math.min(2, remainingChars);
                      
                      const nextChunk = fullThinkingProcess.substring(thinkingIndex, thinkingIndex + actualChunkSize);
                      displayedThinkingProcess.value += nextChunk;
                      thinkingIndex += actualChunkSize;
                      
                      // 自动滚动到底部
                      scrollToBottom('.thinking-display');
        } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 句末后的显示速度
                }, 300); // 句末停顿时间
              }
              
              // 自动滚动到底部
              scrollToBottom('.thinking-display');
            } else {
              // 所有内容显示完毕
              finishThinking(startTime);
            }
          }, 40); // 基础显示间隔
        }, 5000); // 5秒后开始显示思考过程
        
      } catch (error) {
        console.error('匹配房产时出错:', error);
        matchingStatus.value = 'error';
        stopMatchingTimer();
      }
    };
    
    // 定义结束显示的函数
    const finishThinking = (startTime) => {
      // 计算已经过的时间
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = elapsedMs / 1000;
      
      // 如果显示完成时间少于30秒，则延迟一段时间再完成
      if (elapsedSec < 30) {
        const remainingTime = (30 - elapsedSec) * 1000;
        console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒，将等待${(remainingTime/1000).toFixed(1)}秒后结束`);
        
        // 清除原有的逐字显示计时器
        if (thinkingInterval) {
          clearInterval(thinkingInterval);
          thinkingInterval = null;
        }
        
        // 设置延迟，确保总时间不少于30秒
        setTimeout(() => {
          completeThinking();
        }, remainingTime);
      } else {
        // 如果已经超过30秒，直接完成
        console.log(`思考过程显示完成用时${elapsedSec.toFixed(1)}秒，直接结束`);
        completeThinking();
      }
    };
    
    // 完成思考过程
    const completeThinking = () => {
      // 清除计时器
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      // 显示完整思考内容
      displayedThinkingProcess.value = aiThinkingProcess.value;
      // 保存初始匹配房产的思考内容
      matchThinkingContent.value = aiThinkingProcess.value;
      isThinking.value = false;
      
      // 模拟匹配的房产数据
      matchingProperties.value = [
        {
          id: 1,
          name: '翡翠天际',
          price: Math.floor(formData.value.totalBudget * 0.95),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2),
          type: '三室两厅两卫',
          address: '城东新区 水岸路128号',
          imageUrl: 'https://img.zcool.cn/community/01b0c658579dd4a8012060c82e47e7.jpg',
          tags: ['南北通透', '学区房', '地铁附近', '精装修'],
          matchScore: 5
        },
        {
          id: 2,
          name: '绿城花园',
          price: Math.floor(formData.value.totalBudget * 0.9),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 0.9),
          type: '三室一厅一卫',
          address: '城西区 园林大道56号',
          imageUrl: 'https://img.zcool.cn/community/011e8c58579dd3a8012060c81e8da0.jpg',
          tags: ['环境优美', '性价比高', '绿化率高', '简装'],
          matchScore: 4
        },
        {
          id: 3,
          name: '华润万象城',
          price: Math.floor(formData.value.totalBudget * 1.05),
          area: Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 1.1),
          type: '四室两厅两卫',
          address: '城中心 商业大道88号',
          imageUrl: 'https://img.zcool.cn/community/0152de58579dd7a8012060c8c7222b.jpg',
          tags: ['商业中心', '地铁上盖', '豪装', '名校学区'],
          matchScore: 4.5
        }
      ];
      
      // 延迟一会，让用户看到完整的思考过程
      setTimeout(() => {
        // 转换为生成报告状态，添加过渡效果
        matchingStatus.value = 'generating';
        
        // 延迟约3秒后生成报告，提供良好的过渡体验
        setTimeout(() => {
          // 生成房产报告
          generateReport();
        }, 3000);
      }, 1000);
    };
    
    // 生成报告
    const generateReport = () => {
      const currentDate = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-');
      
      reportContent.value = `# 买家顾问购房建议报告

编制日期：${currentDate}

## 一、客户需求与背景

**客户姓名**：${formData.value.name || '未提供'}
**联系电话**：${formData.value.phone || '未提供'}
**购房目的**：${formData.value.purpose === 'investment' ? '投资' : 
              formData.value.purpose === 'self_use' ? '自住' : 
              formData.value.purpose === 'both' ? '自住+投资' : '未指定'}
**购房预算**：${formData.value.totalBudget || 0}万元
**首付比例**：${formData.value.downPaymentRatio || 0}%
**户型需求**：${formData.value.houseType === '1' ? '一室' : 
              formData.value.houseType === '2' ? '两室' : 
              formData.value.houseType === '3' ? '三室' : 
              formData.value.houseType === '4+' ? '四室及以上' : '未指定'}
**面积需求**：${formData.value.minArea || 0}-${formData.value.maxArea || 0}平方米
**区域偏好**：${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '未指定'}
**装修需求**：${formData.value.decorationRequirement === 'rough' ? '毛坯房' : 
              formData.value.decorationRequirement === 'simple' ? '简装' : 
              formData.value.decorationRequirement === 'refined' ? '精装' : 
              formData.value.decorationRequirement === 'luxury' ? '豪装' : '未指定'}
**其他需求**：${formData.value.additionalNotes || '无'}

## 二、市场分析

### 宏观市场环境

当前房地产市场整体呈现稳中有升态势，政策面趋于宽松，市场流动性充裕。近期央行降息降准，进一步降低了购房成本，有利于提振市场信心。区域市场分化明显，一线城市及强二线城市房价稳中有升，三四线城市仍以去库存为主。

### 目标区域市场分析

客户偏好的${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : ''}区域市场特点：

- **价格走势**：近一年来，该区域房价上涨约3-5%，高于全市平均水平
- **供需关系**：新增供应有限，需求稳定，供需关系健康
- **未来规划**：区域内规划有2条地铁线路，预计3年内开通；同时规划有2所学校、1家三甲医院
- **投资前景**：整体看好，预计未来3-5年内仍有10-15%的增值空间

## 三、推荐房源详情

经过综合筛选和评估，以下是最符合客户需求的三套房源：

### 房源1：翡翠天际 - 三室两厅

- **售价**：${Math.floor(formData.value.totalBudget * 0.95)}万元（略低于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 0.95 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2)}平方米
- **户型**：三室两厅两卫
- **楼层**：18层/33层
- **朝向**：南北通透
- **装修**：精装修
- **小区**：2018年建成，物业费2.5元/平/月
- **配套**：小区内有游泳池、健身房、儿童乐园
- **交通**：距离地铁2号线仅500米
- **教育**：学区房，对口市重点小学和初中
- **优势**：南北通透，采光极佳，精装修拎包入住
- **不足**：距离主干道较近，可能有轻微噪音
- **匹配度**：★★★★★（95%）

### 房源2：绿城花园 - 三室一厅

- **售价**：${Math.floor(formData.value.totalBudget * 0.9)}万元（低于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 0.9 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2 * 0.9))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 0.9)}平方米
- **户型**：三室一厅一卫
- **楼层**：12层/28层
- **朝向**：东南
- **装修**：简装
- **小区**：2015年建成，物业费1.8元/平/月
- **配套**：小区环境优美，绿化率高达40%
- **交通**：距离公交站200米，地铁站1.5公里
- **教育**：对口区重点小学
- **优势**：价格合理，小区环境优美，安静舒适
- **不足**：距离地铁站较远，装修简单需要改造
- **匹配度**：★★★★☆（85%）

### 房源3：华润万象城 - 四室两厅

- **售价**：${Math.floor(formData.value.totalBudget * 1.05)}万元（略高于预算）
- **单价**：${Math.floor((formData.value.totalBudget * 1.05 * 10000) / ((formData.value.minArea + formData.value.maxArea) / 2 * 1.1))}元/平方米
- **面积**：${Math.floor((formData.value.minArea + formData.value.maxArea) / 2 * 1.1)}平方米
- **户型**：四室两厅两卫
- **楼层**：22层/35层
- **朝向**：南北通透
- **装修**：豪装
- **小区**：2020年建成，物业费3.0元/平/月
- **配套**：商业综合体，购物中心就在楼下
- **交通**：地铁上盖，交通极其便利
- **教育**：对口市重点小学和省重点中学
- **优势**：地段极佳，配套设施一流，户型方正
- **不足**：价格略高于预算，人流量大
- **匹配度**：★★★★☆（90%）

## 四、财务分析

### 购房成本分析

以首选房源"翡翠天际"为例：

- **房款总价**：${Math.floor(formData.value.totalBudget * 0.95)}万元
- **首付金额**：${Math.floor(formData.value.totalBudget * 0.95 * (formData.value.downPaymentRatio || 30) / 100)}万元
- **贷款金额**：${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100)}万元
- **贷款年限**：30年
- **月供金额**：约${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 10000 * 0.0049 / 12)}元（按LPR 3.65%计算）

### 额外费用估算

- **契税**：${Math.floor(formData.value.totalBudget * 0.95 * 0.015)}万元（首套1.5%）
- **增值税及附加**：免税（满两年）
- **个人所得税**：免税（满五唯一）
- **评估费**：约0.5万元
- **公证费**：约0.3万元
- **登记费**：约0.2万元
- **合计**：约${Math.floor(formData.value.totalBudget * 0.95 * 0.015 + 1)}万元

## 五、购房建议

### 最终推荐

综合考虑客户需求、市场环境和房源特点，我们的推荐排序如下：

1. **翡翠天际**：最符合客户预算和需求，性价比最高，推荐优先考察
2. **华润万象城**：配套和地段优势明显，虽价格略高但增值潜力大
3. **绿城花园**：价格优势明显，但需权衡交通便利性和后期装修成本

### 购房时机

当前市场处于政策红利期，利率处于历史低位，建议客户抓住时机尽快入市。特别是客户关注的区域未来有多项利好规划，越早购入越能享受区域发展带来的增值。

### 购房流程指导

1. **实地看房**：建议预约中介或销售顾问，亲自查看房源实际情况
2. **核实信息**：查验房产证、土地证等权属证件，确认无产权纠纷
3. **出价谈判**：合理出价，可预留5-8%的议价空间
4. **贷款申请**：提前准备资料，与多家银行比较贷款条件
5. **签订合同**：仔细审核合同条款，特别是付款方式、违约责任等
6. **过户交易**：按约定时间办理过户手续，缴纳相关税费
7. **收房验房**：专业验房，检查房屋质量，办理物业交接

## 六、风险提示

1. **政策风险**：密切关注国家和地方房地产政策变化
2. **市场风险**：房价短期可能有波动，建议以中长期持有为主
3. **资金风险**：合理规划财务，确保月供不超过家庭月收入的40%
4. **选址风险**：注意周边规划，避免选择临近未来可能有噪音、污染的区域
5. **购房合同风险**：签约前必须仔细审核合同条款，必要时咨询专业律师

如需了解更多详情或有任何疑问，请随时咨询我们的客服人员。`;
      
      // 更新状态为完成
      matchingStatus.value = 'complete';
      stopMatchingTimer();
      reportGenerationDuration.value = matchingTimer.value;
      
      // 添加初始系统消息到咨询消息列表
      consultationMessages.value.push({
        role: 'system',
        content: '您的购房建议报告已生成。关于本次购房需求，您可以继续向AI咨询以获取更多建议。'
      });
      
      // 进入下一步
      nextStep();
    };
    
    // 进入下一步
    const nextStep = () => {
      if (activeStep.value < 3) {
        activeStep.value++;
        
        // 根据当前步骤执行相应的操作
        if (activeStep.value === 2) {
          // 匹配房产步骤
          startPropertyMatching();
        }
      } else {
        // 所有步骤完成，通知父组件
        emit('report-complete', { 
          ...formData.value, 
          report: reportContent.value 
        });
      }
    };
    
    // 下载报告
    const downloadReport = () => {
      try {
        const element = document.createElement('a');
        const file = new Blob([reportContent.value], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `购房建议报告_${formData.value.name || '客户'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        ElMessage.success('报告下载成功');
      } catch (error) {
        console.error('下载报告出错:', error);
        ElMessage.error('报告下载失败，请重试');
      }
    };
    
    // 重新开始顾问流程
    const restartAdvisor = () => {
      // 提示用户确认重新开始
      ElMessageBox.confirm(
        '确定要开始新的买家顾问流程吗？',
        '提示',
        {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
        }
      )
        .then(() => {
        // 重置所有状态
          activeStep.value = 1;
          formData.value = {};
          reportContent.value = '';
          matchingStatus.value = 'idle';
          aiThinkingProcess.value = '';
          displayedThinkingProcess.value = '';
          matchingProperties.value = [];
          consultationMessages.value = [];
          consultationInput.value = '';
          
          // 停止所有计时器
          stopMatchingTimer();
          if (thinkingInterval) {
            clearInterval(thinkingInterval);
            thinkingInterval = null;
          }
          
          // 通知父组件重新开始
          emit('step-change', { step: 1, restarted: true });
        })
        .catch(() => {
          // 用户取消，不做任何操作
        });
    };
    
    // 发送咨询消息
    const sendConsultationMessage = async () => {
      if (!consultationInput.value.trim() || consultationLoading.value) return;
      
      const userMessage = {
        role: 'user',
        content: consultationInput.value.trim()
      };
      
      consultationMessages.value.push(userMessage);
      consultationInput.value = '';
      consultationLoading.value = true;
      
      // 重置输入框高度
      setTimeout(adjustInputHeight, 10);
      
      // 启动思考状态显示
      startConsultationThinking();
      
      try {
        // 模拟AI思考过程
        const question = userMessage.content;
        const thinkingProcessContent = `正在分析用户问题："${question}"

思考过程：
1. 提取用户问题的关键信息
   - 用户问询主题: ${question.includes('房价') ? '房价走势' : 
                  question.includes('贷款') ? '购房贷款' :
                  question.includes('首付') ? '首付比例' :
                  question.includes('学区') ? '学区房' :
                  question.includes('投资') ? '投资建议' : '购房咨询'}
   - 问题复杂度: ${question.length > 20 ? '较复杂' : '简单'}
   - 情感倾向: 中性

2. 检索相关知识库信息
   - 检索关键词: ${question.split(' ').join(', ')}
   - 匹配资料: ${
     question.includes('房价') ? '房价走势报告, 区域房价分析' : 
     question.includes('贷款') ? '购房贷款政策, 银行贷款利率对比' :
     question.includes('首付') ? '首付比例规定, 购房成本计算' :
     question.includes('学区') ? '学区房分析, 教育资源分布' :
     question.includes('投资') ? '房产投资分析, 升值潜力研究' : '购房指南, 置业建议'
   }

3. 形成回复策略
   - 回复重点: ${
     question.includes('房价') ? '区域房价走势和影响因素' : 
     question.includes('贷款') ? '最新贷款政策和最优贷款方案' :
     question.includes('首付') ? '首付比例选择和资金规划' :
     question.includes('学区') ? '学区房特点和选购建议' :
     question.includes('投资') ? '投资回报率分析和风险提示' : '个性化购房建议'
   }
   - 推荐房源: ${
     formData.value.totalBudget > 300 ? '华润万象城' :
     formData.value.purpose === 'investment' ? '华润万象城' :
     formData.value.purpose === 'self_use' ? '翡翠天际' : '绿城花园'
   }`;

        // 将思考过程存储为完整内容以备后用
        const fullThinkingContent = thinkingProcessContent;
        
        // 先添加一个空字符串到思考过程数组
        consultationThinkingProcesses.value.push('');
        
        // 获取当前思考过程的索引
        const currentThinkingIndex = consultationThinkingProcesses.value.length - 1;
        
        // 准备逐字显示
        let typingIndex = 0;
        const startTime = Date.now();
        const totalLength = fullThinkingContent.length;
        
        // 计算每秒应该显示的字符数，控制在10秒左右完成
        const charsPerSecond = totalLength / 10;
        
        // 完成咨询思考过程的显示函数
        const completeConsultationThinking = () => {
          // 确保显示完整内容
          consultationThinkingProcesses.value[currentThinkingIndex] = fullThinkingContent;
          
          // 生成回复内容
          let reply = '';
          
          if (question.includes('房价') || question.includes('价格')) {
            reply = `### 关于房价走势的分析

根据最新市场数据，${Array.isArray(formData.value.preferredAreas) ? formData.value.preferredAreas.join('、') : '您关注的区域'}房价在过去一年呈现稳中有升态势，整体涨幅在3-5%之间。其中：

- **翡翠天际**所在区域：过去一年上涨约4.2%，预计未来1-2年仍有3-5%的增长空间
- **绿城花园**所在区域：过去一年上涨约3.1%，增速较为平稳
- **华润万象城**所在区域：作为城市核心区域，过去一年上涨约5.8%，增速领先

影响未来房价的因素主要有：
1. 区域内新增地铁线路开通
2. 教育医疗资源规划落地
3. 商业配套设施完善程度
4. 政府调控政策变化

从长期来看，优质区域的房产仍具有较好的保值增值能力，特别是学区房和交通便利的房源更具抗跌性。`;
          } else if (question.includes('贷款') || question.includes('利率')) {
            reply = `### 购房贷款最新情况

目前市场上主流银行的房贷利率情况：
- 首套房贷款利率：LPR(3.65%)-20至-30个基点，约为3.35%-3.45%
- 二套房贷款利率：LPR+20至+40个基点，约为3.85%-4.05%

贷款方案对比（以${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100)}万贷款为例）：

| 贷款年限 | 月供(30年期) | 月供(20年期) | 月供(10年期) | 总利息(30年期) |
|---------|------------|------------|------------|--------------|
| 金额 | ${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 10000 * 0.0049 / 12)}元 | ${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 10000 * 0.0056 / 12)}元 | ${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 10000 * 0.0086 / 12)}元 | ${Math.floor(formData.value.totalBudget * 0.95 * (100 - (formData.value.downPaymentRatio || 30)) / 100 * 0.6)}万元 |

对于您的情况，我建议：
1. 考虑20-30年期的贷款，月供压力较小
2. 多家银行对比，争取最优利率
3. 可以考虑组合贷款（商业贷款+公积金贷款）降低综合利率
4. 保留适当提前还款能力，当资金宽裕时可部分提前还款减少利息支出`;
          } else if (question.includes('学区') || question.includes('学校')) {
            reply = `### 关于学区房的详细分析

在您关注的区域中，学区资源分布情况：

**翡翠天际**：
- 对口小学：市实验小学（市重点，评分9.2/10）
- 对口中学：第一中学（省重点，评分9.5/10）
- 教育配套：小区周边2公里内有3家知名幼儿园，1家少年宫
- 学区优势：师资力量强，硬件设施完善，升学率高

**华润万象城**：
- 对口小学：外国语小学（市重点，评分9.4/10）
- 对口中学：外国语学校（省重点，评分9.6/10）
- 教育配套：小区自带高端幼儿园，周边有多家培训机构
- 学区优势：国际化教育，师资优质，小班教学

**绿城花园**：
- 对口小学：区实验小学（区重点，评分8.4/10）
- 对口中学：区重点中学（区重点，评分8.2/10）
- 教育配套：小区内有一家幼儿园，周边教育资源一般
- 学区优势：班级人数较少，师生比例优良

如果教育是您的首要考虑因素，建议优先考虑翡翠天际或华润万象城。不过需注意：
1. 学区政策可能会有变动，建议购买前再次确认
2. 学区房通常溢价10-15%，需权衡投入与收益
3. 考虑子女未来是否会在此长期就读`;
          } else if (question.includes('投资') || question.includes('回报')) {
            reply = `### 房产投资分析与建议

从投资角度评估三处房源：

**华润万象城**（投资评分：★★★★★）
- 优势：城市核心区位，稀缺资源，配套完善，流动性强
- 风险：价格已处高位，未来涨幅可能有限，持有成本高
- 投资回报：预计年租金回报率3.2%，5年增值潜力20-25%
- 适合策略：中长期持有，适合保值为主的稳健投资

**翡翠天际**（投资评分：★★★★☆）
- 优势：性价比高，学区房属性，未来规划利好
- 风险：区域发展依赖规划落地，短期流动性一般
- 投资回报：预计年租金回报率3.8%，5年增值潜力15-20%
- 适合策略：中长期持有，兼顾居住和投资价值

**绿城花园**（投资评分：★★★☆☆）
- 优势：价格较低，首付压力小，居住舒适度高
- 风险：区域较为成熟，增值空间有限，教育资源一般
- 投资回报：预计年租金回报率4.0%，5年增值潜力10-15%
- 适合策略：自住为主，投资为辅

投资建议：
1. 如纯投资目的，推荐华润万象城，稀缺性和流动性是核心优势
2. 如自住兼投资，推荐翡翠天际，性价比和潜力平衡
3. 如预算有限，可考虑绿城花园，但主要价值在于居住而非投资

请注意，房产投资周期长，流动性低，建议做好5年以上的资金规划，并关注市场政策变化`;
          } else {
            reply = `综合购房建议

基于您的需求和当前市场情况，我为您提供以下建议：

1. **选择建议**
   结合您的购房目的（${formData.value.purpose === 'investment' ? '投资' : 
                      formData.value.purpose === 'self_use' ? '自住' : 
                      formData.value.purpose === 'both' ? '自住+投资' : '未指定'}）和预算（${formData.value.totalBudget || 0}万元），建议优先考虑翡翠天际，它在性价比、学区配套和未来增值潜力上取得了很好的平衡。

2. **议价技巧**
   - 准备充分的市场调研数据，了解同区域、同户型的成交价
   - 找出房源的不足之处（如临近主干道可能有噪音）作为议价点
   - 寻找开发商或业主的销售压力点（如去化率低、资金回笼需求等）
   - 合理出价，首次出价可在挂牌价的92-95%左右
   - 全款或高首付可以争取更大折扣

3. **购房时机**
   当前市场处于政策相对宽松期，利率处于低位，是较好的入市时机。尤其是翡翠天际所在区域有新增地铁规划，建议在规划实施前入手，享受未来增值。

4. **签约注意事项**
   - 核实房产证、土地证是否齐全，产权是否清晰
   - 确认交房标准、装修标准及违约责任
   - 明确各项税费的承担方式
   - 注意合同中关于延期交房、质量问题的违约责任条款
   - 二手房需确认无抵押、无查封等限制

5. **其他提醒**
   - 贷款审批可能需要4-6周，建议提前办理
   - 物业管理水平直接影响居住体验，可向现有业主了解
   - 实地看房时注意水电、暖气等基础设施运行情况
   - 考虑未来家庭结构变化，选择具有一定空间弹性的户型

祝您购房顺利！如有其他具体问题，欢迎随时咨询。`;
          }
          
          // 延迟一定时间后模拟AI回复
          setTimeout(() => {
            // 添加回复到消息列表
            consultationMessages.value.push({
              role: 'assistant',
              content: reply
            });
            
            // 更新状态
            consultationLoading.value = false;
            stopConsultationThinking('success');
            
            // 自动滚动到底部
            setTimeout(() => {
              const messagesContainer = document.querySelector('.chat-messages');
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 100);
          }, 1000);
        };
        
        // 创建逐字显示的计时器
        const typingInterval = setInterval(() => {
          if (typingIndex < fullThinkingContent.length) {
            // 计算当前已经过的时间(秒)
            const elapsedTime = (Date.now() - startTime) / 1000;
            
            // 计算按当前速度应该显示到的索引位置
            const targetIndex = Math.floor(elapsedTime * charsPerSecond);
            
            // 计算本次应该显示多少字符
            let chunkSize = 1;
            
            // 如果落后于目标进度，则加速
            if (typingIndex < targetIndex - 10) {
              chunkSize = 3; // 严重落后，快速追赶
            } else if (typingIndex < targetIndex - 5) {
              chunkSize = 2; // 略有落后，稍微加速
            }
            
            // 保证不会越界
            const remainingChars = fullThinkingContent.length - typingIndex;
            const actualChunkSize = Math.min(chunkSize, remainingChars);
            
            // 添加字符块到显示内容
            const nextChunk = fullThinkingContent.substring(typingIndex, typingIndex + actualChunkSize);
            
            // 更新数组中对应索引的内容
            consultationThinkingProcesses.value[currentThinkingIndex] += nextChunk;
            typingIndex += actualChunkSize;
            
            // 检查是否遇到特殊字符需要停顿
            const lastChar = nextChunk[nextChunk.length - 1];
            if (lastChar === '。' || lastChar === '\n' || lastChar === '：') {
              // 句子结束后稍微暂停
              clearInterval(typingInterval);
              setTimeout(() => {
                // 自动滚动到底部
                const thinkingContent = document.querySelector('.thinking-content');
                if (thinkingContent) {
                  thinkingContent.scrollTop = thinkingContent.scrollHeight;
                }
                
                // 继续逐字显示
                const continuedInterval = setInterval(() => {
                  if (typingIndex < fullThinkingContent.length) {
                    // 添加下一个字符
                    const nextChar = fullThinkingContent[typingIndex];
                    consultationThinkingProcesses.value[currentThinkingIndex] += nextChar;
                    typingIndex++;
                    
                    // 自动滚动到底部
                    const thinkingContent = document.querySelector('.thinking-content');
                    if (thinkingContent) {
                      thinkingContent.scrollTop = thinkingContent.scrollHeight;
                    }
                  } else {
                    // 所有内容显示完毕
                    clearInterval(continuedInterval);
                    completeConsultationThinking();
                  }
                }, 40); // 较慢速度继续显示
              }, 200); // 短暂停顿
              return;
            }
            
            // 自动滚动到底部
            const thinkingContent = document.querySelector('.thinking-content');
            if (thinkingContent) {
              thinkingContent.scrollTop = thinkingContent.scrollHeight;
            }
          } else {
            // 所有内容显示完毕
            clearInterval(typingInterval);
            completeConsultationThinking();
          }
        }, 30); // 基础显示间隔
      } catch (error) {
        console.error('发送咨询消息出错:', error);
        consultationLoading.value = false;
        stopConsultationThinking('error', '请求失败，请重试');
        ElMessage.error('发送失败，请重试');
      }
    };
    
    // 折叠/展开思考过程
    const toggleThinkingProcess = () => {
      isThinkingExpanded.value = !isThinkingExpanded.value
    }
    
    // 开始咨询思考状态计时
    const startConsultationThinking = () => {
      consultationThinkingTimer.value = 0;
      consultationThinkingDots.value = '';
      consultationResponseStatus.value = '';
      consultationResponseTime.value = 0;
      
      // 启动计时器
      consultationThinkingInterval = setInterval(() => {
        consultationThinkingTimer.value++;
        // 动态更新省略号
        consultationThinkingDots.value = '.'.repeat((consultationThinkingTimer.value % 3) + 1);
      }, 1000);
    };
    
    // 停止咨询思考状态计时
    const stopConsultationThinking = (status = 'success', error = '') => {
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
        consultationThinkingInterval = null;
        consultationResponseTime.value = consultationThinkingTimer.value;
        consultationThinkingTimer.value = 0;
        consultationThinkingDots.value = '';
        
        // 设置响应状态
        if (status === 'success') {
          consultationResponseStatus.value = 'AI已回复';
        } else {
          consultationResponseStatus.value = error || '请求失败';
        }
      }
    };
    
    // 调整输入框高度
    const adjustInputHeight = () => {
      try {
        // 如果已经有等待执行的调整，不再重复安排
        if (adjustHeightTimer) {
          clearTimeout(adjustHeightTimer);
        }
        
        // 使用requestAnimationFrame确保在浏览器下一次重绘之前调用函数，提高实时性
        requestAnimationFrame(() => {
          try {
            const inputArea = document.querySelector('.chat-input');
            const textarea = document.querySelector('.chat-input .el-textarea__inner');
            const sendButton = document.querySelector('.chat-input .el-button');
            
            if (inputArea && textarea) {
              // 计算输入区域应有的高度 = 文本区高度 + padding + border
              const textareaHeight = textarea.scrollHeight;
              // 文本区高度 + 上下padding(12px*2) + 区域内间距
              let inputHeight = textareaHeight + 24 + 8; 
              
              // 限制最小和最大高度（对应2-3行文本）
              inputHeight = Math.max(60, Math.min(90, inputHeight));
              
              // 设置输入区域高度
              inputArea.style.height = `${inputHeight}px`;
              
              // 调整发送按钮高度，直接跟随文本区高度变化
              if (sendButton) {
                // 按钮高度与文本区保持一致，稍微减小一点以保持美观
                // 同时限制最大高度，不超过输入框的最大高度
                const maxButtonHeight = 64; // 输入框最大高度(90px) - 上下padding(12px*2) ≈ 66px
                const buttonHeight = Math.min(maxButtonHeight, textareaHeight - 2);
                sendButton.style.height = `${buttonHeight}px`;
              }
            }
          } catch (e) {
            console.warn('调整输入框高度渲染错误:', e);
          }
        });
        
        // 使用setTimeout提供一个小延迟，让连续的多次调用合并为一次
        adjustHeightTimer = setTimeout(adjustInputHeightImmediate, 16); // 约1帧的时间
      } catch (e) {
        console.warn('调整输入框高度出错:', e);
      }
    };
    
    // 立即调整高度的辅助方法，不使用requestAnimationFrame以避免冲突
    const adjustInputHeightImmediate = () => {
      const textarea = document.querySelector('.chat-input .el-textarea__inner');
      const sendButton = document.querySelector('.chat-input .el-button');
      
      if (textarea && sendButton) {
        const textareaHeight = textarea.scrollHeight;
        const oldButtonHeight = sendButton.style.height;
        
        // 限制最大按钮高度，与输入框最大高度保持一致
        const maxButtonHeight = 64; // 输入框最大高度(90px) - 上下padding(12px*2) ≈ 66px
        const buttonHeight = Math.min(maxButtonHeight, textareaHeight - 2);
        
        sendButton.style.height = `${buttonHeight}px`;
      }
    };
    
    // 处理Shift+Enter键，用于换行
    const handleShiftEnter = (e) => {
      // Shift+Enter用于插入换行
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      consultationInput.value = value.substring(0, start) + '\n' + value.substring(end);
      // 下一个tick移动光标到换行符后
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        // 当插入换行时调整高度
        adjustInputHeight();
      }, 0);
    };
    
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
    
    // 开始水平调整大小
    const startResizeHorizontal = (e) => {
      isResizingHorizontal.value = true;
      document.addEventListener('mousemove', resizeHorizontal);
      document.addEventListener('mouseup', stopResizeHorizontal);
      // 记录初始位置
      lastResizeTime = Date.now();
    };
    
    // 水平调整大小处理
    const resizeHorizontal = (e) => {
      if (!isResizingHorizontal.value) return;
      
      const container = document.querySelector('.report-layout');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const percent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // 限制调整范围
      if (percent >= 30 && percent <= 80) {
        horizontalSplit.value = percent;
        
        // 更新组件根元素的CSS变量
        const reportContainer = document.querySelector('.property-advisor-report');
        if (reportContainer) {
          reportContainer.style.setProperty('--horizontal-split', `${percent}%`);
        }
        
        // 实时更新输入框容器的样式，确保它总是占据右侧部分的全宽
        requestAnimationFrame(() => {
          // 强制刷新布局并更新输入区域样式
          const chatInput = document.querySelector('.chat-input');
          const chatRightSection = document.querySelector('.report-right-bottom');
          
          if (chatInput && chatRightSection) {
            // 确保输入区域宽度与右侧底部区域匹配
            chatInput.style.width = '100%';
            chatInput.style.left = '0';
            chatInput.style.right = '0';
          }
        });
      }
    };
    
    // 停止水平调整大小
    const stopResizeHorizontal = () => {
      isResizingHorizontal.value = false;
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
    };
    
    // 开始垂直调整大小
    const startResizeVertical = (e) => {
      isResizingVertical.value = true;
      document.addEventListener('mousemove', resizeVertical);
      document.addEventListener('mouseup', stopResizeVertical);
      // 记录初始位置
      lastResizeTime = Date.now();
    };
    
    // 垂直调整大小处理
    const resizeVertical = (e) => {
      if (!isResizingVertical.value) return;
      
      if (resizeThrottleTimeout) {
        clearTimeout(resizeThrottleTimeout);
      }
      
      resizeThrottleTimeout = setTimeout(() => {
        const container = e.target.closest('.report-right') || document.querySelector('.report-right');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const mouseY = e.clientY - containerRect.top;
        
        // 计算分隔比例，限制在20%-80%之间
        let percentage = Math.max(20, Math.min(80, (mouseY / containerRect.height) * 100));
        verticalSplit.value = percentage;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--vertical-split', `${percentage}%`);
        
        // 防止滚动内容自动弹跳
        // 延迟一会儿后刷新布局
        setTimeout(() => {
          // 触发一次布局刷新，但不强制滚动
          scrollToBottom('.thinking-content', false);
          scrollToBottom('.chat-messages', false);
        }, 100);
      }, 10);
    };
    
    // 停止垂直调整大小
    const stopResizeVertical = () => {
      isResizingVertical.value = false;
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
    };
    
    // 组件挂载时执行
    onMounted(() => {
      // 设置初始垂直分隔位置
      document.documentElement.style.setProperty('--vertical-split', `${verticalSplit.value}%`);
      
      // 不再在document level设置horizontal-split，而是依赖组件级别的CSS变量
      
      // 设置初始的聊天输入框宽度
      document.documentElement.style.setProperty('--chat-input-width', '100%');
      
      // 注册窗口大小变化事件
      window.addEventListener('resize', () => {
        // 延迟执行，避免频繁触发
        if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
        resizeThrottleTimeout = setTimeout(() => {
          adjustInputHeight();
        }, 100);
      });
      
      // 创建MutationObserver来监听输入框高度变化
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            adjustInputHeight();
          }
        });
      });
      
      // 启动定期检查高度变化
      autoHeightCheckInterval = setInterval(() => {
        adjustInputHeight();
      }, 2000); // 每2秒检查一次
    });
    
    // 组件卸载时执行
    onUnmounted(() => {
      // 清除定时器
      stopMatchingTimer();
      if (thinkingInterval) clearInterval(thinkingInterval);
      if (consultationThinkingInterval) clearInterval(consultationThinkingInterval);
      if (autoHeightCheckInterval) clearInterval(autoHeightCheckInterval);
      if (resizeThrottleTimeout) clearTimeout(resizeThrottleTimeout);
      
      // 移除事件监听器
      window.removeEventListener('resize', adjustInputHeight);
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
      
      // 不再需要清除document level的horizontal-split变量
      document.documentElement.style.removeProperty('--vertical-split');
      document.documentElement.style.removeProperty('--chat-input-width');
      
      // 断开MutationObserver
      if (mutationObserver) mutationObserver.disconnect();
    });
    
    // 添加一个滚动函数，统一管理滚动行为
    const scrollToBottom = (selector, forceScroll = true) => {
      const element = document.querySelector(selector);
      if (element) {
        // 只有当内容接近底部或强制滚动时才滚动到底部
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 30;
        if (forceScroll || isNearBottom) {
          // 使用requestAnimationFrame确保DOM已更新
          requestAnimationFrame(() => {
            element.scrollTop = element.scrollHeight;
          });
        }
      }
    };
    
    // 在显示思考过程的地方替换直接滚动的代码
    // 例如，在处理思考过程时:
    // 自动滚动到底部
    scrollToBottom('.thinking-display');
    
    return {
      activeStep,
      formData,
      matchingStatus,
      matchingTimer,
      matchingProperties,
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
      horizontalSplit,
      verticalSplit,
      aiThinkingProcess,
      matchThinkingContent,
      consultationThinkingProcesses, // 添加这一行，确保将consultationThinkingProcesses暴露到模板
      renderMarkdown,
      handleFormSubmit,
      startPropertyMatching,
      nextStep,
      downloadReport,
      restartAdvisor,
      sendConsultationMessage,
      handleShiftEnter,
      startResizeHorizontal,
      startResizeVertical,
      startMatchingTimer,
      stopMatchingTimer,
      stopThinkingProcess
    };
  }
};
</script>

<style lang="scss" scoped>
/* 步骤条自定义样式 */
:deep(.el-steps--simple) {
  background-color: #ffffff !important;
}

:deep(.el-step__title.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

:deep(.el-step__head.is-success) {
  color: #1b68de !important;
  border-color: #1b68de !important;
}

.property-advisor-report {
  display: flex;
  flex-direction: column;
  height: 100%; /* 使用百分比高度填充父容器 */
  width: 100%;
  position: relative;
  overflow: hidden;
  --horizontal-split: 55%; /* 在组件根元素上设置CSS变量 */
}

.steps-header {
  border-bottom: 1px solid #ebeef5;
  background-color: white;
}

.step-content {
  flex: 1;
  overflow: hidden; /* 更改为hidden，防止外层滚动 */
  padding: 0;
  position: relative;
}

.step-container {
  height: 100%;
  overflow: auto; /* 保留auto，允许内容滚动 */
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  
  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: spin 2s linear infinite;
  }
  
  p {
    font-size: 16px;
    text-align: center;
    max-width: 400px;
    line-height: 1.5;
  }
}

.product-matching-container {
  position: relative;
  height: 100%;
}

.matching-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.overlay-content {
  width: 90%;
  max-width: 900px;  
  overflow: hidden;
}

.ai-wait-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
}

/* 主内容区域 */
.ai-wait-content {
  display: flex;
  padding: 20px 30px 30px;
}

/* 左侧动画 */
.wait-animation {
  flex: 0 0 220px;
  align-self: center;
  margin-right: 40px;
}

.animation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .loading-brain {
    margin-bottom: 0; /* 移除底部外边距 */
  }
  
  .loading-dots {
    display: flex;
    gap: 10px;
    margin-top: -10px;
    
    span {
      width: 5px;
      height: 5px;
      background-color: #1b5dd3;
      border-radius: 50%;
      display: inline-block;
      animation: dots-loader 1.4s infinite ease-in-out both;
      
      &:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
  }
}

.wait-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px; /* 设置顶部外边距为20px */

  .ai-timer {
  display: flex;
  align-items: center;
    color: #909399;
    font-size: 14px;
    margin-right: 30px; /* 设置右侧外边距为30px */
    
    .timer-icon {
      margin-right: 2px;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .ai-tip {
    color: #000000;
    font-size: 14px;
  }
}

.brain-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: brain-draw 3s infinite;
}

.pulse-circle {
  animation: pulse 2s infinite;
  opacity: 0.6;
  transform-origin: center;
}

.pulse-circle:nth-child(2) { animation-delay: 0.2s; }
.pulse-circle:nth-child(3) { animation-delay: 0.4s; }
.pulse-circle:nth-child(4) { animation-delay: 0.6s; }
.pulse-circle:nth-child(5) { animation-delay: 0.8s; }
.pulse-circle:nth-child(6) { animation-delay: 1.0s; }
.pulse-circle:nth-child(7) { animation-delay: 1.2s; }

.loading-dots {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.loading-dots span {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin: 0 3px;
  background-color: #1b5dd3;
  border-radius: 50%;
}

.loading-dots span:nth-child(1) {
  animation: dots 1.5s infinite 0s;
}

.loading-dots span:nth-child(2) {
  animation: dots 1.5s infinite 0.3s;
}

.loading-dots span:nth-child(3) {
  animation: dots 1.5s infinite 0.6s;
}


/* 底部区域 */
.wait-footer {
  padding: 14px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-timer {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 13px;
}

.timer-icon {
  margin-left: 8px;
  font-size: 22px;
  color: #909399;
}

.ai-tip {
  color: #000000;
  font-size: 13px;
}

/* 动画效果 */
@keyframes brain-draw {
  0% {
    stroke-dashoffset: 200;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 200;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.3;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
}

@keyframes dots {
  0%, 80%, 100% { 
    transform: translateY(0);
  }
  40% { 
    transform: translateY(-8px);
  }
}

.report-container {
  position: relative;
  height: 100%;
  overflow: hidden; /* 更改为hidden，防止外层滚动 */
}

.report-layout {
  display: grid;
  grid-template-columns: var(--horizontal-split, 55%) calc(100% - var(--horizontal-split, 55%));
  height: 100%;
  position: relative;
  overflow: hidden;
  width: 100%; /* 确保容器占满全宽 */
}

.report-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  max-height: 100%;
  /* 移除宽度控制，grid布局会自动处理 */
}

.report-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  max-height: 100%;
  /* 移除宽度控制，grid布局会自动处理 */
}

.report-right-top {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #dcdfe6;
  height: var(--vertical-split, 50%);
  max-height: var(--vertical-split, 50%);
}

.report-right-bottom {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100% - var(--vertical-split, 50%) - 6px);
  max-height: calc(100% - var(--vertical-split, 50%) - 6px);
  position: relative; /* 确保定位正确 */
}

.report-right-bottom .panel-content {
  flex: 1; /* 使用flex:1自动填充剩余空间 */
  display: flex;
  flex-direction: column;
  position: relative;
  height: auto; /* 移除固定高度计算，改用flex布局自动计算 */
  overflow: hidden; /* 防止内部内容溢出 */
  padding: 0; /* 移除内边距，由chat-messages控制 */
  margin: 0;
}

.report-right-top .panel-content,
.report-right-bottom .panel-content,
.report-left .panel-content {
  /* 确保滚动区域的正确位置和尺寸 */
  overflow-y: auto;
  overflow-x: hidden; /* 禁止所有panel-content的横向滚动 */
  display: flex;
  flex-direction: column;
  max-width: 100%; /* 限制最大宽度 */
  word-wrap: break-word; /* 确保长单词可以断行 */
  word-break: break-all; /* 强制所有内容断行 */
}

.report-left .panel-content {
  overflow-y: auto;
  overflow-x: hidden; /* 再次确认禁止横向滚动 */
  padding-right: 0; /* 移除右侧内边距，确保滚动条紧贴右侧 */
}

.thinking-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 禁止横向滚动 */
  font-size: 14px;
  line-height: 1.6;
  height: 100%;
  width: 100%;
  max-width: 100%; /* 限制最大宽度 */
  color: #606266; /* 灰色文本 */
  white-space: pre-wrap; /* 保留空格和换行 */
  word-wrap: break-word; /* 确保长单词可以断行 */
  word-break: break-all; /* 在任何字符间断行 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 16px;
  text-align: left;
  box-sizing: border-box; /* 确保padding不会导致溢出 */
}

.report-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 防止横向滚动 */
  line-height: 1.6;
  width: 100%;
  padding: 0 12px; /* 添加左右内边距，增加内容与边缘的距离 */
  box-sizing: border-box; /* 确保padding不影响总宽度 */
}

.resizer-vertical {
  position: absolute;
  left: 0;
  width: 100%;
  height: 6px;
  background-color: transparent;
  cursor: row-resize;
  z-index: 10;
  top: var(--vertical-split, 50%);
  transform: translateY(-3px);
}

.resizer-vertical:hover, .resizer-vertical:active {
  background-color: rgba(64, 158, 255, 0.2);
}


.panel-header {
  padding: 0 16px;
  height: 55px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f7fa;
  z-index: 1;
  
  .header-icon {
    margin-right: 6px;
    font-size: 22px;
    color: #1b5dd3;
    vertical-align: middle;
  }
  
  .report-duration {
  font-size: 14px;
    color: #909399;
    font-weight: normal;
    margin-left: 8px;
  }
  
  .response-status {
    font-size: 14px;
    color: #909399;
    font-weight: normal;
    margin-left: 8px;
  }
  
  h3 {
  display: flex;
    align-items: center;
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    
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
    
    /* 添加思考完成状态样式 */
    .thinking-completed {
  font-size: 14px;
      color: #909399;
      font-weight: normal;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
    }
    
    .thinking-completed::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #909399;
      border-radius: 50%;
      margin-right: 6px;
      /* 移除动画，保持静止 */
    }
  }
}


.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  height: 30px;
  font-size: 12px;
  
  .el-icon {
    margin-right: 6px;
  }
}

.panel-content {
  flex: 1;
  box-sizing: border-box;
  background-color: #fff;
  height: calc(100% - 50px); /* 减去header高度 */
  width: 100%; /* 确保占满容器宽度 */
  overflow-y: auto; /* 保持滚动功能 */
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  padding-bottom: 16px; /* 正常内边距，不需要为输入框预留 */
}

.chat-input {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0; /* 防止被压缩 */
  /* 移除绝对定位相关属性，使用flex布局 */
  position: relative;
  bottom: auto;
  left: auto;
  right: auto;
  z-index: 2; /* 确保在内容上层但不需要太高 */
  min-height: 60px; /* 默认最小高度，对应2行文本 */
  max-height: 90px; /* 最大高度，对应3行文本 */
  transition: height 0.2s ease; /* 平滑过渡高度变化 */
}

.chat-input .el-textarea {
  flex: 1;
  width: 100%;
}

/* 使输入区域内的textarea自适应 */
.chat-input .el-textarea :deep(.el-textarea__inner) {
  resize: none; /* 禁用手动调整大小 */
  box-sizing: border-box;
  min-height: 22px; /* 单行文本高度 */
  line-height: 1.5;
  transition: height 0.2s ease;
}

.chat-input .el-button {
  align-self: center; /* 垂直居中对齐 */
  margin: 0;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-height: calc(100% - 12px); /* 按钮高度接近容器高度 */
  height: auto; 
  box-sizing: border-box;
}

.resizer-horizontal {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  left: var(--horizontal-split, 55%);
  transform: translateX(-3px);
  transition: background-color 0.2s;
}

.resizer-horizontal:hover,
.resizer-horizontal:active {
  background-color: rgba(64, 158, 255, 0.2);
}

/* 添加新的样式类用于拖动时的状态 */
.is-resizing {
  user-select: none;
  cursor: col-resize;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Markdown样式 */
:deep(.markdown-content) {
  overflow-x: hidden; /* 禁止markdown内容横向滚动 */
  width: 100%;
  max-width: 100%;
  word-wrap: break-word; /* 确保长单词可断行 */
  word-break: break-word; /* 使用break-word保持一定的可读性 */
  padding: 10px 20px; /* 添加额外的内边距，提高可读性 */
  box-sizing: border-box; /* 确保padding不会导致溢出 */
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    line-height: 1.25;
  }
  
  h1 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }
  
  h2 {
    font-size: 1.3em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }
  
  h3 {
    font-size: 1.2em;
  }
  
  p {
  margin-top: 0;
    margin-bottom: 10px;
  }
  
  ul, ol {
    padding-left: 2em;
    margin-top: 0;
  margin-bottom: 16px;
  }
  
  li {
    margin-bottom: 4px;
  }
  
  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    word-break: break-all; /* 确保代码内容也能断行 */
  }
  
  pre {
    padding: 16px;
    overflow-x: auto; /* 代码块保持横向滚动，但确保容器不溢出 */
    max-width: 100%;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 3px;
    margin-top: 0;
    margin-bottom: 16px;
    white-space: pre-wrap; /* 允许代码块自动换行 */
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    max-width: 100%; /* 限制表格最大宽度 */
    margin-bottom: 16px;
    display: block; /* 对于超宽的表格，确保能够自适应容器 */
    overflow-x: auto; /* 允许表格在需要时横向滚动，但不影响外层容器 */
  }
  
  table th, table td {
    padding: 6px 13px;
    border: 1px solid #dfe2e5;
    min-width: 60px; /* 设置最小宽度防止内容过度挤压 */
    word-break: break-word; /* 允许单元格内容换行 */
  }
  
  table tr {
    background-color: #fff;
    border-top: 1px solid #c6cbd1;
  }
  
  table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }
  
  blockquote {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin: 0 0 16px 0;
  }
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

/* 恢复消息相关的样式 */
.message {
  margin-bottom: 16px;
  max-width: 85%;
}

.thinking-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
}

.thinking-display {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 禁止横向滚动 */
  font-size: 14px;
  line-height: 1.6;
  height: 100%;
  width: 100%;
  max-width: 100%; /* 限制最大宽度 */
  color: #606266; /* 灰色文本 */
  white-space: pre-wrap; /* 保留空格和换行 */
  word-wrap: break-word; /* 确保长单词可以断行 */
  word-break: break-all; /* 在任何字符间断行 */
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  padding: 16px;
  text-align: left;
  box-sizing: border-box; /* 确保padding不会导致溢出 */
  transition: opacity 0.3s ease;
  
  &.dimmed {
    opacity: 0.5; /* 生成报告时轻微降低思考内容的显示强度 */
  }
}

.generating-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none; /* 允许点击穿透 */
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
  
  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #c3c3c3;
    border-top: 3px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
  
  .generating-message {
    font-size: 14px;
    font-weight: 400;
    color: #ffffff;
    white-space: nowrap;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.report-right-bottom :deep(.markdown-content) {
  overflow-x: hidden; /* 禁止markdown内容横向滚动 */
  width: 100%;
  max-width: 100%;
  word-wrap: break-word; /* 确保长单词可断行 */
  word-break: break-word; /* 使用break-word保持一定的可读性 */
  box-sizing: border-box; /* 确保padding不会导致溢出 */
  
  /* 表格样式微调 */
  table {
  font-size: 14px;
    margin-bottom: 10px;
  }
  
  table th, table td {
    padding: 4px 8px;
    min-width: 50px;
  }
  
  /* 代码块微调 */
  pre {
    padding: 10px;
    font-size: 13px;
    margin-bottom: 10px;
    max-width: 100%;
  }
  
  /* 列表样式微调 */
  ul, ol {
    padding-left: 1.5em;
    margin-top: 0;
    margin-bottom: 10px;
  }
}

/* 为聊天区域添加特定的样式调整，增强可读性和外观 */
.report-right-bottom {
  /* 布局结构 */
  display: flex;
  flex-direction: column;
  
  /* 聊天消息容器样式 */
  .chat-messages {
    flex: 1; /* 填充可用空间 */
    overflow-y: auto; /* 确保可以垂直滚动 */
    overflow-x: hidden; /* 禁止水平滚动 */
    padding: 16px;
    padding-bottom: 16px; /* 正常内边距，不需要为输入框预留 */
    display: flex;
    flex-direction: column;
  }
  
  /* 输入区域样式 */
.chat-input {
    flex-shrink: 0; /* 防止被压缩 */
    border-top: 1px solid #ebeef5;
    background-color: #fff;
  display: flex;
    flex-direction: row;
    align-items: center; /* 确保垂直居中 */
    gap: 8px;
    padding: 12px 16px;
    min-height: 60px; /* 默认最小高度 */
    max-height: 90px; /* 最大高度限制，对应约3行文本 */
    transition: height 0.2s ease; /* 平滑过渡高度变化 */
    
    /* 输入区域内的按钮样式 */
    .el-button {
      align-self: center; /* 确保在容器中垂直居中 */
      margin: 0;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      min-height: 36px; /* 最小高度 */
      max-height: 64px; /* 最大高度限制，与调整逻辑中设置的一致 */
      box-sizing: border-box;
      transition: height 0.2s ease, opacity 0.2s ease; /* 平滑过渡高度变化 */
    }
  }
  
  /* 消息基础样式 */
  .message {
    margin-bottom: 16px;
    max-width: 80%;
    box-sizing: border-box;
    
    /* 用户消息样式 */
    &.user {
      align-self: flex-end;
      margin-left: auto;
      margin-right: 8px;
      
      .text {
        background: #ecf5ff;
        color: #303133;
        white-space: pre-wrap;
        overflow-x: hidden;
        border-top-right-radius: 0;
        text-align: left;
      }
    }
    
    /* AI助手消息样式 */
    &.assistant {
      align-self: flex-start;
      margin-right: auto;
      margin-left: 8px;
      
      .text {
        background: #ffffff;
        overflow-x: hidden;
        border-top-left-radius: 0;
        padding-top: 6px; /* 减少顶部内边距，使文本更接近头像顶部 */
      }
      
      /* 移除这个内部的margin-top设置，避免冲突 */
      /* .ai-avatar {
        margin-top: 10px;
      } */
    }
    
    /* 系统消息样式 */
    &.system {
      align-self: center;
      max-width: 90%;
      // background-color: #f1f2f7;
      // border-radius: 16px;
      
      .text {
        background-color: transparent;
        color: #909399;
        text-align: center;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
      }
    }
  }
  
  /* 消息内容布局 */
  .message-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
  
  /* AI头像样式 */
  .ai-avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: #1b68de;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
    font-size: 12px;
    align-self: flex-start; /* 确保头像顶部对齐 */
    margin-top: 6px; /* 调整头像位置，使其与文本第一行对齐 */
  }
  
  /* 文本样式 */
  .text {
    padding: 10px 12px;
    border-radius: 6px;
    line-height: 1.5;
    word-break: break-word;
    width: auto;
    min-width: 50px;
    max-width: 100%;
    overflow-wrap: break-word;
    box-sizing: border-box;
  }
  
  /* 消息样式细节优化 */
  .assistant .message-content {
    align-items: flex-start; /* 确保内容顶部对齐 */
  }
  
  .assistant .text {
    margin-top: 0; /* 确保文本没有顶部边距 */
  }
}


.thinking-separator {
  margin: 30px 0 20px 0;
  display: flex;
  align-items: center;
  // background-color: #f0f6ff;
  // border-left: 4px solid #1b5dd3;
  // border-radius: 4px;
}

.separator-line {
  flex: 1;
  height: 3px;
  background: radial-gradient(circle at 0 1px, #6595dd 30%, transparent 30%);
  background-size: 5px 2px; /* 控制圆点间距 */
  background-repeat: repeat-x;
  opacity: 0.6;
}

.separator-text {
  padding: 0 16px;
  font-size: 14px;
  color: #1b68de;
  font-weight: 400;
}
</style>