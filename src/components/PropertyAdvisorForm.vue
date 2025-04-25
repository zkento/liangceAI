<template>
  <div class="property-advisor-form">
    <div class="form-container">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <div class="panel-header">
          <h2 class="panel-title">客户购房需求</h2>
        </div>
        <div class="panel-content">
          <p class="description-hint">请参照右侧的需求描述要点输入客户的购房需求，要点覆盖得越全面越好。</p>
          
          <el-form ref="propertyFormRef" :model="formData">
            <el-form-item prop="requirements" :rules="[
              { required: true, message: '请输入需求描述', trigger: 'blur' },
              { min: 30, message: '需求描述不得少于30个字', trigger: 'blur' }
            ]">
              <el-input
                v-model="formData.requirements"
                type="textarea"
                :rows="16"
                :autosize="{ minRows: 16, maxRows: 23 }"
                placeholder="请输入不少于30个字的客户购房需求"
                @input="handleRequirementsInput"
                @focus="handleInputFocus"
                maxlength="600"
                show-word-limit
                :disabled="isAnalyzing || hasAnalysisResult"
              ></el-input>
            </el-form-item>
            
            <!-- 添加客户姓名输入框 -->
            <div class="customer-name-input">
              <el-form-item prop="customerName" :rules="customerNameRules">
                <el-input 
                  v-model="formData.customerName"
                  placeholder="请输入客户姓名（必填，方便你查询结果）"
                  clearable
                  :disabled="isAnalyzing"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>
            
            <div class="form-actions">
              <template v-if="!hasAnalysisResult">
                <el-button 
                  @click="resetForm" 
                  plain
                  :disabled="!formData.requirements"
                >重置</el-button>
                <el-button 
                  type="primary" 
                  @click="analyzeRequirements"
                  :loading="isAnalyzing"
                  :disabled="!formData.requirements || formData.requirements.length < 30"
                >
                  <template v-if="!isAnalyzing">
                    让AI分析客户需求
                    <!-- <span class="button-hint">Shift+Enter</span> -->
                  </template>
                  <template v-else>
                    AI正在分析需求
                    <span class="button-hint">用时{{currentAnalysisTime}}秒</span>
                  </template>
                </el-button>
              </template>
              <template v-else>
                <el-button 
                  @click="resetForm" 
                  plain
                >新的需求</el-button>
                <el-button 
                  type="primary" 
                  @click="startMatchingHouses"
                ><el-icon><CaretRight /></el-icon> 让AI生成购房建议报告</el-button>
              </template>
            </div>
          </el-form>
        </div>
      </div>

      <!-- 右侧参考/结果区 -->
      <div class="content-panel">
        <template v-if="!hasAnalysisResult">
          <div class="reference-content">
            <div class="panel-header">
              <h3 class="panel-title">购房需求描述要点</h3>
            </div>
            <div class="panel-content">
              <div class="reference-grid">
                <div v-for="(group, index) in requirementGuide" :key="index" class="reference-group">
                  <h4>{{ group.title }}</h4>
                  <div class="reference-items">
                    <span v-for="(item, idx) in group.items" :key="idx" class="reference-item">
                      <span class="item-label">{{ item.label }}：</span><em>{{ item.example }}</em>
                    </span>
                  </div>
                </div>
              </div>

              <div class="example-section">
                <div class="example-block">
                  <h4>购房需求描述参考示例：</h4>
                  <blockquote class="example-quote" v-html="'预算总价580-620万，首付3成（约180万），需按揭贷款。意向天河区珠江新城或海珠区琶洲地铁沿线，重点考察3房2卫户型。购房目的为自住及子女教育，需带省级学位。<br>建面85-100㎡，优先中高楼层（15层以上），要求南向或东南向采光，接受10年内楼龄的房子。装修需精装以上标准，可接受局部翻新。<br>必须满足地铁500米内（3/5/18号线），步行15分钟内有大型商场。医疗配套不作硬性要求，但需规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域。'">
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="analysis-content">
            <div class="panel-header">
              <h3 class="panel-title">
                需求AI分析结果
                <span class="analysis-time" v-if="analysisTime">
                  用时{{ analysisTime }}秒
                </span>
              </h3>
            </div>
            <div class="panel-content">
              <div class="reference-grid">
                <div v-for="(group, index) in requirementGuide" :key="index" class="reference-group">
                  <h4>{{ group.title }}</h4>
                  <div class="reference-items">
                    <span v-for="(item, idx) in group.items" :key="idx" class="reference-item" :class="getItemClass(group.title, item.label)">
                      <span class="item-label">{{ item.label }}：</span><em>{{ getItemValue(group.title, item.label) }}</em>
                    </span>
                  </div>
                </div>
              </div>

              <div class="example-section">
                <div class="example-block">
                  <h4 class="result-title">AI分析结果建议</h4>
                  <div class="user-requirement-result">
                    需求建议内容稍后提供
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendMessage } from '../api/chat'  // 添加导入sendMessage API
import { User, CaretRight } from '@element-plus/icons-vue'  // 导入User和CaretRight图标

