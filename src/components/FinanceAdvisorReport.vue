<template>
  <div class="finance-advisor-report">
    <!-- 处理步骤区域 - 只在第一步之后显示 -->
    <div class="steps-header" v-if="activeStep > 1">
      <el-steps :active="activeStep" finish-status="success" process-status="process" simple>
        <el-step title="提交客户需求" />
        <el-step v-if="hasCreditReport" title="AI分析征信报告" />
        <el-step title="匹配金融产品" />
        <el-step title="生成融资报告" />
      </el-steps>
    </div>
    
    <!-- 各步骤对应的内容区域 -->
    <div class="step-content">
      <!-- 步骤1: 客户需求提交 -->
      <div v-if="activeStep === 1" class="step-container">
        <FinanceAdvisorForm @submit="handleFormSubmit" />
      </div>
      
      <!-- 步骤2: AI分析征信报告 (仅在上传了征信报告时显示) -->
      <div v-if="hasCreditReport && activeStep === 2" class="step-container">
        <div class="placeholder-content">
          <el-icon><Loading /></el-icon>
          <p>AI正在分析客户征信报告，该功能正在开发中...</p>
        </div>
      </div>
      
      <!-- 步骤3: 匹配金融产品 -->
      <div v-if="(hasCreditReport && activeStep === 3) || (!hasCreditReport && activeStep === 2)" class="step-container">
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
                  <div class="generating-message">即将生成融资建议报告...</div>
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
      
      <!-- 步骤4: 生成融资报告 -->
      <div v-if="(hasCreditReport && activeStep === 4) || (!hasCreditReport && activeStep === 3)" class="step-container">
        <div class="report-container">
          <div class="report-layout">
            <!-- 左侧AI分析结果 -->
            <div class="report-left">
              <div class="panel-header">
                <h3>
                  <el-icon class="header-icon"><Document /></el-icon>
                  融资顾问报告 <span v-if="reportGenerationDuration > 0" class="report-duration">耗时{{reportGenerationDuration}}秒</span>
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
                      AI正在准备回答中{{consultationThinkingDots}}，{{consultationThinkingTimer}}秒
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Loading, Download, InfoFilled, Refresh, ArrowDown, Document, Cpu, ChatDotSquare, Timer } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import FinanceAdvisorForm from './FinanceAdvisorForm.vue';
import { sendMessage } from '../api/chat';
import financingAdvicePrompt from '../config/prompts/financing-advice.js';

