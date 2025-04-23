<template>
  <div class="property-advisor-form">
    <div class="form-container">
      <el-form 
        ref="propertyFormRef" 
        :model="formData" 
        :rules="formRules" 
        label-position="top" 
        @submit.prevent="submitForm"
        class="form-main"
      >
        <!-- 基本信息部分 -->
        <div class="form-section">
          <div class="section-title">
            <span>客户基本信息</span>
          </div>
          
          <div class="form-row">
            <el-form-item label="姓名" prop="name" class="form-item">
              <el-input 
                v-model="formData.name" 
                placeholder="请输入客户姓名" 
                maxlength="50" 
                @focus="handleInputFocus"></el-input>
            </el-form-item>
            
            <el-form-item label="联系方式" prop="phone" class="form-item">
              <el-input 
                v-model="formData.phone" 
                placeholder="请输入联系电话" 
                maxlength="20" 
                @focus="handleInputFocus"></el-input>
            </el-form-item>
          </div>
          
          <div class="form-row">
            <el-form-item label="家庭人口" prop="familySize" class="form-item">
              <el-input-number 
                v-model="formData.familySize" 
                :min="1" 
                :max="10" 
                :precision="0" 
                style="width: 100%" 
                @focus="handleInputFocus"></el-input-number>
            </el-form-item>
            
            <el-form-item label="购房目的" prop="purpose" class="form-item">
              <el-select 
                v-model="formData.purpose" 
                placeholder="请选择购房目的" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="自住" value="self"></el-option>
                <el-option label="投资" value="investment"></el-option>
                <el-option label="改善" value="upgrade"></el-option>
                <el-option label="养老" value="retirement"></el-option>
                <el-option label="子女教育" value="education"></el-option>
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 购房预算部分 -->
        <div class="form-section">
          <div class="section-title">
            <span>购房预算与偏好</span>
          </div>
          
          <div class="form-row">
            <el-form-item label="总预算(万元)" prop="totalBudget" class="form-item">
              <el-input-number 
                v-model="formData.totalBudget" 
                :min="10" 
                :max="10000" 
                :precision="0" 
                style="width: 100%" 
                @focus="handleInputFocus"
                class="bold-number"></el-input-number>
            </el-form-item>
            
            <el-form-item label="首付比例(%)" prop="downPaymentRatio" class="form-item">
              <el-input-number 
                v-model="formData.downPaymentRatio" 
                :min="20" 
                :max="100" 
                :step="5" 
                :precision="0" 
                style="width: 100%" 
                @focus="handleInputFocus"
                class="bold-number"></el-input-number>
            </el-form-item>
          </div>
          
          <div class="form-row">
            <el-form-item label="期望区域" prop="preferredAreas" class="form-item form-item-full">
              <el-select 
                v-model="formData.preferredAreas" 
                placeholder="请选择期望区域（可多选）" 
                style="width: 100%"
                multiple
                @focus="handleInputFocus">
                <el-option label="市中心" value="downtown"></el-option>
                <el-option label="城东" value="east"></el-option>
                <el-option label="城西" value="west"></el-option>
                <el-option label="城南" value="south"></el-option>
                <el-option label="城北" value="north"></el-option>
                <el-option label="郊区" value="suburb"></el-option>
              </el-select>
            </el-form-item>
          </div>
          
          <div class="form-row">
            <el-form-item label="户型要求" prop="houseType" class="form-item">
              <el-select 
                v-model="formData.houseType" 
                placeholder="请选择户型" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="一室" value="1"></el-option>
                <el-option label="两室" value="2"></el-option>
                <el-option label="三室" value="3"></el-option>
                <el-option label="四室" value="4"></el-option>
                <el-option label="五室及以上" value="5+"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="装修状况" prop="decoration" class="form-item">
              <el-select 
                v-model="formData.decoration" 
                placeholder="请选择装修要求" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="毛坯" value="undecorated"></el-option>
                <el-option label="简装" value="basic"></el-option>
                <el-option label="精装" value="deluxe"></el-option>
                <el-option label="豪装" value="luxury"></el-option>
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 房产面积和楼层 -->
        <div class="form-section">
          <div class="section-title">
            <span>面积与楼层要求</span>
          </div>
          
          <div class="form-row">
            <el-form-item label="面积区间(㎡)" prop="areaRange" class="form-item">
              <div class="range-input">
                <el-form-item prop="minArea" class="range-item">
                  <el-input-number 
                    v-model="formData.minArea" 
                    :min="20" 
                    :max="500" 
                    :precision="0" 
                    style="width: 100%" 
                    placeholder="最小面积" 
                    @focus="handleInputFocus"
                    @change="handleRangeInput('maxArea')"></el-input-number>
                </el-form-item>
                <span class="range-separator">至</span>
                <el-form-item prop="maxArea" class="range-item">
                  <el-input-number 
                    v-model="formData.maxArea" 
                    :min="20" 
                    :max="500" 
                    :precision="0" 
                    style="width: 100%" 
                    placeholder="最大面积" 
                    @focus="handleInputFocus"></el-input-number>
                </el-form-item>
              </div>
            </el-form-item>
            
            <el-form-item label="楼层要求" prop="floorPreference" class="form-item">
              <el-select 
                v-model="formData.floorPreference" 
                placeholder="请选择楼层需求" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="低楼层" value="low"></el-option>
                <el-option label="中楼层" value="middle"></el-option>
                <el-option label="高楼层" value="high"></el-option>
                <el-option label="顶楼带露台" value="penthouse"></el-option>
                <el-option label="无特殊要求" value="any"></el-option>
              </el-select>
            </el-form-item>
          </div>
          
          <div class="form-row">
            <el-form-item label="朝向要求" prop="orientation" class="form-item">
              <el-select 
                v-model="formData.orientation" 
                multiple
                placeholder="请选择朝向要求（可多选）" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="坐北朝南" value="south"></el-option>
                <el-option label="东向" value="east"></el-option>
                <el-option label="西向" value="west"></el-option>
                <el-option label="北向" value="north"></el-option>
                <el-option label="东南" value="southeast"></el-option>
                <el-option label="西南" value="southwest"></el-option>
                <el-option label="东北" value="northeast"></el-option>
                <el-option label="西北" value="northwest"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="建筑年代" prop="buildingAge" class="form-item">
              <el-select 
                v-model="formData.buildingAge" 
                placeholder="请选择建筑年代要求" 
                style="width: 100%"
                @focus="handleInputFocus">
                <el-option label="5年内新房" value="<5"></el-option>
                <el-option label="5-10年" value="5-10"></el-option>
                <el-option label="10-20年" value="10-20"></el-option>
                <el-option label="20年以上" value=">20"></el-option>
                <el-option label="不限" value="any"></el-option>
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 周边配套要求 -->
        <div class="form-section">
          <div class="section-title">
            <span>配套设施要求</span>
          </div>
          
          <div class="form-row">
            <el-form-item label="关注的配套设施" prop="facilities" class="form-item form-item-full">
              <el-checkbox-group v-model="formData.facilities">
                <el-checkbox label="education">教育配套(学校、幼儿园)</el-checkbox>
                <el-checkbox label="hospital">医疗设施</el-checkbox>
                <el-checkbox label="shopping">商业购物</el-checkbox>
                <el-checkbox label="transportation">交通便利</el-checkbox>
                <el-checkbox label="park">公园绿地</el-checkbox>
                <el-checkbox label="community">社区环境</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </div>
        </div>

        <!-- 需求描述输入区域 -->
        <div class="form-section">
          <div class="section-title">
            <span>其他具体需求描述</span>
          </div>
          
          <div class="description-input">
            <el-form-item prop="additionalNotes" class="form-item form-item-full" :rules="[{ required: true, message: '请输入需求描述', trigger: 'blur' }]">
              <el-input
                v-model="formData.additionalNotes"
                type="textarea"
                :rows="7"
                :autosize="{ minRows: 7, maxRows: 10 }"
                placeholder="请详细描述您的购房需求，包括但不限于：特殊户型要求、周边配套需求、生活便利性、投资回报预期等"
                @focus="handleInputFocus"
                @input="handleDescriptionInput"
                @blur="handleDescriptionBlur"
                ref="descriptionTextarea"
                maxlength="500"
                show-word-limit
              ></el-input>
            </el-form-item>
          </div>
          
          <!-- AI关键词提取区域 -->
          <div class="keywords-section" :style="keywordsSectionStyle">
            <div class="keywords-header">
              <span class="keywords-title">
                <el-icon><Aim /></el-icon>
                {{ baseKeywordsTitle }}
                <span v-if="showExtractionDuration" class="extraction-duration"> 用时{{ extractionDuration }}秒</span>
              </span>
              <el-button 
                :type="hasAttemptedExtraction ? 'default' : 'primary'"
                class="extract-button"
                :loading="isExtractingKeywords"
                @click="extractKeywords"
                :disabled="!formData.additionalNotes || isExtractingKeywords || (formData.additionalNotes && formData.additionalNotes.trim().length < 10)"
              >
                {{ hasAttemptedExtraction ? '重新提取' : '开始提取' }}
                <span class="shortcut-hint">Shift+Enter</span>
              </el-button>
            </div>
            <div class="keywords-content" v-if="aiKeywords.length > 0">
              <el-tag
                v-for="tag in aiKeywords"
                :key="tag.name"
                class="keyword-tag"
                :type="tag.category === 'positive' ? 'success' : tag.category === 'negative' ? 'danger' : 'info'"
                @close="removeKeyword(tag)"
                closable
                effect="plain"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 表单提交按钮 -->
        <div class="form-actions">
          <el-button @click="resetForm" plain>重置表单</el-button>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting">提交需求</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Aim } from '@element-plus/icons-vue'