export default {
  name: 'PropertyAdvisorForm',
  components: {
    User, // 注册User图标组件
    CaretRight // 注册CaretRight图标组件
  },
  emits: ['submit'],
  
  setup(props, { emit }) {
    // 表单引用
    const propertyFormRef = ref(null)
    
    // 表单数据对象
    const formData = reactive({
      requirements: '',  // 需求描述
      customerName: '',  // 客户姓名
    })
    
    // 分析状态
    const isAnalyzing = ref(false)
    const hasAnalysisResult = ref(false)
    const analysisTime = ref(0)
    const analysisStartTime = ref(0)
    const timerInterval = ref(null)
    const currentAnalysisTime = ref(0)
    
    // AI分析结果
    const analysisResult = ref([])
    
    // 计算客户姓名的验证规则 - 只有分析结果后才是必填
    const customerNameRules = computed(() => {
      return [
        { required: hasAnalysisResult.value, message: '请输入客户姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
      ]
    })
    
    // 辅助方法 - 获取分析结果中特定标签的值
    const getItemValue = (groupTitle, itemLabel) => {
      if (!hasAnalysisResult.value) return ''
      
      // 将组标题映射到分析结果的类别
      const categoryMapping = {
        '1. 核心需求': '核心需求',
        '2. 居住偏好': '居住偏好',
        '3. 配套要求': '配套要求',
        '4. 特殊关注': '特殊关注',
        '5. 补充说明': '补充说明'
      }
      
      const category = categoryMapping[groupTitle]
      if (!category) return '需求中未包含此信息'
      
      // 在分析结果中查找对应的类别和项
      const foundCategory = analysisResult.value.find(c => c.category === category)
      if (!foundCategory) return '需求中未包含此信息'
      
      const foundItem = foundCategory.items.find(item => item.label === itemLabel)
      if (foundItem) {
        return foundItem.value
      }
      
      return '需求中未包含此信息'
    }
    
    // 辅助方法 - 获取项目的CSS类
    const getItemClass = (groupTitle, itemLabel) => {
      if (!hasAnalysisResult.value) return ''
      
      const value = getItemValue(groupTitle, itemLabel)
      return value && value !== '需求中未包含此信息' ? 'item-found' : 'item-not-found'
    }
    
    // 需求描述指南
    const requirementGuide = [
      {
        title: '1. 核心需求',
        items: [
          { label: '预算范围', example: '如总价600万左右，首付3成' },
          { label: '购房目的', example: '自住/投资/改善/养老/子女教育' },
          { label: '意向区域', example: '如天河区珠江新城、海珠区琶洲' },
          { label: '户型需求', example: '如3房2卫' },
        ]
      },
      {
        title: '2. 居住偏好',
        items: [
          
          { label: '面积区间', example: '如建面80-100㎡' },
          { label: '楼层要求', example: '低楼层/中楼层/高楼层/顶楼带露台' },
          { label: '朝向要求', example: '南北通透/东向/西向/南向/北向' },
          { label: '装修标准', example: '翻新/简装/精装/豪装' }
        ]
      },
      {
        title: '3. 配套要求',
        items: [
          { label: '交通便利', example: '如地铁步行10分钟内' },
          { label: '教育资源', example: '如省级学位小学' },
          { label: '商圈覆盖', example: '商场/超市/菜市场需求' },
          { label: '医疗条件', example: '三甲医院车程要求' },
          { label: '景观要求', example: '江景/公园/无硬性要求' }
        ]
      },
      {
        title: '4. 特殊关注',
        items: [
          { label: '产权性质', example: '商品房/公寓/法拍房' },
          { label: '楼龄要求', example: '次新房/5-10年/10-20年/20年以上' },
          { label: '交易周期', example: '急需/可等合适房源' },
          { label: '装修情况', example: '毛坯/简装/精装/豪装' },
          { label: '抗性因素', example: '临高架/加油站/殡仪馆等' }
        ]
      },
      {
        title: '5. 补充说明',
        items: [
          { label: '按揭贷款', example: '是否需要按揭贷款' }
        ]
      }
    ]
    
    // 方法 - 输入框焦点处理
    const handleInputFocus = (event) => {
      if (event && event.target) {
        setTimeout(() => {
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select()
          }
        }, 0)
      }
    }
    
    // 方法 - 需求输入处理
    const handleRequirementsInput = () => {
      if (hasAnalysisResult.value) {
        hasAnalysisResult.value = false
        analysisResult.value = []
      }
    }
    
    // 方法 - 分析需求
    const analyzeRequirements = async () => {
      if (!formData.requirements || formData.requirements.trim().length < 30) {
        ElMessage.warning('需求描述内容过短，无法进行分析')
        return
      }
      
      try {
        isAnalyzing.value = true
        analysisStartTime.value = Date.now()
        currentAnalysisTime.value = 0
        
        // 启动计时器
        clearInterval(timerInterval.value)
        timerInterval.value = setInterval(() => {
          currentAnalysisTime.value = Math.round((Date.now() - analysisStartTime.value) / 1000)
        }, 1000)
        
        // 构建用户输入消息
        const messages = [
          {
            role: 'user',
            content: formData.requirements.trim()
          }
        ]
        
        // ===== 暂时注释掉真正调用API的代码 =====
        /*
        // 调用API，使用property-needs-analytics作为chatType
        const response = await sendMessage(messages, 'property-needs-analytics')
        
        // 检查响应是否包含错误
        if (response.error) {
          console.error('API返回错误:', response.error)
          throw new Error(response.message || '需求分析失败')
        }
        
        try {
          // 解析API返回的内容
          const responseText = response.content
          
          if (!responseText || responseText.trim() === '') {
            throw new Error('AI返回了空响应，请重试')
          }
          
          // 使用正则表达式从响应中提取JSON部分
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          
          if (!jsonMatch) {
            console.warn('无法从AI响应中提取JSON:', responseText)
            throw new Error('无法解析AI分析结果，请修改描述后重试')
          }
          
          // 解析JSON
          const jsonData = JSON.parse(jsonMatch[0])
          
          // 验证JSON结构是否符合预期
          if (!jsonData.categories || !Array.isArray(jsonData.categories)) {
            console.warn('AI返回的JSON结构不符合预期:', jsonData)
            throw new Error('AI分析结果格式不正确，请重试')
          }
          
          // 将API返回的数据转换为组件所需格式
          analysisResult.value = jsonData.categories.map(category => ({
            category: category.name,
            items: category.items.map(item => ({
              label: item.label,
              value: item.value
            }))
          }))
        */
        
        // ===== 添加模拟的AI分析结果 =====
        // 模拟分析延迟
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // 模拟分析结果
        const mockResult = {
          categories: [
            {
              name: "核心需求",
              items: [
                {label: "预算范围", value: "总价580-620万，首付3成（约180万）"},
                {label: "购房目的", value: "自住及子女教育"},
                {label: "意向区域", value: "天河区珠江新城或海珠区琶洲地铁沿线"},
                {label: "户型需求", value: "3房2卫"}
              ]
            },
            {
              name: "居住偏好",
              items: [
                {label: "面积区间", value: "建面85-100㎡"},
                {label: "楼层要求", value: "中高楼层（15层以上）"},
                {label: "朝向要求", value: "南向或东南向"},
                {label: "装修标准", value: "精装以上标准，可接受局部翻新部翻新"}
              ]
            },
            {
              name: "配套要求",
              items: [
                {label: "交通便利", value: "地铁500米内（3/5/18号线）"},
                {label: "教育资源", value: "需带省级学位"},
                {label: "商圈覆盖", value: "步行15分钟内有大型商场"},
                {label: "医疗条件", value: "不作硬性要求"},
                {label: "景观要求", value: "需求中未包含此信息"}
              ]
            },
            {
              name: "特殊关注",
              items: [
                {label: "产权性质", value: "需求中未包含此信息"},
                {label: "楼龄要求", value: "10年内楼龄"},
                {label: "交易周期", value: "需求中未包含此信息"},
                {label: "装修情况", value: "需求中未包含此信息"},
                {label: "抗性因素", value: "规避临高架、加油站、餐饮街、夜市等嘈杂、危险区域"}
              ]
            },
            {
              name: "补充说明",
              items: [
                {label: "按揭贷款", value: "需按揭贷款"}
              ]
            }
          ]
        };
          
        // 将模拟数据转换为组件所需格式
        analysisResult.value = mockResult.categories.map(category => ({
          category: category.name,
          items: category.items.map(item => ({
            label: item.label,
            value: item.value
          }))
        }))
          
        // 计算分析用时
        analysisTime.value = Math.round((Date.now() - analysisStartTime.value) / 100) / 10
        hasAnalysisResult.value = true
        
        // 停止计时器
        clearInterval(timerInterval.value)
        timerInterval.value = null
        
        ElMessage.success('需求分析完成')
        /*
        } catch (parseError) {
          console.error('解析AI响应时出错:', parseError)
          throw new Error('解析分析结果时出错: ' + parseError.message)
        }
        */
      } catch (error) {
        console.error('需求分析失败:', error)
        ElMessage.error(error.message || '需求分析失败，请重试')
      } finally {
        isAnalyzing.value = false
        // 确保计时器停止
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }
    
    // 方法 - 重置表单
    const resetForm = () => {
      if (isAnalyzing.value) {
        ElMessageBox.confirm('正在进行需求分析，确认要中止分析过程么？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          // 中止分析
          isAnalyzing.value = false
          // 停止计时器
          clearInterval(timerInterval.value)
          timerInterval.value = null
          
          // 重置表单
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
        }).catch(() => {
          // 用户取消了重置操作
        })
      } else if (hasAnalysisResult.value) {
        ElMessageBox.confirm('确定放弃当前分析结果，开始新的需求分析么？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
        }).catch(() => {
          // 用户取消了重置操作
        })
      } else {
        ElMessageBox.confirm('确定要清空所有已填写的内容么？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          formData.requirements = ''
          formData.customerName = '' // 清空客户姓名
          hasAnalysisResult.value = false
          analysisResult.value = []
          ElMessage.success('需求输入框内容已清空')
        }).catch(() => {
          // 用户取消了重置操作
        })
      }
    }
    
    // 键盘快捷键处理
    const handleKeyDown = (e) => {
      // Shift+Enter 快捷键分析需求
      if (e.key === 'Enter' && e.shiftKey && formData.requirements && formData.requirements.length >= 30 && !isAnalyzing.value) {
        analyzeRequirements()
        e.preventDefault()
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown)
      
      // 监听右侧内容区域的滚动事件
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.addEventListener('scroll', handleContentScroll)
      }
    })
    
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown)
      
      // 移除滚动事件监听
      const panelContent = document.querySelector('.content-panel .panel-content')
      if (panelContent) {
        panelContent.removeEventListener('scroll', handleContentScroll)
      }
      
      // 确保计时器停止
      clearInterval(timerInterval.value)
    })
    
    // 处理内容滚动
    const handleContentScroll = (e) => {
      const header = document.querySelector('.content-panel .panel-header')
      if (header) {
        // 当滚动位置大于0时添加scrolled类
        if (e.target.scrollTop > 0) {
          header.classList.add('scrolled')
        } else {
          header.classList.remove('scrolled')
        }
      }
    }
    
    // 开始匹配房源
    const startMatchingHouses = () => {
      // 使用表单验证
      propertyFormRef.value.validate((valid) => {
        if (valid) {
          // 验证通过，触发提交事件，传递表单数据给父组件
          emit('submit', formData)
        } else {
          // 验证失败，不做操作，表单会自动显示错误提示
          return false
        }
      })
    }
    
    // 监听分析结果状态变化
    watch(hasAnalysisResult, (newValue) => {
      if (newValue) {
        // 当有分析结果后，重新验证表单
        // 延迟一帧执行，确保UI更新后再验证
        nextTick(() => {
          propertyFormRef.value?.clearValidate()
        })
      }
    })
    
    return {
      propertyFormRef,
      formData,
      isAnalyzing,
      hasAnalysisResult,
      analysisTime,
      analysisResult,
      requirementGuide,
      handleInputFocus,
      handleRequirementsInput,
      analyzeRequirements,
      resetForm,
      getItemValue,
      getItemClass,
      currentAnalysisTime,
      analysisStartTime,
      startMatchingHouses,
      customerNameRules
    }
  }
}
</script>