export default {
  name: 'FinanceAdvisorReport',
  components: {
    FinanceAdvisorForm,
    Loading,
    Download,
    InfoFilled,
    Refresh,
    ArrowDown,
    Document,
    Cpu,
    ChatDotSquare,
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
    const activeStep = ref(1);
    
    // 是否上传了征信报告
    const hasCreditReport = ref(false);
    
    // 用户提交的表单数据
    const formData = ref(props.initialData || {});
    
    // 匹配产品的状态
    const matchingStatus = ref('idle'); // idle, matching, thinking, generating, complete
    
    // 匹配计时器
    const matchingTimer = ref(0);
    let matchingTimerInterval = null;
    
    // 匹配结果
    const matchingResult = ref(null);
    
    // AI匹配产品思考过程
    const aiThinkingProcess = ref('');
    const displayedThinkingProcess = ref(''); // 用于逐字显示的思考过程
    const isThinking = ref(false); // AI是否正在思考
    let thinkingInterval = null; // 思考过程展示的计时器
    let thinkingIndex = 0; // 当前处理到的思考内容索引
    
    // 报告内容
    const reportContent = ref('');
    const reportGenerationDuration = ref(0);
    
    // 咨询相关
    const consultationMessages = ref([]);
    const consultationInput = ref('');
    const consultationLoading = ref(false);
    const consultationThinkingTimer = ref(0);
    const consultationThinkingDots = ref('');
    const consultationResponseStatus = ref('');
    const consultationResponseTime = ref(0);
    const consultationThinkingProcesses = ref([]); // 存储多个思考过程的数组
    let consultationThinkingInterval = null;
    let mutationObserver = null; // 用于监听输入框高度变化
    let autoHeightCheckInterval = null; // 用于定期检查高度变化
    
    // 分栏调整
    const horizontalSplit = ref(60);
    const isResizingHorizontal = ref(false);
    let resizeThrottleTimeout = null;
    let lastResizeTime = 0;
    
    // 垂直分隔线相关
    const verticalSplit = ref(50);
    const isResizingVertical = ref(false);
    
    // 计算实际的步骤数量
    const totalSteps = computed(() => hasCreditReport.value ? 4 : 3);
    
    // 初始匹配产品的思考内容
    const matchThinkingContent = ref('');
    
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
    };
    
    // 开始匹配产品的计时器
    const startMatchingTimer = () => {
      matchingTimer.value = 0;
      matchingTimerInterval = setInterval(() => {
        matchingTimer.value++;
      }, 1000);
    };
    
    // 停止匹配产品的计时器
    const stopMatchingTimer = () => {
      if (matchingTimerInterval) {
        clearInterval(matchingTimerInterval);
        matchingTimerInterval = null;
      }
    };
    
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
      // 使用requestAnimationFrame确保在浏览器下一次重绘之前调用函数，提高实时性
      requestAnimationFrame(() => {
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
          
          // 确保样式变化已被应用后再次检查高度匹配
          setTimeout(() => {
            // 再次获取实际高度，确保按钮与文本区完全同步
            const actualTextareaHeight = textarea.scrollHeight;
            if (sendButton && actualTextareaHeight !== textareaHeight) {
              // 限制最大高度
              const maxButtonHeight = 64; // 对应输入框最大高度减去padding
              const buttonHeight = Math.min(maxButtonHeight, actualTextareaHeight - 2);
              sendButton.style.height = `${buttonHeight}px`;
            }
          }, 0);
        }
      });
      
      // 双重保险：在下一个事件循环中再次检查，确保完全同步
      setTimeout(adjustInputHeightImmediate, 16); // 约1帧的时间
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
        
        // 输出高度变化信息到控制台，帮助调试
        console.log(`调整按钮高度: 文本区高度=${textareaHeight}px, 按钮高度从${oldButtonHeight}变为${sendButton.style.height}，最大限制=${maxButtonHeight}px`);
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
    
    // 开始匹配产品
    const startProductMatching = async () => {
      try {
        matchingStatus.value = 'matching';
        startMatchingTimer();
        
        // 构建用于匹配产品的消息
        const productMatchingMessage = {
          role: 'user',
          content: `我需要融资，具体需求如下：
          - 贷款类型: ${formData.value.loanType || '未指定'}
          - 贷款金额: ${formData.value.loanAmount ? formData.value.loanAmount + '万元' : '未指定'}
          - 贷款期限: ${formData.value.minLoanTerm}-${formData.value.maxLoanTerm || 0}月
          - 利率范围: ${formData.value.minInterestRate}-${formData.value.maxInterestRate || 0}%
          - 还款方式: ${formData.value.repaymentMethod?.join(', ') || '未指定'}
          - 其他需求: ${formData.value.additionalNotes || '无'}
          - 关键词: ${getKeywordsText(formData.value.aiKeywords)}`
        };
        
        // 添加征信报告信息（如果有）
        if (hasCreditReport.value) {
          productMatchingMessage.content += `\n\n我有征信报告，报告显示我的信用情况良好。`;
        }
        
        // 设置固定等待时间为5秒后再模拟AI思考过程
        // 在实际接入AI时，移除此代码，使用真实的等待时间
        setTimeout(() => {
          // 强制设置matchingTimer为5秒，模拟固定的等待时间
          matchingTimer.value = 5;
          
          // 模拟AI思考过程
          // 设置完整的AI思考过程数据
          const fullThinkingProcess = `从客户描述中提取到的个人信息：
首先，我需要处理报告的基本信息。但提供的文件中并没有包含姓名、证件类型、证件号码、婚姻状态、报告时间和报告编号等信息。因此，在报告基本信息部分，可能都需要填写"未获得此信息"。

接下来是征信报告内容。首先是贷款明细。在用户提供的第16页中，有多个授信协议，看起来像是贷款或信用额度。例如，授信协议1到授信协议11。每个协议都有授信额度、已用额度、下种等信息。需要将这些信息整理成贷款明细表格。
根据表格要求，需要管理机构、业务种类、借款金额、当前余额、余额占比、状态。其中，如果当前余额等于授信额度，可能状态为未结清，需要加粗。但需要确认每个协议的状态是否为未结清。例如，授信协议1的已用额度等于授信额度，说明可能已全部使用，状态可能为未结清。同样，授信协议3的已用额度接近授信额度，授信协议4的已用额度超过授信额度，可能存在风险，需要加粗。授信协议2的已用额度为0，可能未使用，状态为结清?

但用户提供的授信协议信息中，业务种类可能都是"领取贷款额度"，但不确定是属于贷款或贷记卡。需要进一步确认。如果都是贷款，则归入贷款明细；如果是贷记卡，则归入贷记卡明细。但根据表格中的"授信额度用途"为"领取贷款额度"，推测可能是贷款类业务。

然后，贷记卡明细。用户提供的授信协议信息中是否有贷记卡？可能没有明确提到。需要检查是否有贷记卡相关信息。如果没有，贷记卡明细可能显示"未获得此信息"。

担保责任明细部分，用户提供的文件中没有相关数据，因此可能也是"未获得此信息"。

查询记录部分，当前月份是2025年03月。需要查找近三个月（2025年01月、02月、03月）和近半年（2024年10月至2025年03月）的查询次数。但用户提供的文件中没有查询记录的信息，所以可能结果为0次，但根据用户指示，如果没有数据应填写"未获得此信息"，但用户特别说明如果找不到相关月份数据则为0次。需要确认是否有查询记录，但根据提供的内容，可能没有，所以填写0次。主要查询原因也因为没有数据而无法列出。

基于客户的需求和征信情况，现在开始匹配合适的金融产品。

分析客户需求：
1. 贷款类型：${formData.value.loanType === 'mortgage' ? '按揭贷款' : 
    formData.value.loanType === 'secured' ? '抵押贷款' : 
    formData.value.loanType === 'credit' ? '信用贷款' : '未指定'}
2. 贷款金额：${formData.value.loanAmount ? formData.value.loanAmount + '万元' : '未指定'}
3. 贷款期限：${formData.value.minLoanTerm}-${formData.value.maxLoanTerm || 0}月
4. 利率要求：${formData.value.minInterestRate}-${formData.value.maxInterestRate || 0}%
5. 还款方式偏好：${formData.value.repaymentMethod?.join(', ') || '未指定'}

基于以上分析，我推荐以下金融产品：

方案1：优质客户信用贷
- 适用人群：征信良好、有稳定工作的个人
- 贷款额度：最高50万元
- 贷款期限：1-3年
- 贷款利率：3.8%
- 产品优势：无需抵押、审批速度快、手续简便
- 匹配度：★★★★☆

方案2：小微企业经营贷
- 适用人群：小微企业主、个体工商户
- 贷款额度：最高200万元
- 贷款期限：1-5年
- 贷款利率：4.5%
- 产品优势：额度高、可用于经营周转、灵活支取
- 匹配度：★★★★☆

方案3：房产抵押贷款
- 适用人群：有房产的个人或企业
- 贷款额度：最高500万元 (房产评估值的70%)
- 贷款期限：1-10年
- 贷款利率：3.0%
- 产品优势：利率低、额度高、期限长
- 匹配度：★★★★★

综合考虑客户情况，最终推荐方案1：优质客户信用贷，理由如下：
1. 无需抵押，手续简便
2. 放款速度快，能够快速满足客户需求
3. 利率相对合理，在客户可接受范围内
4. 适合客户的贷款金额和期限要求`;

          // 开始模拟AI思考过程逐字显示
          aiThinkingProcess.value = fullThinkingProcess; // 保存完整内容以便后续使用
          displayedThinkingProcess.value = ''; // 清空已显示的内容
          thinkingIndex = 0; // 重置索引
          const startTime = Date.now(); // 记录开始时间
          
          // 切换状态到思考中
          matchingStatus.value = 'thinking';
          isThinking.value = true;
          
          // 移除光标闪烁代码，不再需要
          
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
                      const thinkingContent = document.querySelector('.thinking-display');
                      if (thinkingContent) {
                        thinkingContent.scrollTop = thinkingContent.scrollHeight;
                      }
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
                  const thinkingContent = document.querySelector('.thinking-display');
                  if (thinkingContent) {
                    thinkingContent.scrollTop = thinkingContent.scrollHeight;
                  }
                  
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
                      const thinkingContent = document.querySelector('.thinking-display');
                      if (thinkingContent) {
                        thinkingContent.scrollTop = thinkingContent.scrollHeight;
                      }
                    } else {
                      // 处理完成
                      finishThinking(startTime);
                    }
                  }, 40); // 句末后的显示速度
                }, 300); // 句末停顿时间
              }
              
              // 自动滚动到底部
              const thinkingContent = document.querySelector('.thinking-display');
              if (thinkingContent) {
                thinkingContent.scrollTop = thinkingContent.scrollHeight;
              }
            } else {
              // 所有内容显示完毕
              finishThinking(startTime);
            }
          }, 40); // 基础显示间隔
        }, 5000); // 5秒后开始显示思考过程
        
      } catch (error) {
        console.error('匹配产品时出错:', error);
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
      // 保存初始匹配产品的思考内容
      matchThinkingContent.value = aiThinkingProcess.value;
      isThinking.value = false;
      
      // 延迟一会，让用户看到完整的思考过程
      setTimeout(() => {
        // 转换为生成报告状态，添加过渡效果
        matchingStatus.value = 'generating';
        
        // 延迟约3秒后生成报告，提供良好的过渡体验
        setTimeout(() => {
          // 生成融资报告
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
      
      reportContent.value = `# 融资顾问报告

编制日期：${currentDate}

## 一、客户需求与征信概况

客户姓名：${formData.value.name || '未提供'}
联系电话：${formData.value.phone || '未提供'}
融资需求：${formData.value.loanAmount ? formData.value.loanAmount + '万元' : '未提供'}
融资类型：${formData.value.loanType === 'mortgage' ? '按揭贷款' : 
           formData.value.loanType === 'secured' ? '抵押贷款' : 
           formData.value.loanType === 'credit' ? '信用贷款' : '未指定'}
详细需求描述：${formData.value.additionalNotes || '用户未提供详细描述'}
核心需求关键词：${getKeywordsText(formData.value.aiKeywords)}
征信情况：${hasCreditReport.value ? '已提供征信报告，总体良好' : '未提供征信报告'}



## 二、推荐的产品方案

### 方案1：优质客户信用贷
- 贷款额度：最高50万元
- 贷款期限：1-3年
- 贷款利率：3.8%
- 产品特点：免抵押、利率低、放款快
- 申请条件：征信良好、稳定工作、年收入10万以上

### 方案2：小微企业经营贷
- 贷款额度：最高200万元
- 贷款期限：1-5年
- 贷款利率：4.5%
- 产品特点：支持企业经营、手续简便、额度高
- 申请条件：营业执照满1年、月均流水5万以上

### 方案3：房产抵押贷款
- 贷款额度：最高500万元
- 贷款期限：1-10年
- 贷款利率：3.0%
- 产品特点：利率超低、额度高、还款方式灵活
- 申请条件：有房产、征信良好

## 三、还款计划对比

| 方案 | 月供(元) | 总利息(元) | 总还款额(元) |
| --- | --- | --- | --- |
| 优质客户信用贷(3年) | 14,689 | 28,804 | 528,804 |
| 小微企业经营贷(5年) | 9,326 | 59,560 | 559,560 |
| 房产抵押贷款(10年) | 4,828 | 79,360 | 579,360 |

## 四、风险提示与优化建议

1. 优化建议
   - 提供完整的收入证明，有助于提高贷款额度
   - 保持良好的信用记录，避免逾期还款
   - 整理近6个月的银行流水，证明稳定的收入来源

2. 风险提示
   - 务必在还款能力范围内申请贷款
   - 贷款期限越长，总利息支出越高
   - 提前还款可能涉及违约金，请详细了解产品条款

## 五、最终建议

根据您的需求和情况，我们推荐您选择"优质客户信用贷"，该产品无需抵押，审批速度快，适合您的需求。如果您希望获得更大额度且有房产，可以考虑"房产抵押贷款"方案。

## 六、融资方案审批材料清单

1. 基础材料
   - 身份证原件及复印件
   - 近6个月银行流水
   - 收入证明或纳税证明

2. 根据贷款方案需额外提供
   - 优质客户信用贷：工作证明、劳动合同
   - 小微企业经营贷：营业执照、经营场所证明
   - 房产抵押贷款：房产证明、房屋估值报告

如需了解更多详情或有任何疑问，请随时咨询我们的客服人员。`;
      
      // 更新状态为完成
      matchingStatus.value = 'complete';
      stopMatchingTimer();
      reportGenerationDuration.value = matchingTimer.value;
      
      // 添加初始系统消息到咨询消息列表
      consultationMessages.value.push({
        role: 'system',
        content: '您的融资建议报告已生成。关于本次融资需求，你可以继续向AI咨询以获取更多建议。'
      });
      
      // 进入下一步
      nextStep();
    };
    
    // 停止所有思考过程相关的计时器
    const stopThinkingProcess = () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
        thinkingInterval = null;
      }
      
      // 移除光标闪烁相关代码，不再需要
      
      isThinking.value = false;
    };
    
    // 处理表单提交
    const handleFormSubmit = (data) => {
      // 更新表单数据
      formData.value = data;
      
      // 检查是否上传了征信报告，直接使用表单数据中的hasCreditReport属性
      hasCreditReport.value = data.hasCreditReport || false;
      
      // 打印AI关键词以便调试
      console.log('AI提取的关键词：', data.aiKeywords);
      
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
    
    // 进入下一步
    const nextStep = () => {
      if (activeStep.value < totalSteps.value) {
        activeStep.value++;
        
        // 根据当前步骤执行相应的操作
        if ((hasCreditReport.value && activeStep.value === 3) || 
            (!hasCreditReport.value && activeStep.value === 2)) {
          // 匹配金融产品步骤
          startProductMatching();
        }
      } else {
        // 所有步骤完成，通知父组件
        emit('report-complete', { 
          ...formData.value, 
          report: reportContent.value 
        });
      }
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
        // 修改为显示思考过程
        matchingStatus.value = 'thinking';
        isThinking.value = true;
        
        // 创建一个模拟的AI思考过程内容
        const question = userMessage.content;
        const thinkingProcessContent = `正在分析用户问题："${question}"

思考过程：
1. 提取用户问题的关键信息
   - 用户问询主题: ${question.includes('利率') ? '贷款利率' : 
                  question.includes('贷款') ? '贷款产品' :
                  question.includes('申请') ? '申请流程' :
                  question.includes('流程') ? '贷款流程' :
                  question.includes('还款') ? '还款方式' : '一般咨询'}
   - 问题复杂度: ${question.length > 20 ? '较复杂' : '简单'}
   - 情感倾向: 中性

2. 检索相关知识库信息
   - 检索关键词: ${question.split(' ').join(', ')}
   - 匹配资料: ${
     question.includes('利率') ? '贷款产品利率表, 客户分级利率标准' : 
     question.includes('贷款') ? '信贷产品手册, 贷款类型对比表' :
     question.includes('申请') ? '贷款申请材料清单, 审批流程文档' :
     question.includes('流程') ? '贷款办理流程图, 业务办理时间表' :
     question.includes('还款') ? '还款方式说明, 提前还款计算器' : '通用客户咨询指南'
   }

3. 形成回复策略
   - 回复重点: ${
     question.includes('利率') ? '不同产品的利率区间和影响因素' : 
     question.includes('贷款') ? '适合客户的贷款产品类型和特点' :
     question.includes('申请') ? '所需材料清单和申请注意事项' :
     question.includes('流程') ? '贷款申请的主要环节和时间要求' :
     question.includes('还款') ? '不同还款方式的优缺点和选择建议' : '提供通用的咨询指导'
   }
   - 推荐产品: ${
     question.includes('利率') && formData.value.loanType === 'credit' ? '优质客户信用贷' :
     question.includes('利率') && formData.value.loanType === 'secured' ? '房产抵押贷款' :
     question.includes('贷款') && formData.value.loanAmount > 100 ? '小微企业经营贷' : '优质客户信用贷'
   }

4. 生成个性化回复
   - 根据客户信息: ${formData.value.name || '未知客户'}, ${formData.value.loanAmount ? formData.value.loanAmount + '万元贷款需求' : '未指定贷款金额'}
   - 优化回复语气: 专业、清晰、友好`;

        // 将思考过程添加到数组中，但此时只是存储完整内容
        const fullThinkingContent = thinkingProcessContent;
        
        // 创建一个空的思考过程，用于逐字显示
        const emptyThinkingContent = '';
        consultationThinkingProcesses.value.push(emptyThinkingContent);
        
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
          const responses = {
            '利率': '我们的产品利率根据市场情况和个人资质有所不同。目前优质客户信用贷的年化利率为3.8%，小微企业经营贷为4.5%，房产抵押贷款为3.0%。实际利率会根据您的具体情况可能有所调整。',
            '贷款': '您可以根据自己的需求选择适合的贷款产品。我们提供的贷款产品包括信用贷款、抵押贷款和按揭贷款。每种产品有不同的额度、期限和利率，可以根据您的具体情况为您推荐合适的方案。',
            '申请': '申请贷款需要准备的材料通常包括：个人身份证明、收入证明、银行流水、征信报告等。具体材料清单会根据您选择的贷款产品有所不同，您可以参考融资报告中的"融资方案审批材料清单"部分。',
            '流程': '贷款申请流程一般包括：提交申请材料、银行审核、审批通过、签订合同、放款。整个流程通常需要1-2周时间，但根据不同产品和银行政策可能有所不同。',
            '还款': '我们提供多种还款方式，包括等额本息、等额本金、先息后本等。您可以根据自己的资金规划选择合适的还款方式。建议选择最适合您现金流情况的方案，避免产生还款压力。'
          };
          
          // 检查问题是否包含特定关键词
          let responseText = '';
          for (const [keyword, response] of Object.entries(responses)) {
            if (question.includes(keyword)) {
              responseText = response;
              break;
            }
          }
          
          // 如果没有匹配到关键词，使用默认回复
          if (!responseText) {
            responseText = '感谢您的咨询。针对您的问题，建议您参考融资顾问报告中的相关内容，或者联系我们的客服人员获取更详细的解答。如果您有具体的贷款需求，也可以提供更多信息，我们可以为您提供更精准的建议。';
          }
          
          // 模拟AI回复
          setTimeout(() => {
            const responseMessage = {
              role: 'assistant',
              content: responseText
            };
            
            consultationMessages.value.push(responseMessage);
            consultationLoading.value = false;
            stopConsultationThinking('success');
            isThinking.value = false;
            
            // 滚动到底部
            scrollToBottom();
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
        console.error('发送咨询消息失败:', error);
        stopConsultationThinking('error', '发送消息失败，请重试');
        ElMessage.error('发送消息失败，请重试');
        consultationLoading.value = false;
        isThinking.value = false;
      }
    };
    
    // 滚动聊天消息到底部
    const scrollToBottom = () => {
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 0);
    };
    
    // 下载报告
    const downloadReport = () => {
      try {
        if (!reportContent.value) {
          throw new Error('未找到报告内容');
        }

        // 创建Blob对象
        const blob = new Blob([reportContent.value], { type: 'text/markdown;charset=utf-8' });

        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `融资顾问报告_${new Date().toISOString().slice(0, 10)}.md`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理URL对象
        URL.revokeObjectURL(link.href);

        ElMessage.success('报告已下载');
      } catch (error) {
        console.error('下载报告时出错:', error);
        ElMessage.error('下载失败，请重试');
      }
    };
    
    // 水平调整分隔线相关方法
    const startResizeHorizontal = (e) => {
      isResizingHorizontal.value = true;
      document.addEventListener('mousemove', resizeHorizontal);
      document.addEventListener('mouseup', stopResizeHorizontal);
      e.preventDefault();
    };
    
    const resizeHorizontal = (e) => {
      if (!isResizingHorizontal.value) return;
      
      const now = Date.now();
      if (now - lastResizeTime < 16) { // 约60fps
        return;
      }
      lastResizeTime = now;
      
      if (resizeThrottleTimeout) {
        clearTimeout(resizeThrottleTimeout);
      }
      
      resizeThrottleTimeout = setTimeout(() => {
        const container = e.target.closest('.report-layout') || document.querySelector('.report-layout');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        
        // 计算分隔比例，限制在20%-80%之间
        let percentage = Math.max(20, Math.min(80, (mouseX / containerRect.width) * 100));
        horizontalSplit.value = percentage;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--horizontal-split', `${percentage}%`);
        
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
      }, 10);
    };
    
    const stopResizeHorizontal = () => {
      isResizingHorizontal.value = false;
      document.removeEventListener('mousemove', resizeHorizontal);
      document.removeEventListener('mouseup', stopResizeHorizontal);
    };
    
    // 添加一个辅助函数，用于安全地从关键词数组中提取文本
    const getKeywordsText = (keywords) => {
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return '无';
      }
      
      return keywords.map(keyword => {
        if (typeof keyword === 'string') {
          return keyword;
        } else if (typeof keyword === 'object') {
          // 尝试获取value或text属性
          return keyword.value || keyword.text || JSON.stringify(keyword);
        } else {
          return String(keyword);
        }
      }).join('、');
    };
    
    // 添加一个辅助函数来随机选择一个关键词
    const getRandomKeyword = (keywords) => {
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return '快速融资';
      }
      
      const randomIndex = Math.floor(Math.random() * keywords.length);
      const keyword = keywords[randomIndex];
      
      if (typeof keyword === 'string') {
        return keyword;
      } else if (typeof keyword === 'object') {
        return keyword.value || keyword.text || '快速审批';
      } else {
        return String(keyword);
      }
    };
    
    // 垂直调整分隔线相关方法
    const startResizeVertical = (e) => {
      isResizingVertical.value = true;
      document.addEventListener('mousemove', resizeVertical);
      document.addEventListener('mouseup', stopResizeVertical);
      e.preventDefault();
    };
    
    const resizeVertical = (e) => {
      if (!isResizingVertical.value) return;
      
      const now = Date.now();
      if (now - lastResizeTime < 16) { // 约60fps
        return;
      }
      lastResizeTime = now;
      
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
      }, 10);
    };
    
    const stopResizeVertical = () => {
      isResizingVertical.value = false;
      document.removeEventListener('mousemove', resizeVertical);
      document.removeEventListener('mouseup', stopResizeVertical);
    };
    
    // 初始化CSS变量
    onMounted(() => {
      // 设置初始的水平分隔比例
      document.documentElement.style.setProperty('--horizontal-split', '55%');
      // 设置初始的聊天输入框宽度
      document.documentElement.style.setProperty('--chat-input-width', '40%');
      // 设置初始的垂直分隔比例
      document.documentElement.style.setProperty('--vertical-split', '50%');
      
      // 监听窗口大小变化，重新调整输入框高度
      window.addEventListener('resize', adjustInputHeight);
      
      // 确保输入框和按钮在初始状态下高度同步
      // 使用多重保障机制确保初始同步
      adjustInputHeight();
      setTimeout(adjustInputHeight, 0);
      setTimeout(adjustInputHeight, 100);
      setTimeout(adjustInputHeight, 300);
      
      // 设置MutationObserver监听输入区域高度变化
      setTimeout(() => {
        const textarea = document.querySelector('.chat-input .el-textarea__inner');
        const textareaContainer = document.querySelector('.chat-input .el-textarea');
        
        if (textarea) {
          // 监听文本区域高度变化
          const observer = new MutationObserver((mutations) => {
            adjustInputHeight();
          });
          
          // 监听textarea和其容器的属性变化
          observer.observe(textarea, { 
            attributes: true,
            attributeFilter: ['style', 'height']
          });
          
          if (textareaContainer) {
            observer.observe(textareaContainer, {
              attributes: true,
              attributeFilter: ['style', 'height']
            });
          }
          
          // 保存observer引用以便在组件卸载时清理
          mutationObserver = observer;
        }
      }, 100);
      
      // 定期检查并调整按钮高度，确保与输入框同步
      autoHeightCheckInterval = setInterval(() => {
        adjustInputHeightImmediate();
      }, 100);
    });
    
    // 清理计时器和事件监听
    onUnmounted(() => {
      stopMatchingTimer();
      stopThinkingProcess();
      if (consultationThinkingInterval) {
        clearInterval(consultationThinkingInterval);
      }
      
      // 移除窗口大小变化监听
      window.removeEventListener('resize', adjustInputHeight);
      
      // 清理MutationObserver
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
      }
      
      // 清理自动高度检查定时器
      if (autoHeightCheckInterval) {
        clearInterval(autoHeightCheckInterval);
        autoHeightCheckInterval = null;
      }
    });
    
    // 重置顾问流程
    const restartAdvisor = () => {
      ElMessageBox.confirm('确定要重新开始新的融资顾问流程吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 重置所有状态
        activeStep.value = 1; // 设置为第一步，显示需求提交表单
        formData.value = {};
        reportContent.value = '';
        aiThinkingProcess.value = '';
        consultationMessages.value = [];
        matchingStatus.value = 'idle';
        consultationInput.value = '';
        
        // 触发步骤变更
        emit('step-change', { step: activeStep.value, data: formData.value });
        
        // ElMessage({
        //   type: 'success',
        //   message: '已重置顾问报告流程'
        // });
      }).catch(() => {
        // 用户取消操作
      });
    };
    
    return {
      activeStep,
      hasCreditReport,
      formData,
      matchingStatus,
      matchingTimer,
      matchingResult,
      reportContent,
      reportGenerationDuration,
      consultationMessages,
      consultationInput,
      consultationLoading,
      consultationThinkingTimer,
      consultationThinkingDots,
      consultationResponseStatus,
      consultationResponseTime,
      handleFormSubmit,
      renderMarkdown,
      sendConsultationMessage,
      handleShiftEnter,
      downloadReport,
      startResizeHorizontal,
      aiThinkingProcess,
      displayedThinkingProcess,
      matchThinkingContent,
      consultationThinkingProcesses,
      isThinking,
      verticalSplit,
      isResizingVertical,
      startResizeVertical,
      restartAdvisor,
      adjustInputHeight,
      adjustInputHeightImmediate
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

.finance-advisor-report {
  display: flex;
  flex-direction: column;
  height: 100%; /* 使用百分比高度填充父容器 */
}

.steps-header {
  // padding: 16px 20px;
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
}

.report-left {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  max-height: 100%;
}

.report-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  max-height: 100%;
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
  padding: 20px;
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
  height: 50px;
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
  left: var(--horizontal-split, 55%);
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
      }
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
}

.match-thinking,
.consultation-thinking {
  margin-bottom: 20px;
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