export default {
  name: 'PropertyAdvisorForm',
  components: {
    Aim
  },
  emits: ['submit'],
  setup(props, { emit }) {
    // 表单引用
    const propertyFormRef = ref(null)
    const descriptionTextarea = ref(null)
    
    // 表单数据对象
    const formData = reactive({
      // 基本信息
      name: '',
      phone: '',
      familySize: 3,
      purpose: '',
      
      // 预算和偏好
      totalBudget: null,
      downPaymentRatio: 30,
      preferredAreas: [],
      houseType: '',
      decoration: '',
      
      // 面积和楼层
      minArea: null,
      maxArea: null,
      floorPreference: '',
      orientation: [],
      buildingAge: '',
      
      // 配套设施
      facilities: [],
      
      // 其他需求
      additionalNotes: '',
      
      // AI提取的关键词
      aiKeywords: []
    })
    
    // 验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入客户姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入联系方式', trigger: 'blur' },
        { pattern: /^1[3456789]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      totalBudget: [
        { required: true, message: '请输入购房预算', trigger: 'blur' }
      ],
      preferredAreas: [
        { required: true, message: '请选择期望区域', trigger: 'change' }
      ],
      additionalNotes: [
        { required: true, message: '请输入需求描述', trigger: 'blur' },
        { min: 10, message: '需求描述不能少于10个字符', trigger: 'blur' }
      ]
    }
    
    // 关键词提取状态
    const isExtractingKeywords = ref(false)
    const hasAttemptedExtraction = ref(false)
    const extractionStartTime = ref(0)
    const extractionEndTime = ref(0)
    const extractionDuration = ref(0)
    const showExtractionDuration = ref(false)
    const baseKeywordsTitle = ref('需求关键词提取')
    
    // 表单提交状态
    const isSubmitting = ref(false)
    
    // AI提取的关键词
    const aiKeywords = ref([])
    
    // 计算属性 - 关键词提取区域样式
    const keywordsSectionStyle = computed(() => {
      return {
        margin: aiKeywords.value.length > 0 ? '12px 0' : '0',
        display: formData.additionalNotes ? 'block' : 'none'
      }
    })
    
    // 方法 - 输入框焦点处理
    const handleInputFocus = (event) => {
      if (event && event.target) {
        setTimeout(() => {
          // 检查元素是否支持select方法
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select()
          }
        }, 0)
      }
    }
    
    // 方法 - 区间输入处理
    const handleRangeInput = (targetField) => {
      nextTick(() => {
        // 确保最小值不大于最大值
        if (targetField === 'maxArea' && formData.minArea && formData.maxArea && formData.minArea > formData.maxArea) {
          formData.maxArea = formData.minArea
        }
      })
    }
    
    // 方法 - 描述输入处理
    const handleDescriptionInput = () => {
      // 可以在这里添加输入时的处理逻辑
    }
    
    // 方法 - 描述失焦处理
    const handleDescriptionBlur = () => {
      // 可以在这里添加失焦时的处理逻辑
    }
    
    // 方法 - 提取关键词
    const extractKeywords = async () => {
      if (!formData.additionalNotes || formData.additionalNotes.trim().length < 10) {
        ElMessage.warning('需求描述内容过短，无法提取关键词')
        return
      }
      
      isExtractingKeywords.value = true
      hasAttemptedExtraction.value = true
      extractionStartTime.value = Date.now()
      
      try {
        // 这里应该调用后端API进行关键词提取
        // 为了演示，我们使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟的关键词提取结果
        const mockKeywords = [
          { name: '南北通透', category: 'positive', score: 0.95 },
          { name: '近地铁', category: 'positive', score: 0.90 },
          { name: '学区房', category: 'positive', score: 0.85 },
          { name: '精装修', category: 'positive', score: 0.80 },
          { name: '大户型', category: 'neutral', score: 0.75 },
          { name: '远离噪音', category: 'positive', score: 0.70 },
          { name: '有阳台', category: 'positive', score: 0.65 },
          { name: '停车方便', category: 'positive', score: 0.60 },
          { name: '绿化好', category: 'positive', score: 0.55 }
        ]
        
        aiKeywords.value = mockKeywords
        
        // 记录提取时间
        extractionEndTime.value = Date.now()
        extractionDuration.value = Math.round((extractionEndTime.value - extractionStartTime.value) / 100) / 10
        showExtractionDuration.value = true
        
        formData.aiKeywords = mockKeywords.map(kw => kw.name)
        
        ElMessage.success('关键词提取成功')
      } catch (error) {
        console.error('关键词提取失败:', error)
        ElMessage.error('关键词提取失败，请重试')
      } finally {
        isExtractingKeywords.value = false
      }
    }
    
    // 方法 - 移除关键词
    const removeKeyword = (tag) => {
      aiKeywords.value = aiKeywords.value.filter(item => item.name !== tag.name)
      formData.aiKeywords = formData.aiKeywords.filter(name => name !== tag.name)
    }
    
    // 方法 - 提交表单
    const submitForm = async () => {
      if (!propertyFormRef.value) return
      
      try {
        await propertyFormRef.value.validate()
        
        isSubmitting.value = true
        
        // 如果还没有提取关键词且有描述内容，自动提取关键词
        if (aiKeywords.value.length === 0 && formData.additionalNotes && formData.additionalNotes.trim().length >= 10) {
          await extractKeywords()
        }
        
        // 准备提交的数据
        const formDataToSubmit = {
          ...formData,
          aiKeywords: aiKeywords.value.map(kw => kw.name)
        }
        
        // 模拟提交到服务器的过程
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 向父组件发送数据
        emit('submit', formDataToSubmit)
        
        ElMessage.success('需求提交成功')
      } catch (error) {
        console.error('表单验证失败:', error)
        ElMessage.error('请完成必填项后再提交')
      } finally {
        isSubmitting.value = false
      }
    }
    
    // 方法 - 重置表单
    const resetForm = () => {
      ElMessageBox.confirm('确定要重置表单吗？所有填写的内容将被清空。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        propertyFormRef.value.resetFields()
        aiKeywords.value = []
        formData.aiKeywords = []
        hasAttemptedExtraction.value = false
        showExtractionDuration.value = false
        ElMessage.success('表单已重置')
      }).catch(() => {
        // 用户取消了重置操作
      })
    }
    
    // 键盘快捷键处理
    const handleKeyDown = (e) => {
      // Shift+Enter 快捷键提取关键词
      if (e.key === 'Enter' && e.shiftKey && formData.additionalNotes && !isExtractingKeywords.value) {
        extractKeywords()
        e.preventDefault()
      }
    }
    
    // 生命周期钩子
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown)
    })
    
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown)
    })
    
    return {
      propertyFormRef,
      descriptionTextarea,
      formData,
      formRules,
      isSubmitting,
      isExtractingKeywords,
      hasAttemptedExtraction,
      extractionDuration,
      showExtractionDuration,
      baseKeywordsTitle,
      aiKeywords,
      keywordsSectionStyle,
      handleInputFocus,
      handleRangeInput,
      handleDescriptionInput,
      handleDescriptionBlur,
      extractKeywords,
      removeKeyword,
      submitForm,
      resetForm
    }
  }
}
</script>

<style scoped>
.property-advisor-form {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-main {
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #1b68de;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 10px;
}

.form-item {
  flex: 1;
  min-width: calc(50% - 10px);
}

.form-item-full {
  flex: 0 0 100%;
  width: 100%;
}

@media (max-width: 768px) {
  .form-item {
    flex: 0 0 100%;
  }
}

.description-input {
  margin-bottom: 10px;
}

.keywords-section {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.keywords-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.keywords-title {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
}

.extraction-duration {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.extract-button {
  font-size: 12px;
}

.shortcut-hint {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.6;
}

.keywords-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin-right: 0;
}

.range-input {
  display: flex;
  align-items: center;
  width: 100%;
}

.range-item {
  flex: 1;
  margin-bottom: 0;
}

.range-separator {
  margin: 0 10px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.bold-number :deep(.el-input-number__decrease),
.bold-number :deep(.el-input-number__increase) {
  background-color: #f5f7fa;
}

.bold-number :deep(.el-input__inner) {
  color: #1b68de;
  font-weight: 500;
}
</style>