<style scoped>
.property-advisor-form {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.form-container {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

.input-panel {
  width: 400px; 
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
}

.panel-header {
  padding: 0;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  height: 60px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
}

/* 右侧内容面板标题悬浮 */
.content-panel .panel-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f8f9fa; /* 确保背景色 */
  transition: box-shadow 0.3s ease; /* 添加阴影过渡效果 */
}

/* 当滚动时增强阴影效果 */
.content-panel .panel-header.scrolled {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.panel-title {
  padding: 0;
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  line-height: 60px;
  margin: 0;
  display: flex;
  align-items: center;
}

.analysis-time {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
  font-weight: normal;
}

.panel-content {
  padding: 0 20px 20px 20px; /* 调整内边距，顶部为0以避免与标题重叠 */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 #f5f7fa;
  flex: 1; /* 使内容区域占据剩余空间 */
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.description-hint {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
}

.el-form {
  display: flex;
  flex-direction: column;
}

.el-form-item {
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.button-hint {
  font-size: 12px;
  margin-left: 4px;
  opacity: 0.7;
}

.content-panel {
  flex: 1;
  overflow-y: hidden; /* 整个面板不滚动 */
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-left: none;
  height: 100%; /* 确保高度占满可用空间 */
}

.reference-content,
.analysis-content {
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保高度占满父容器 */
  position: relative;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  /* padding-top: 15px; 添加顶部内边距，与标题保持距离 */
}

.reference-group {
  min-width: 0;
}

.reference-group h4 {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.reference-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reference-item {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  display: flex;
  align-items: baseline;
}

.reference-item em {
  color: #a0a9b6;
  font-style: normal;
  margin-left: 0px;
  flex: 1;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-group {
  margin-bottom: 20px;
}

.result-group h4 {
  font-size: 15px;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.result-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
}

.result-item {
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  align-items: baseline;
}

.item-label {
  color: #606266;
  font-weight: 500;
  min-width: 70px;
  flex-shrink: 0;
  white-space: nowrap;
}

.item-value {
  color: #303133;
  font-weight: 500;
  flex: 1;
}

/* 中等屏幕：保持左右布局，但要点变为单列 */
@media (max-width: 1024px) {
  .property-advisor-form {
    overflow: hidden;
  }

  .form-container {
    overflow: hidden;
  display: flex;
  }

  .input-panel {
    flex-shrink: 0;
    height: auto;
  }

  .content-panel {
    flex: 1;
    overflow-y: auto;
    height: 100%;
  }

  .reference-grid,
  .result-items {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .reference-group {
    margin-bottom: 4px;
  }

  .reference-item {
    line-height: 1.;
  }
  
  .reference-group h4 {
    margin-bottom: 8px;
  }
}

/* 窄屏：切换为上下布局 */
@media (max-width: 768px) {
  .property-advisor-form {
    padding: 12px;
  }

  .input-panel {
  width: 100%;
    border-right: none;
  }

  .form-container {
    height: auto;
    min-height: calc(100vh - 24px);
    flex-direction: column;
  }

  .panel-content {
    padding: 12px 16px;
  }

  .reference-grid {
    gap: 4px;
  }

  .reference-group {
  margin-bottom: 0;
}

  .reference-group h4 {
    margin-bottom: 6px;
    padding-bottom: 4px;
  }

  .reference-items {
    gap: 4px;
  }

  .reference-item {
    line-height: 1.4;
  }

  .example-block {
    margin-top: 8px;
  }

  .example-block h4 {
    margin-bottom: 6px;
  }

  .example-quote {
    padding: 10px 12px;
  }
  
  .user-requirement-result {
    padding: 10px 12px;
    max-height: 120px;
  }
}

.example-section {
  padding-top: 16px;
}

.example-block {
  margin-top: 16px;
}

.example-block h4 {
  font-size: 14px;
  color: #a0a9b6;
  margin-bottom: 8px;
}

.example-quote {
  margin: 0;
  padding: 12px 16px;
  background-color: #f8f9fb;
  /* border-left: 4px solid #409eff; */
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
}

/* 新增样式 */
.item-found {
  color: #303133 !important;
  font-weight: 500;  
}

.item-found em {
  color: #303133 !important;
  font-weight: 500;
}

.item-not-found {
  color: #f56c6c;
  font-weight: 500;
}

.item-not-found em {
  color: #f56c6c;
}

.result-title {
  color: #303133 !important;
  font-weight: 500;
}

.user-requirement-result {
  margin: 0;
  padding: 12px 16px;
  background-color: #fbf8d2;
  border-radius: 4px;
  color: #a2940b;
  font-size: 13px;
  line-height: 1.6;
  max-height: 130px;
  overflow-y: auto;
  scrollbar-width: thin;
  white-space: pre-line;
}

.user-requirement-result::-webkit-scrollbar {
  width: 4px;
}

.user-requirement-result::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 2px;
}

/* 姓名输入框样式 */
.customer-name-input {
  margin-bottom: 20px;
  margin-top: 10px;
}

.customer-name-input .el-form-item {
  margin-bottom: 0;
}

.customer-name-input .el-input {
  width: 100%;
}

.customer-name-input .el-input__prefix {
  color: #909399;
  padding-left: 4px;
}
</style>