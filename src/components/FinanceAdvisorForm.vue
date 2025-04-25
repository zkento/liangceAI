<template>
  <div class="finance-advice-container">
    <!-- 左侧：客户融资需求 -->
    <div class="left-panel">
      <div class="panel-header">
        <div class="panel-title">客户融资需求</div>
      </div>
      <div class="panel-content">
        <el-form :model="formData" :rules="rules" ref="financeForm" label-position="top">
          <!-- 基本信息 -->
          <div class="form-section">
            <div class="section-title">基本信息</div>
            <div class="form-row">
              <el-form-item label="姓名" prop="name" class="form-item">
                <el-input v-model="formData.name" placeholder="请输入客户姓名" @focus="handleInputFocus"></el-input>
              </el-form-item>
              <el-form-item label="年龄" class="form-item">
                <el-input-number v-model="formData.age" :min="18" :max="100" :precision="0" :step="1" placeholder="请输入年龄"  @focus="handleInputFocus"></el-input-number>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="婚姻状况" prop="maritalStatus" class="form-item" :required="false">
                <el-select v-model="formData.maritalStatus" placeholder="请选择婚姻状况">
                  <el-option label="未婚" value="single"></el-option>
                  <el-option label="已婚" value="married"></el-option>
                  <el-option label="离异" value="divorced"></el-option>
                  <el-option label="丧偶" value="widowed"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="手机号码" prop="phone" class="form-item">
                <el-input 
                  v-model="displayPhone" 
                  placeholder="请输入手机号码" 
                  maxlength="13" 
                  @focus="handleInputFocus"
                  @input="formatPhoneNumber"></el-input>
              </el-form-item>
            </div>
          </div>

          <!-- 融资需求 -->
          <div class="form-section">
            <div class="section-title">融资需求</div>
            
            <!-- 贷款方式 - 改为radio平铺 -->
            <div class="form-row">
              <el-form-item label="贷款方式" prop="loanType" class="form-item form-item-full">
                <el-radio-group v-model="formData.loanType" @change="handleLoanTypeChange" class="loan-type-group">
                  <el-radio label="mortgage">按揭贷款</el-radio>
                  <el-radio label="secured">抵押贷款</el-radio>
                  <el-radio label="credit">信用贷款</el-radio>
                </el-radio-group>
              </el-form-item>
            </div>

            <!-- 需求描述区域容器 -->
            <div class="description-container">
              <div class="container-title">
                <span class="required-mark">*</span>
                <span>需求描述</span>
                <span class="subtitle"> AI将从你的描述结果中提取关键词用于产品推荐，若对关键词不满意可修改描述后重新提取。</span>
              </div>
              
              <div class="description-content">
                <!-- 需求描述输入区域 -->   
                <div class="description-input">
                  <el-form-item prop="additionalNotes" class="form-item form-item-full" :rules="[{ required: true, message: '请输入需求描述', trigger: 'blur' }]">
                    <el-input
                      v-model="formData.additionalNotes"
                      type="textarea"
                      :rows="7"
                      :autosize="{ minRows: 7, maxRows: 10 }"
                      :placeholder="getMoreDescriptionPlaceholder"
                      @focus="handleInputFocus"
                      @input="handleDescriptionInput"
                      @blur="handleDescriptionBlur"
                      ref="descriptionTextarea"
                      maxlength="500"
                      show-word-limit
                      v-scrollbar-aware
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
                      v-for="keyword in aiKeywords"
                      :key="keyword.key"
                      class="keyword-tag"
                      :type="keyword.type"
                    >
                      {{ keyword.value }}
                    </el-tag>
                  </div>
                  <div class="keywords-placeholder" v-else>
                    <template v-if="extractError">
                      {{ extractError }}
                    </template>
                    <template v-else-if="isExtractingKeywords">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      AI正在提取关键词中...
                    </template>
                    <template v-else>
                      请输入需求描述，然后"开始提取"
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 可选字段区域 -->
            <el-collapse v-if="formData.loanType">
              <el-collapse-item>
                <template #title>
                  <div class="collapse-title">
                    <span>更多选填信息</span>
                    <span class="collapse-subtitle">（更精准地提供客户的融资需求信息、系统将为客户试算还款计划）</span>
                  </div>
                </template>
            
            <!-- 贷款金额和还款方式 -->
            <div class="form-row" v-if="formData.loanType && formData.loanType !== 'mortgage'">
              <el-form-item label="贷款金额(万元)" prop="loanAmount" class="form-item">
                <el-input-number 
                  v-model="formData.loanAmount" 
                      :min="0" 
                  :max="10000" 
                  :precision="0" 
                      :step="2" 
                  style="width: 100%" 
                  @focus="handleInputFocus"
                  class="bold-number"></el-input-number>
              </el-form-item>
              
              <el-form-item 
                label="还款方式" 
                prop="repaymentMethod" 
                :required="false"
                class="form-item">
                <el-checkbox-group v-model="formData.repaymentMethod">
                  <el-checkbox v-for="item in repaymentOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </div>
            
            <!-- 通用字段 -->
            <template v-if="formData.loanType && formData.loanType !== 'mortgage'">
              <!-- 贷款利率 和 贷款期限 -->
              <div class="form-row">
                <el-form-item 
                  label="贷款利率范围(%)" 
                  prop="minInterestRate" 
                  class="form-item"
                  :required="false">
                  <div class="range-input">
                    <el-form-item prop="minInterestRate" class="range-item">
                      <el-input-number 
                        v-model="formData.minInterestRate" 
                        :min="1" 
                        :max="20" 
                        :precision="2" 
                        :step="0.1" 
                        placeholder="最小值" 
                        @focus="handleInputFocus"
                        @change="handleRangeInput('maxInterestRate')"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                    <span class="range-separator">至</span>
                    <el-form-item prop="maxInterestRate" class="range-item">
                      <el-input-number 
                        v-model="formData.maxInterestRate" 
                        :min="1" 
                        :max="20" 
                        :precision="2" 
                        :step="0.1" 
                        placeholder="最大值" 
                        @focus="handleInputFocus"
                        @change="handleRangeInput('maxInterestRate')"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                  </div>
                </el-form-item>
                
                <el-form-item 
                  label="贷款期限范围(月)" 
                  prop="minLoanTerm" 
                  class="form-item"
                  :required="false">
                  <div class="range-input">
                    <el-form-item prop="minLoanTerm" class="range-item">
                      <el-input-number 
                        v-model="formData.minLoanTerm" 
                        :min="1" 
                        :max="360" 
                        :step="1" 
                        placeholder="最小值" 
                        @focus="handleInputFocus"
                        @change="handleRangeInput('maxLoanTerm')"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                    <span class="range-separator">至</span>
                    <el-form-item prop="maxLoanTerm" class="range-item">
                      <el-input-number 
                        v-model="formData.maxLoanTerm" 
                        :min="1" 
                        :max="360" 
                        :step="1" 
                        placeholder="最大值" 
                        @focus="handleInputFocus"
                        @change="handleRangeInput('maxLoanTerm')"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                  </div>
                </el-form-item>
              </div>
            </template>
            
            <!-- 按揭贷款特定字段 -->
            <template v-if="formData.loanType === 'mortgage'">
              <!-- 贷款类型选择 -->
              <div class="form-row">
                <el-form-item label="贷款类型" prop="mortgageType" class="form-item form-item-full">
                  <el-radio-group v-model="formData.mortgage.mortgageType" @change="handleMortgageTypeChange">
                    <el-radio label="fund">公积金贷款</el-radio>
                    <el-radio label="commercial">商业贷款</el-radio>
                    <el-radio label="mixed">组合贷款</el-radio>
                  </el-radio-group>
                </el-form-item>
              </div>

              <template v-if="formData.mortgage.mortgageType">
                <!-- 公积金贷款字段 -->
                <template v-if="['fund', 'mixed'].includes(formData.mortgage.mortgageType)">
                  <div class="form-row">
                    <el-form-item label="公积金贷款金额(万元)" prop="fundLoanAmount" class="form-item">
                      <el-input-number 
                        v-model="formData.mortgage.fundLoanAmount" 
                        :min="0" 
                            :max="224" 
                        :precision="2" 
                            :step="10" 
                        style="width: 100%" 
                        @focus="handleInputFocus"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                    <el-form-item label="公积金贷款利率范围(%)" prop="fundInterestRate" class="form-item" :required="false">
                      <div class="range-input">
                        <el-form-item prop="mortgage.minFundRate" class="range-item">
                          <el-input-number 
                            v-model="formData.mortgage.minFundRate" 
                            :min="1" 
                            :max="20" 
                            :precision="3" 
                            :step="0.1" 
                            placeholder="最小值" 
                            @focus="handleInputFocus"
                            @change="handleRangeInput('mortgage.maxFundRate')"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                        <span class="range-separator">至</span>
                        <el-form-item prop="mortgage.maxFundRate" class="range-item">
                          <el-input-number 
                            v-model="formData.mortgage.maxFundRate" 
                            :min="1" 
                            :max="20" 
                            :precision="3" 
                            :step="0.1" 
                            placeholder="最大值" 
                            @focus="handleInputFocus"
                            @change="handleRangeInput('mortgage.maxFundRate')"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                      </div>
                    </el-form-item>
                  </div>
                  <div class="form-row">
                    <el-form-item label="公积金贷款还款方式" prop="fundRepaymentMethod" class="form-item form-item-full">
                      <el-radio-group v-model="formData.mortgage.fundRepaymentMethod">
                        <el-radio label="equal_principal_interest">等额本息</el-radio>
                        <el-radio label="equal_principal">等额本金</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </div>
                </template>

                <!-- 商业贷款字段 -->
                <template v-if="['commercial', 'mixed'].includes(formData.mortgage.mortgageType)">
                  <div class="form-row">
                    <el-form-item label="商业贷款金额(万元)" prop="commercialLoanAmount" class="form-item">
                      <el-input-number 
                        v-model="formData.mortgage.commercialLoanAmount" 
                        :min="0" 
                        :max="5000" 
                        :precision="2" 
                            :step="10" 
                        style="width: 100%" 
                        @focus="handleInputFocus"
                        class="bold-number"></el-input-number>
                    </el-form-item>
                    <el-form-item label="商业贷款利率范围(%)" prop="commercialInterestRate" class="form-item" :required="false">
                      <div class="range-input">
                        <el-form-item prop="mortgage.minCommercialRate" class="range-item">
                          <el-input-number 
                            v-model="formData.mortgage.minCommercialRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            placeholder="最小值" 
                            @focus="handleInputFocus"
                            @change="handleRangeInput('mortgage.maxCommercialRate')"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                        <span class="range-separator">至</span>
                        <el-form-item prop="mortgage.maxCommercialRate" class="range-item">
                          <el-input-number 
                            v-model="formData.mortgage.maxCommercialRate" 
                            :min="1" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            placeholder="最大值" 
                            @focus="handleInputFocus"
                            @change="handleRangeInput('mortgage.maxCommercialRate')"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                      </div>
                    </el-form-item>
                  </div>
                  <div class="form-row">
                    <el-form-item label="商业贷款还款方式" prop="commercialRepaymentMethod" class="form-item form-item-full">
                      <el-radio-group v-model="formData.mortgage.commercialRepaymentMethod">
                        <el-radio label="equal_principal_interest">等额本息</el-radio>
                        <el-radio label="equal_principal">等额本金</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </div>
                </template>

                <!-- 按揭贷款期限和房产信息 -->
                <div class="form-row">
                  <el-form-item label="按揭贷款期限范围(月)" prop="mortgageLoanTerm" class="form-item" :required="false">
                    <div class="range-input">
                      <el-form-item prop="mortgage.minMortgageTerm" class="range-item">
                        <el-input-number 
                          v-model="formData.mortgage.minMortgageTerm" 
                          :min="60" 
                          :max="360" 
                          :step="12" 
                          placeholder="最小值" 
                          @focus="handleInputFocus"
                          @change="handleRangeInput('mortgage.maxMortgageTerm')"
                          class="bold-number"></el-input-number>
                      </el-form-item>
                      <span class="range-separator">至</span>
                      <el-form-item prop="mortgage.maxMortgageTerm" class="range-item">
                        <el-input-number 
                          v-model="formData.mortgage.maxMortgageTerm" 
                          :min="60" 
                          :max="360" 
                          :step="12" 
                          placeholder="最大值" 
                          @focus="handleInputFocus"
                          @change="handleRangeInput('mortgage.maxMortgageTerm')"
                          class="bold-number"></el-input-number>
                      </el-form-item>
                    </div>
                  </el-form-item>
                  
                  <!-- 为了保持行的平衡添加一个空白元素 -->
                  <div class="form-item" style="visibility: hidden;"></div>
                </div>

                <!-- 房产信息 -->
                <div class="form-row">
                  <el-form-item label="房产总价(万元)" prop="propertyValue" class="form-item">
                    <el-input-number 
                      v-model="formData.mortgage.propertyValue" 
                          :min="10" 
                      :max="5000" 
                      :precision="2" 
                          :step="10" 
                      style="width: 100%" 
                      @focus="handleInputFocus" 
                      @change="calculateLoanAmount"></el-input-number>
                  </el-form-item>
                  <el-form-item label="是否首套房" prop="isFirstProperty" class="form-item">
                    <el-radio-group v-model="formData.mortgage.isFirstProperty">
                      <el-radio :value="true">是</el-radio>
                      <el-radio :value="false">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="首付比例(%)" prop="downPaymentRatio" class="form-item">
                    <el-input-number 
                      v-model="formData.mortgage.downPaymentRatio" 
                      :min="20" 
                      :max="90" 
                      :step="5" 
                      style="width: 100%" 
                      @focus="handleInputFocus" 
                      @change="calculateLoanAmount"></el-input-number>
                  </el-form-item>
                  <el-form-item label="房产类型" prop="propertyType" class="form-item">
                    <el-select v-model="formData.mortgage.propertyType" placeholder="请选择房产类型" style="width: 100%" @focus="handleInputFocus">
                      <el-option label="普通住宅" value="residential"></el-option>
                      <el-option label="别墅" value="villa"></el-option>
                      <el-option label="公寓" value="apartment"></el-option>
                      <el-option label="商铺" value="commercial"></el-option>
                      <el-option label="写字楼" value="office"></el-option>
                    </el-select>
                  </el-form-item>
                </div>
              </template>
            </template>
            
            <!-- 抵押贷款特定字段 -->
            <template v-if="formData.loanType === 'secured'">
              <div class="form-row">
                <el-form-item label="贷款用途" prop="loanPurpose" class="form-item">
                  <el-select v-model="formData.secured.loanPurpose" placeholder="请选择贷款用途" style="width: 100%" @change="handleLoanPurposeChange">
                    <el-option label="个人消费" value="personal"></el-option>
                    <el-option label="企业经营" value="business"></el-option>
                    <el-option label="教育支出" value="education"></el-option>
                    <el-option label="医疗支出" value="medical"></el-option>
                    <el-option label="装修支出" value="renovation"></el-option>
                    <el-option label="其他" value="other"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="抵押物类型" prop="collateralType" class="form-item">
                  <el-select v-model="formData.secured.collateralType" placeholder="请选择抵押物类型" style="width: 100%">
                    <el-option label="房产" value="property"></el-option>
                    <el-option label="车位" value="parking"></el-option>
                    <el-option label="厂房" value="factory"></el-option>
                    <el-option label="土地" value="land"></el-option>
                    <el-option label="机器设备" value="equipment"></el-option>
                    <el-option label="车辆" value="vehicle"></el-option>
                    <el-option label="存款证明" value="deposit"></el-option>
                    <el-option label="有价证券" value="securities"></el-option>
                  </el-select>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item label="抵押物价值(万元)" prop="collateralValue" class="form-item">
                      <el-input-number v-model="formData.secured.collateralValue" :min="0" :max="5000" :precision="2" :step="1" style="width: 100%" @focus="handleInputFocus"></el-input-number>
                </el-form-item>
                <el-form-item label="抵押率(%)" prop="mortgageRatio" class="form-item">
                  <el-input-number v-model="formData.secured.mortgageRatio" :min="0" :max="90" :step="5" style="width: 100%" @focus="handleInputFocus"></el-input-number>
                </el-form-item>
              </div>
              
              <!-- 企业经营相关字段 -->
              <template v-if="formData.secured.loanPurpose === 'business'">
                <div class="form-row">
                  <el-form-item label="企业经营年限" prop="businessYears" class="form-item">
                    <el-input-number v-model="formData.secured.businessYears" :min="0" :max="100" :step="1" style="width: 100%"@focus="handleInputFocus"></el-input-number>
                  </el-form-item>
                  <el-form-item label="是否有营业执照" prop="hasBusinessLicense" class="form-item">
                    <el-radio-group v-model="formData.secured.hasBusinessLicense">
                      <el-radio :value="true">是</el-radio>
                      <el-radio :value="false">否</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </div>
                <div class="form-row" v-if="formData.secured.hasBusinessLicense">
                  <el-form-item label="营业执照时长(月)" prop="businessLicenseMonths" class="form-item">
                    <el-input-number v-model="formData.secured.businessLicenseMonths" :min="0" :max="1200" :step="1" style="width: 100%" @focus="handleInputFocus"></el-input-number>
                  </el-form-item>
                </div>
              </template>
            </template>
            
            <!-- 信用贷款特定字段 -->
            <template v-if="formData.loanType === 'credit'">
              <div class="form-row">
                <el-form-item label="贷款用途" prop="loanPurpose" class="form-item">
                  <el-select v-model="formData.credit.loanPurpose" placeholder="请选择贷款用途" style="width: 100%">
                    <el-option label="个人消费" value="personal"></el-option>
                    <el-option label="教育支出" value="education"></el-option>
                    <el-option label="医疗支出" value="medical"></el-option>
                    <el-option label="创业" value="startup"></el-option>
                    <el-option label="旅游" value="travel"></el-option>
                    <el-option label="其他" value="other"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="月收入(元)" prop="monthlyIncome" class="form-item">
                  <el-input-number v-model="formData.credit.monthlyIncome" :min="1000" :max="1000000" :step="1000" style="width: 100%" @focus="handleInputFocus"></el-input-number>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item label="工作单位性质" prop="employerType" class="form-item">
                  <el-select v-model="formData.credit.employerType" placeholder="请选择工作单位性质" style="width: 100%">
                    <el-option label="国企" value="state"></el-option>
                    <el-option label="外企" value="foreign"></el-option>
                    <el-option label="民企" value="private"></el-option>
                    <el-option label="事业单位" value="institution"></el-option>
                    <el-option label="政府机关" value="government"></el-option>
                    <el-option label="自由职业" value="freelance"></el-option>
                    <el-option label="其他" value="other"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="工作年限" prop="workYears" class="form-item">
                  <el-input-number v-model="formData.credit.workYears" :min="0" :max="50" :step="1" style="width: 100%" @focus="handleInputFocus"  ></el-input-number>
                </el-form-item>
              </div>
            </template>
              </el-collapse-item>
            </el-collapse>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <el-button @click="resetForm">重置</el-button>
            <el-button 
              type="primary" 
              @click="submitFinanceForm" 
              :loading="submitting"
              :disabled="isExtractingKeywords"
            >{{ isExtractingKeywords ? 'AI正在提取关键词' : '让AI生成融资建议报告' }}</el-button>            
            </div>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 右侧面板 -->
    <div class="right-panel">
      <!-- 右上部分：客户征信报告 -->
      <div class="right-top-panel">
        <div class="panel-header">
          <div class="panel-title">客户征信报告</div>
        </div>
        <div class="panel-content">
          <!-- 征信报告上传区域 -->
          <div class="upload-section">
            <div class="upload-row">
              <!-- 个人征信报告上传 -->
              <div class="upload-item">
                <div class="upload-title">
                  <el-icon><Document /></el-icon>
                  <span>个人征信报告</span>
                  <span class="upload-optional">(可选)</span>
                </div>
                <div class="upload-area">
                  <div class="upload-disabled-mask">
                    <div class="upload-disabled-content">
                      <el-icon><InfoFilled /></el-icon>
                      <span>上传征信报告功能正在努力开发中...</span>
                    </div>
                  </div>
                  <el-upload
                    class="upload-container"
                    drag
                    action="/api/file/upload"
                    :on-success="handlePersonalCreditSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUploadDisabled"
                    :file-list="personalCreditFiles"
                    :limit="1"
                    :on-exceed="handleExceed"
                    :on-remove="handlePersonalCreditRemove"
                    accept=".pdf"
                    disabled
                  >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                      拖拽文件到此处或 <em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        请上传PDF格式的个人征信报告文件，大小不超过10MB
                      </div>
                    </template>
                  </el-upload>
                </div>
              </div>
              
              <!-- 企业征信报告上传（仅当抵押贷款且用途为企业经营时显示） -->
              <div class="upload-item" v-if="isBusinessSecuredLoan">
                <div class="upload-title">
                  <el-icon><Document /></el-icon>
                  <span>企业征信报告</span>
                  <span class="upload-optional">(可选)</span>
                </div>
                <div class="upload-area">
                  <div class="upload-disabled-mask">
                    <div class="upload-disabled-content">
                      <el-icon><InfoFilled /></el-icon>
                      <span>上传征信报告功能正在努力开发中...</span>
                    </div>
                  </div>
                  <el-upload
                    class="upload-container"
                    drag
                    action="/api/file/upload"
                    :on-success="handleBusinessCreditSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUploadDisabled"
                    :file-list="businessCreditFiles"
                    :limit="1"
                    :on-exceed="handleExceed"
                    :on-remove="handleBusinessCreditRemove"
                    accept=".pdf"
                    disabled
                  >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                      拖拽文件到此处或 <em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        请上传PDF格式的企业征信报告文件，大小不超过10MB
                      </div>
                    </template>
                  </el-upload>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右下部分：还款计划试算 -->
      <div class="right-bottom-panel">
        <div class="panel-header">
          <div class="panel-title">还款计划试算</div>
          <!-- 组合贷款情况下的切换按钮 -->
          <div v-if="formData.loanType === 'mortgage' && formData.mortgage.mortgageType === 'mixed'" class="loan-type-switch">
            <div class="custom-radio-group">
              <div 
                class="custom-radio-button" 
                :class="{ 'active': activeLoanType === 'fund' }"
                @click="activeLoanType = 'fund'"
              >
                公积金贷款
              </div>
              <div 
                class="custom-radio-button" 
                :class="{ 'active': activeLoanType === 'commercial' }"
                @click="activeLoanType = 'commercial'"
              >
                商业贷款
              </div>
            </div>
          </div>
        </div>
        <div class="panel-content">
          <!-- 还款计划表试算区域 -->
          <div v-if="canCalculateRepayment" class="repayment-calculator">
            <!-- 试算参数展示 -->
            <div class="calculation-params">
              <div class="param-item">
                <span class="param-label">贷款金额:</span>
                <span class="param-value">{{ calculationParams.loanAmount }}万元</span>
              </div>
              <div class="param-item">
                <span class="param-label">贷款利率:</span>
                <span class="param-value">{{ calculationParams.interestRate }}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">贷款期限:</span>
                <span class="param-value">{{ calculationParams.loanTerm }}月</span>
              </div>
              <div class="param-item">
                <span class="param-label">还款方式:</span>
                <span class="param-value">{{ calculationParams.repaymentMethodLabel }}</span>
              </div>
            </div>
            
            <!-- 还款概览 -->
            <div class="repayment-overview">
              <div class="overview-item">
                <div class="overview-value">{{ formatCurrency(calculationResult.totalRepayment) }}</div>
                <div class="overview-label">总还款额(元)</div>
              </div>
              <div class="overview-item">
                <div class="overview-value">{{ formatCurrency(calculationResult.totalInterest) }}</div>
                <div class="overview-label">总利息(元)</div>
              </div>
              <div class="overview-item" v-if="calculationParams.repaymentMethod === 'equal_principal_interest'">
                <div class="overview-value">{{ formatCurrency(calculationResult.monthlyPayment) }}</div>
                <div class="overview-label">月供(元)</div>
              </div>
            </div>
            
            <!-- 还款计划表 -->
            <div class="repayment-schedule">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th class="center" style="min-width: 60px;">期数</th>
                    <th class="center" style="min-width: 120px;">还款日期</th>
                    <th class="center" style="min-width: 120px;">月供(元)</th>
                    <th class="center" style="min-width: 120px;">本金(元)</th>
                    <th class="center" style="min-width: 120px;">利息(元)</th>
                    <th class="center" style="min-width: 120px;">剩余本金(元)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in calculationResult.schedule" :key="item.period">
                    <td class="center">{{ item.period }}</td>
                    <td class="center">{{ item.paymentDate }}</td>
                    <td class="center">{{ formatCurrency(item.monthlyPayment) }}</td>
                    <td class="center">{{ formatCurrency(item.principal) }}</td>
                    <td class="center">{{ formatCurrency(item.interest) }}</td>
                    <td class="center">{{ formatCurrency(item.remainingPrincipal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- 提示信息 -->
          <div v-else class="placeholder-content">
            <div class="calculation-tips">
              <!-- <el-icon><InfoFilled /></el-icon> -->
              <span>请选择"贷款方式"后在"更多选填信息"中，<br>完善贷款金额、利率、期限和还款方式，系统将实时试算还款计划</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Document, UploadFilled, InfoFilled, Aim, Refresh, Loading, Warning } from '@element-plus/icons-vue'
import { ElNotification, ElMessage } from 'element-plus'
import debounce from 'lodash/debounce'
// 导入sendMessage API
import { sendMessage } from '../api/chat'

// 添加自定义指令
const vScrollbarAware = {
  mounted(el) {
    updateWordCountPosition(el);
    // 创建一个MutationObserver来监听DOM变化
    const observer = new MutationObserver(() => updateWordCountPosition(el));
    observer.observe(el, { attributes: true, childList: true, subtree: true });
    
    // 创建一个ResizeObserver来监听尺寸变化
    const resizeObserver = new ResizeObserver(() => updateWordCountPosition(el));
    resizeObserver.observe(el);
    
    // 监听滚动事件
    el.addEventListener('scroll', () => updateWordCountPosition(el));
    
    // 存储observers以便后续清理
    el._scrollbarObservers = { observer, resizeObserver };
  },
  updated(el) {
    updateWordCountPosition(el);
  },
  unmounted(el) {
    // 清理observers
    if (el._scrollbarObservers) {
      el._scrollbarObservers.observer.disconnect();
      el._scrollbarObservers.resizeObserver.disconnect();
    }
    el.removeEventListener('scroll', () => updateWordCountPosition(el));
  }
};

// 计算并更新字数统计位置的函数
function updateWordCountPosition(el) {
  // 找到textarea元素和字数统计元素
  const textarea = el.querySelector('.el-textarea__inner');
  const wordCount = el.querySelector('.el-input__count');
  
  if (!textarea || !wordCount) return;
  
  // 检测滚动条是否显示
  const hasVerticalScrollbar = textarea.scrollHeight > textarea.clientHeight;
  
  // 动态计算滚动条宽度
  const scrollbarWidth = getScrollbarWidth();
  
  // 设置字数统计的位置
  if (hasVerticalScrollbar) {
    wordCount.style.right = `${scrollbarWidth + 5}px`; // 5px作为额外间距
  } else {
    wordCount.style.right = '5px'; // 无滚动条时的默认位置
  }
}

// 获取滚动条宽度的函数（兼容不同浏览器）
function getScrollbarWidth() {
  // 创建一个带滚动条的div
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  
  // 创建一个内部div
  const inner = document.createElement('div');
  outer.appendChild(inner);
  
  // 计算滚动条宽度
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  
  // 清理DOM
  outer.parentNode.removeChild(outer);
  
  return scrollbarWidth;
}

export default {
  name: 'FinanceAdvisorForm',
  components: {
    Document,
    UploadFilled,
    InfoFilled,
    Aim,
    Refresh,
    Loading,
    Warning
  },
  directives: {
    scrollbarAware: vScrollbarAware
  },
  emits: ['submit'],  // 添加提交事件
  data() {
    return {
      submitting: false,
      hasAttemptedExtraction: false,
      // 新增：记录上次提取时的文本内容
      lastExtractedText: '',
      // 征信报告文件列表
      personalCreditFiles: [],
      businessCreditFiles: [],
      // 计算结果
      calculationResult: {
        totalRepayment: 0,
        totalInterest: 0,
        monthlyPayment: 0,
        schedule: []
      },
      // 显示格式化的手机号
      displayPhone: '',
      // 组合贷款当前显示的贷款类型 (fund: 公积金贷款, commercial: 商业贷款)
      activeLoanType: 'fund',
      formData: {
        // 基本信息
        name: '',
        age: null,
        maritalStatus: '',
        phone: '',
        
        // 融资需求通用字段
        loanType: '',
        loanAmount: null, // 修改为null，初始显示为空
        minInterestRate: 0, // 修改为0
        maxInterestRate: 0, // 修改为0
        minLoanTerm: 0, // 修改为0
        maxLoanTerm: 0, // 修改为0
        repaymentMethod: [],
        
        // 按揭贷款特定字段
        mortgage: {
          propertyType: 'residential',
          propertyValue: null, // 使用null代替空字符串
          downPaymentRatio: null, // 使用null代替空字符串
          isFirstProperty: true,
          mortgageType: '',
          fundLoanAmount: 0,
          commercialLoanAmount: 0,
          minMortgageTerm: 240,
          maxMortgageTerm: 360
        },
        
        // 抵押贷款特定字段
        secured: {
          loanPurpose: '',
          collateralType: '',
          collateralValue: null, // 使用null代替空字符串
          mortgageRatio: null, // 使用null代替空字符串
          // 企业经营相关字段
          businessYears: null, // 使用null代替空字符串
          hasBusinessLicense: false,
          businessLicenseMonths: null // 使用null代替空字符串
        },
        
        // 信用贷款特定字段
        credit: {
          loanPurpose: '',
          monthlyIncome: '',
          employerType: '',
          workYears: ''
        },
        additionalNotes: ''
      },
      rules: {
        // 基本信息验证规则
        name: [
          { required: true, message: '请输入客户姓名', trigger: 'blur' }
        ],
        age: [
          { required: false }
        ],
        maritalStatus: [
          { required: false }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        
        // 融资需求验证规则
        loanType: [
          { required: true, message: '请选择贷款方式', trigger: 'change' }
        ],
        
        // 按揭贷款必填字段
        'mortgage.mortgageType': [
          { required: true, message: '请选择按揭贷款方式', trigger: 'change' }
        ],
        'mortgage.propertyType': [
          { required: true, message: '请选择房产类型', trigger: 'change' }
        ],
        'mortgage.propertyValue': [
          { required: true, message: '请输入房产总价', trigger: 'blur' }
        ],
        'mortgage.downPaymentRatio': [
          { required: true, message: '请输入首付比例', trigger: 'blur' }
        ],
        'mortgage.minMortgageTerm': [
          { required: true, message: '请输入按揭贷款期限最小值', trigger: 'blur' }
        ],
        'mortgage.maxMortgageTerm': [
          { required: true, message: '请输入按揭贷款期限最大值', trigger: 'blur' }
        ],

        // 通用字段范围值验证
        minInterestRate: [
          { validator: (rule, value, callback) => {
            // 只在当前字段有值时才校验
            if (value !== null && value !== undefined && value !== '') {
              if (this.formData.maxInterestRate !== null && this.formData.maxInterestRate !== undefined && this.formData.maxInterestRate !== '' &&
                  value > this.formData.maxInterestRate) {
                callback(new Error('最小利率不能大于最大利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        maxInterestRate: [
          { validator: (rule, value, callback) => {
            // 只在当前字段有值时才校验
            if (value !== null && value !== undefined && value !== '') {
              if (this.formData.minInterestRate !== null && this.formData.minInterestRate !== undefined && this.formData.minInterestRate !== '' &&
                  value < this.formData.minInterestRate) {
                callback(new Error('最大利率不能小于最小利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        minLoanTerm: [
          { validator: (rule, value, callback) => {
            // 只在当前字段有值时才校验
            if (value !== null && value !== undefined && value !== '') {
              if (this.formData.maxLoanTerm !== null && this.formData.maxLoanTerm !== undefined && this.formData.maxLoanTerm !== '' &&
                  value > this.formData.maxLoanTerm) {
                callback(new Error('最小期限不能大于最大期限'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        maxLoanTerm: [
          { validator: (rule, value, callback) => {
            // 只在当前字段有值时才校验
            if (value !== null && value !== undefined && value !== '') {
              if (this.formData.minLoanTerm !== null && this.formData.minLoanTerm !== undefined && this.formData.minLoanTerm !== '' &&
                  value < this.formData.minLoanTerm) {
                callback(new Error('最大期限不能小于最小期限'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],

        // 按揭贷款范围值验证
        'mortgage.minFundRate': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.maxFundRate !== null && this.formData.mortgage.maxFundRate !== undefined && 
                  this.formData.mortgage.maxFundRate !== '' && value > this.formData.mortgage.maxFundRate) {
                callback(new Error('最小利率不能大于最大利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        'mortgage.maxFundRate': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.minFundRate !== null && this.formData.mortgage.minFundRate !== undefined && 
                  this.formData.mortgage.minFundRate !== '' && value < this.formData.mortgage.minFundRate) {
                callback(new Error('最大利率不能小于最小利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        'mortgage.minCommercialRate': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.maxCommercialRate !== null && this.formData.mortgage.maxCommercialRate !== undefined && 
                  this.formData.mortgage.maxCommercialRate !== '' && value > this.formData.mortgage.maxCommercialRate) {
                callback(new Error('最小利率不能大于最大利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        'mortgage.maxCommercialRate': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.minCommercialRate !== null && this.formData.mortgage.minCommercialRate !== undefined && 
                  this.formData.mortgage.minCommercialRate !== '' && value < this.formData.mortgage.minCommercialRate) {
                callback(new Error('最大利率不能小于最小利率'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        'mortgage.minMortgageTerm': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.maxMortgageTerm !== null && this.formData.mortgage.maxMortgageTerm !== undefined && 
                  this.formData.mortgage.maxMortgageTerm !== '' && value > this.formData.mortgage.maxMortgageTerm) {
                callback(new Error('最小期限不能大于最大期限'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
        'mortgage.maxMortgageTerm': [
          { validator: (rule, value, callback) => {
            // 只在贷款方式为按揭贷款且当前字段有值时才校验
            if (this.formData.loanType === 'mortgage' && value !== null && value !== undefined && value !== '') {
              if (this.formData.mortgage.minMortgageTerm !== null && this.formData.mortgage.minMortgageTerm !== undefined && 
                  this.formData.mortgage.minMortgageTerm !== '' && value < this.formData.mortgage.minMortgageTerm) {
                callback(new Error('最大期限不能小于最小期限'));
              } else {
                callback();
              }
            } else {
              callback();
            }
          }, trigger: 'blur' }
        ],
      },
      // 不同贷款方式的还款方式选项
      repaymentOptions: [
        { label: '等额本息', value: 'equal_principal_interest' },
        { label: '等额本金', value: 'equal_principal' },
        { label: '先息后本', value: 'interest_first' },
        { label: '一次性还本付息', value: 'lump_sum' },
      ],
      aiKeywords: [],
      keywordsSectionStyle: {
        height: 'auto',
        minHeight: '164px' // 设置最小高度匹配文本区域初始高度
      },
      extractError: '', // 添加提取错误信息字段
      extractionStartTime: 0,
      extractionDuration: 0,
      extractionTimerInterval: null,
      
      // 提取任务控制
      extractionTaskId: 0,
    }
  },
  computed: {
    // 判断是否为抵押贷款且用途为企业经营
    isBusinessSecuredLoan() {
      return this.formData.loanType === 'secured' && this.formData.secured.loanPurpose === 'business';
    },
    
    // 判断是否可以计算还款计划
    canCalculateRepayment() {
      if (!this.formData.loanType) {
        return false;
      }

      if (this.formData.loanType === 'mortgage') {
        // 按揭贷款的验证逻辑
        if (!this.formData.mortgage.mortgageType) {
          return false;
        }

        const mortgageType = this.formData.mortgage.mortgageType;
        
        if (mortgageType === 'fund') {
          // 公积金贷款
      return (
            this.formData.mortgage.fundLoanAmount > 0 &&
            this.formData.mortgage.minFundRate > 0 &&
            this.formData.mortgage.maxFundRate > 0 &&
            this.formData.mortgage.minMortgageTerm > 0 &&
            this.formData.mortgage.maxMortgageTerm > 0 &&
            this.formData.mortgage.fundRepaymentMethod
          );
        } else if (mortgageType === 'commercial') {
          // 商业贷款
          return (
            this.formData.mortgage.commercialLoanAmount > 0 &&
            this.formData.mortgage.minCommercialRate > 0 &&
            this.formData.mortgage.maxCommercialRate > 0 &&
            this.formData.mortgage.minMortgageTerm > 0 &&
            this.formData.mortgage.maxMortgageTerm > 0 &&
            this.formData.mortgage.commercialRepaymentMethod
          );
        } else if (mortgageType === 'mixed') {
          // 组合贷款 - 判断当前显示的是哪种贷款类型
          if (this.activeLoanType === 'fund') {
            return (
              this.formData.mortgage.fundLoanAmount > 0 &&
              this.formData.mortgage.minFundRate > 0 &&
              this.formData.mortgage.maxFundRate > 0 &&
              this.formData.mortgage.minMortgageTerm > 0 &&
              this.formData.mortgage.maxMortgageTerm > 0 &&
              this.formData.mortgage.fundRepaymentMethod
            );
          } else {
            return (
              this.formData.mortgage.commercialLoanAmount > 0 &&
              this.formData.mortgage.minCommercialRate > 0 &&
              this.formData.mortgage.maxCommercialRate > 0 &&
              this.formData.mortgage.minMortgageTerm > 0 &&
              this.formData.mortgage.maxMortgageTerm > 0 &&
              this.formData.mortgage.commercialRepaymentMethod
            );
          }
        }
        return false;
      } else {
        // 抵押贷款和信用贷款的验证逻辑
        return (
          this.formData.loanAmount !== null && 
        this.formData.loanAmount > 0 &&
        this.formData.minInterestRate > 0 &&
        this.formData.maxInterestRate > 0 &&
        this.formData.minLoanTerm > 0 &&
        this.formData.maxLoanTerm > 0 &&
        this.formData.repaymentMethod.length > 0
      );
      }
    },
    
    // 计算参数
    calculationParams() {
      if (this.formData.loanType === 'mortgage') {
        // 按揭贷款参数
        const mortgageType = this.formData.mortgage.mortgageType;
        
        if (mortgageType === 'fund') {
          // 公积金贷款
          return {
            loanAmount: this.formData.mortgage.fundLoanAmount,
            interestRate: this.formData.mortgage.minFundRate,
            loanTerm: this.formData.mortgage.minMortgageTerm,
            repaymentMethod: this.formData.mortgage.fundRepaymentMethod,
            repaymentMethodLabel: this.formData.mortgage.fundRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
          };
        } else if (mortgageType === 'commercial') {
          // 商业贷款
          return {
            loanAmount: this.formData.mortgage.commercialLoanAmount,
            interestRate: this.formData.mortgage.minCommercialRate,
            loanTerm: this.formData.mortgage.minMortgageTerm,
            repaymentMethod: this.formData.mortgage.commercialRepaymentMethod,
            repaymentMethodLabel: this.formData.mortgage.commercialRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
          };
        } else if (mortgageType === 'mixed') {
          // 组合贷款 - 根据当前显示的贷款类型返回不同参数
          if (this.activeLoanType === 'fund') {
            return {
              loanAmount: this.formData.mortgage.fundLoanAmount,
              interestRate: this.formData.mortgage.minFundRate,
              loanTerm: this.formData.mortgage.minMortgageTerm,
              repaymentMethod: this.formData.mortgage.fundRepaymentMethod,
              repaymentMethodLabel: this.formData.mortgage.fundRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
            };
          } else {
            return {
              loanAmount: this.formData.mortgage.commercialLoanAmount,
              interestRate: this.formData.mortgage.minCommercialRate,
              loanTerm: this.formData.mortgage.minMortgageTerm,
              repaymentMethod: this.formData.mortgage.commercialRepaymentMethod,
              repaymentMethodLabel: this.formData.mortgage.commercialRepaymentMethod === 'equal_principal_interest' ? '等额本息' : '等额本金'
            };
          }
        }
        
        // 默认返回空对象
        return {
          loanAmount: 0,
          interestRate: 0,
          loanTerm: 0,
          repaymentMethod: '',
          repaymentMethodLabel: ''
        };
      } else {
        // 原有的抵押贷款和信用贷款的计算参数
      // 使用最小值作为计算参数（而非平均值）
      const interestRate = this.formData.minInterestRate;
      const loanTerm = this.formData.minLoanTerm;
      // 使用第一个还款方式进行计算
      const repaymentMethod = this.formData.repaymentMethod[0] || '';
      
      // 获取还款方式的中文名称
      let repaymentMethodLabel = '';
      const method = this.repaymentOptions.find(item => item.value === repaymentMethod);
      if (method) {
        repaymentMethodLabel = method.label;
      }
      
      return {
          loanAmount: this.formData.loanAmount,
        interestRate,
        loanTerm,
        repaymentMethod,
        repaymentMethodLabel
      };
      }
    },
    
    // 根据贷款方式显示不同的利率标签
    interestRateLabel() {
      switch(this.formData.mortgage.mortgageType) {
        case 'fund':
          return '公积金贷款利率(%)';
        case 'commercial':
          return '商业贷款利率(%)';
        case 'mixed':
          return '综合贷款利率(%)';
        default:
          return '贷款利率(%)';
      }
    },
    getMoreDescriptionPlaceholder() {
      let loanType = '';
      switch(this.formData.loanType) {
        case 'mortgage':
          loanType = '按揭';
          break;
        case 'secured':
          loanType = '抵押';
          break;
        case 'credit':
          loanType = '信用';
          break;
        default:
          loanType = '';
      }
      return `请用文字完整描述客户的${loanType}贷款融资需求，若描述内容与选填信息有不一致的，系统将以描述内容为准。`;
    },
    // 通用贷款范围值错误检测
    rangeErrors() {
      try {
        return {
          interestRate: this.formData.minInterestRate !== null && 
                       this.formData.minInterestRate !== undefined && 
                       this.formData.minInterestRate !== '' &&
                       this.formData.maxInterestRate !== null && 
                       this.formData.maxInterestRate !== undefined && 
                       this.formData.maxInterestRate !== '' &&
                       this.formData.minInterestRate > this.formData.maxInterestRate,
                       
          loanTerm: this.formData.minLoanTerm !== null && 
                   this.formData.minLoanTerm !== undefined && 
                   this.formData.minLoanTerm !== '' &&
                   this.formData.maxLoanTerm !== null && 
                   this.formData.maxLoanTerm !== undefined && 
                   this.formData.maxLoanTerm !== '' &&
                   this.formData.minLoanTerm > this.formData.maxLoanTerm
        };
      } catch (error) {
        console.error('计算范围错误时发生异常:', error);
        return { interestRate: false, loanTerm: false };
      }
    },

    // 按揭贷款范围值错误检测
    mortgageRangeErrors() {
      try {
        return {
          fundRate: this.formData.loanType === 'mortgage' && 
                   ['fund', 'mixed'].includes(this.formData.mortgage?.mortgageType) && 
                   this.formData.mortgage?.minFundRate !== null && 
                   this.formData.mortgage?.minFundRate !== undefined && 
                   this.formData.mortgage?.minFundRate !== '' &&
                   this.formData.mortgage?.maxFundRate !== null && 
                   this.formData.mortgage?.maxFundRate !== undefined && 
                   this.formData.mortgage?.maxFundRate !== '' &&
                   this.formData.mortgage?.minFundRate > this.formData.mortgage?.maxFundRate,
                   
          commercialRate: this.formData.loanType === 'mortgage' && 
                         ['commercial', 'mixed'].includes(this.formData.mortgage?.mortgageType) && 
                         this.formData.mortgage?.minCommercialRate !== null && 
                         this.formData.mortgage?.minCommercialRate !== undefined && 
                         this.formData.mortgage?.minCommercialRate !== '' &&
                         this.formData.mortgage?.maxCommercialRate !== null && 
                         this.formData.mortgage?.maxCommercialRate !== undefined && 
                         this.formData.mortgage?.maxCommercialRate !== '' &&
                         this.formData.mortgage?.minCommercialRate > this.formData.mortgage?.maxCommercialRate,
                         
          mortgageTerm: this.formData.loanType === 'mortgage' && 
                        this.formData.mortgage?.minMortgageTerm !== null && 
                        this.formData.mortgage?.minMortgageTerm !== undefined && 
                        this.formData.mortgage?.minMortgageTerm !== '' &&
                        this.formData.mortgage?.maxMortgageTerm !== null && 
                        this.formData.mortgage?.maxMortgageTerm !== undefined && 
                        this.formData.mortgage?.maxMortgageTerm !== '' &&
                        this.formData.mortgage?.minMortgageTerm > this.formData.mortgage?.maxMortgageTerm
        };
      } catch (error) {
        console.error('计算按揭范围错误时发生异常:', error);
        return { fundRate: false, commercialRate: false, mortgageTerm: false };
      }
    },
    
    // 计算标题显示
    baseKeywordsTitle() {
      return 'AI提取的关键词';
    },
    
    // 是否显示耗时
    showExtractionDuration() {
      return this.extractionDuration > 0 && (this.isExtractingKeywords || this.hasAttemptedExtraction);
    }
  },
  watch: {
    // 监听相关参数变化，实时计算还款计划
    'formData.loanAmount': 'calculateRepaymentSchedule',
    'formData.minInterestRate': 'calculateRepaymentSchedule',
    'formData.maxInterestRate': 'calculateRepaymentSchedule',
    'formData.minLoanTerm': 'calculateRepaymentSchedule',
    'formData.maxLoanTerm': 'calculateRepaymentSchedule',
    'formData.repaymentMethod': 'calculateRepaymentSchedule',
    // 监听按揭贷款相关参数
    'formData.mortgage.fundLoanAmount': 'calculateRepaymentSchedule',
    'formData.mortgage.commercialLoanAmount': 'calculateRepaymentSchedule',
    'formData.mortgage.minFundRate': 'calculateRepaymentSchedule',
    'formData.mortgage.minCommercialRate': 'calculateRepaymentSchedule',
    'formData.mortgage.minMortgageTerm': 'calculateRepaymentSchedule',
    'formData.mortgage.fundRepaymentMethod': 'calculateRepaymentSchedule',
    'formData.mortgage.commercialRepaymentMethod': 'calculateRepaymentSchedule',
    // 监听组合贷款类型切换
    'activeLoanType': 'calculateRepaymentSchedule',
    'formData.phone': {
      immediate: true,
      handler(newValue) {
        if (newValue && !this.displayPhone) {
          this.formatPhoneNumber(newValue);
      }
    }
    },
  },
  methods: {
    // 贷款方式变更处理
    handleLoanTypeChange(value) {
      // 清除相关错误信息
      this.$refs.financeForm.clearValidate([
        'minInterestRate', 'maxInterestRate', 
        'minLoanTerm', 'maxLoanTerm',
        'mortgage.minFundRate', 'mortgage.maxFundRate',
        'mortgage.minCommercialRate', 'mortgage.maxCommercialRate',
        'mortgage.minMortgageTerm', 'mortgage.maxMortgageTerm'
      ]);
      
      // 重置表单
      this.resetRepaymentFields();
      
      // 根据贷款方式设置默认值
      switch(value) {
        case 'mortgage':
          // 按揭贷款初始化
          this.formData.mortgage = {
            mortgageType: '',
            propertyValue: null, // 使用null代替空字符串
            downPaymentRatio: null, // 使用null代替空字符串
            isFirstProperty: true,
            propertyType: 'residential',
            // 公积金贷款字段
            fundLoanAmount: 0,
            minFundRate: 2.85,
            maxFundRate: 3.325,
            fundRepaymentMethod: 'equal_principal_interest',
            // 商业贷款字段
            commercialLoanAmount: 0,
            minCommercialRate: 3.0,
            maxCommercialRate: 3.6,
            commercialRepaymentMethod: 'equal_principal_interest',
            // 贷款期限
            minMortgageTerm: 240,
            maxMortgageTerm: 360
          };
          // 初始化按揭贷款相关字段
          if (!this.formData.mortgage.mortgageType) {
            this.formData.mortgage.mortgageType = '';
          }
          break;
        case 'secured':
          // 抵押贷款初始化
          this.formData.secured = {
            loanPurpose: '',
            collateralType: '',
            collateralValue: null, // 使用null代替空字符串
            mortgageRatio: null, // 使用null代替空字符串
            businessYears: null, // 使用null代替空字符串
            hasBusinessLicense: false,
            businessLicenseMonths: null // 使用null代替空字符串
          };
          
          // 设置抵押贷款默认值
          this.formData.loanAmount = null;
          this.formData.minInterestRate = 3.1;
          this.formData.maxInterestRate = 10.0;
          this.formData.minLoanTerm = 12;
          this.formData.maxLoanTerm = 120;
          this.formData.repaymentMethod = ['equal_principal_interest'];
          
          // 设置还款方式选项
          this.repaymentOptions = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '等额本金', value: 'equal_principal' },
            { label: '先息后本', value: 'interest_first' }
          ];
          break;
        case 'credit':
          // 信用贷款初始化
          this.formData.credit = {
            loanPurpose: '',
            monthlyIncome: '',
            employerType: '',
            workYears: ''
          };
          
          // 设置信用贷款默认值
          this.formData.loanAmount = null;
          this.formData.minInterestRate = 3;
          this.formData.maxInterestRate = 10.0;
          this.formData.minLoanTerm = 3;
          this.formData.maxLoanTerm = 60;
          this.formData.repaymentMethod = ['equal_principal_interest'];
          
          // 设置还款方式选项
          this.repaymentOptions = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '先息后本', value: 'interest_first' },            
            { label: '一次性还本付息', value: 'lump_sum' },
          ];
          break;
      }
    },
    
    // 贷款用途变更处理（用于抵押贷款）
    handleLoanPurposeChange() {
      // 如果不是企业经营用途，清空企业征信报告
      if (this.formData.secured.loanPurpose !== 'business') {
        this.businessCreditFiles = [];
      }
    },
    
    // 文件上传前的验证
    beforeUpload(file) {
      const isPDF = file.type === 'application/pdf';
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isPDF) {
        ElNotification.error('只能上传PDF格式的文件!');
        return false;
      }
      if (!isLt10M) {
        ElNotification.error('文件大小不能超过10MB!');
        return false;
      }
      return true;
    },
    
    // 个人征信报告上传成功处理
    handlePersonalCreditSuccess(response, file, fileList) {
      ElNotification.success('个人征信报告上传成功');
      this.personalCreditFiles = fileList;
    },
    
    // 企业征信报告上传成功处理
    handleBusinessCreditSuccess(response, file, fileList) {
      ElNotification.success('企业征信报告上传成功');
      this.businessCreditFiles = fileList;
    },
    
    // 上传错误处理
    handleUploadError(error) {
      console.error('文件上传错误:', error);
      let errorMessage = '文件上传失败，请重试';
      
      if (error && error.message) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = `上传失败: ${errorData.error}`;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          }
        } catch (e) {
          errorMessage = `上传失败: ${error.message}`;
        }
      }
      
      ElNotification.error(errorMessage);
    },
    
    // 文件数量超出限制处理
    handleExceed() {
      ElNotification.warning('只能上传一个文件，请先删除已上传文件');
    },
    
    // 移除个人征信报告
    handlePersonalCreditRemove() {
      this.personalCreditFiles = [];
    },
    
    // 移除企业征信报告
    handleBusinessCreditRemove() {
      this.businessCreditFiles = [];
    },
    
    // 计算还款计划表
    calculateRepaymentSchedule() {
      if (!this.canCalculateRepayment) {
        return;
      }
      
      const { loanAmount, interestRate, loanTerm, repaymentMethod } = this.calculationParams;
      
      // 防止loanAmount为null的情况
      if (loanAmount === null || loanAmount === undefined) {
        return;
      }
      
      const loanAmountValue = loanAmount * 10000; // 转换为元
      const monthlyInterestRate = interestRate / 100 / 12; // 月利率
      
      let totalRepayment = 0;
      let totalInterest = 0;
      let monthlyPayment = 0;
      let schedule = [];
      
      // 获取当前日期作为首次还款日期的基准
      const today = new Date();
      const firstPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      // 根据不同还款方式计算
      switch (repaymentMethod) {
        case 'equal_principal_interest': // 等额本息
          // 月供 = 本金 × 月利率 × (1+月利率)^还款月数 / [(1+月利率)^还款月数 - 1]
          monthlyPayment = loanAmountValue * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm) / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
          totalRepayment = monthlyPayment * loanTerm;
          totalInterest = totalRepayment - loanAmountValue;
          
          // 生成还款计划表
          let remainingPrincipal1 = loanAmountValue;
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const interest = remainingPrincipal1 * monthlyInterestRate;
            const principal = monthlyPayment - interest;
            remainingPrincipal1 -= principal;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: monthlyPayment.toFixed(2),
              principal: principal.toFixed(2),
              interest: interest.toFixed(2),
              remainingPrincipal: Math.max(0, remainingPrincipal1).toFixed(2)
            });
          }
          break;
          
        case 'equal_principal': // 等额本金
          const monthlyPrincipal = loanAmountValue / loanTerm;
          totalRepayment = 0;
          
          // 生成还款计划表
          let remainingPrincipal2 = loanAmountValue;
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const interest = remainingPrincipal2 * monthlyInterestRate;
            const payment = monthlyPrincipal + interest;
            remainingPrincipal2 -= monthlyPrincipal;
            
            totalRepayment += payment;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: monthlyPrincipal.toFixed(2),
              interest: interest.toFixed(2),
              remainingPrincipal: Math.max(0, remainingPrincipal2).toFixed(2)
            });
          }
          totalInterest = totalRepayment - loanAmount;
          break;
          
        case 'interest_first': // 先息后本
          const monthlyInterest = loanAmountValue * monthlyInterestRate;
          totalInterest = monthlyInterest * loanTerm;
          totalRepayment = loanAmountValue + totalInterest;
          
          // 生成还款计划表
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const principal = i === loanTerm ? loanAmountValue : 0;
            const payment = i === loanTerm ? (loanAmountValue + monthlyInterest) : monthlyInterest;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: principal.toFixed(2),
              interest: monthlyInterest.toFixed(2),
              remainingPrincipal: i === loanTerm ? '0.00' : loanAmountValue.toFixed(2)
            });
          }
          break;
          
        case 'lump_sum': // 一次性还本付息
          const totalInterestAmount = loanAmountValue * monthlyInterestRate * loanTerm;
          totalInterest = totalInterestAmount;
          totalRepayment = loanAmountValue + totalInterest;
          
          // 生成还款计划表
          const paymentDate = new Date(firstPaymentDate);
          paymentDate.setMonth(firstPaymentDate.getMonth() + loanTerm - 1);
          
          schedule.push({
            period: 1,
            paymentDate: paymentDate.toISOString().split('T')[0],
            monthlyPayment: totalRepayment.toFixed(2),
            principal: loanAmountValue.toFixed(2),
            interest: totalInterest.toFixed(2),
            remainingPrincipal: '0.00'
          });
          break;
      }
      
      // 更新计算结果
      this.calculationResult = {
        totalRepayment,
        totalInterest,
        monthlyPayment,
        schedule
      };
    },
    
    // 格式化货币
    formatCurrency(value) {
      const num = parseFloat(value);
      if (isNaN(num)) return '0.00';
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '元';
    },
    
    // 新增：获取AI建议报告前的校验
    async validateBeforeGetReport() {
      // 如果正在提取关键词，直接返回false以阻止表单提交
      if (this.isExtractingKeywords) {
        return false;
      }
      
      // 如果有内容但从未提交过提取
      if (!this.hasAttemptedExtraction && this.formData.additionalNotes && this.formData.additionalNotes.trim().length >= 10) {
        // 自动触发提取
        try {
          // 设置按钮状态为正在提交
          this.submitting = true;
          await this.extractKeywords();
        } catch (error) {
          console.error('提取关键词时出错:', error);
        }
      }

      // 统一处理：无论是自动提取失败还是之前提取失败，都显示相同的提示
      if (this.aiKeywords.length === 0) {
        ElNotification({
          title: '无法获取报告',
          message: '需求描述不是有效的融资需求，请调整后重新提取。',
          type: 'error',
          duration: 5000,
          position: 'top-right',
          showClose: true
        });
        return false;
      }

      return true;
    },

    // 修改：提交表单方法
    async submitFinanceForm() {
      // 避免重复提交
      if (this.submitting || this.isExtractingKeywords) {
        return;
      }
      
      this.submitting = true;
      
      this.$refs.financeForm.validate(async (valid) => {
        if (valid) {
          try {
            // 先验证是否可以获取AI建议报告
            const canGetReport = await this.validateBeforeGetReport();
            if (!canGetReport) {
              this.submitting = false;
              return false;
            }
            
            // 构建提交的数据
            const submitData = {
              ...this.formData,
              aiKeywords: this.aiKeywords,
              // 征信报告信息
              hasCreditReport: this.personalCreditFiles?.length > 0 || this.businessCreditFiles?.length > 0,
              creditReport: this.personalCreditFiles?.length > 0 ? this.personalCreditFiles[0] : 
                           (this.businessCreditFiles?.length > 0 ? this.businessCreditFiles[0] : null)
            };
            
            // 触发提交事件
            this.$emit('submit', submitData);
          } catch (error) {
            console.error('提交表单时出错:', error);
            ElMessage.error('提交失败，请重试');
          } finally {
            this.submitting = false;
          }
        } else {
          ElMessage.error('请完善表单信息');
          this.submitting = false;
          return false;
        }
      });
    },
    
    // 重置表单
    resetForm() {
      this.$refs.financeForm.resetFields();
      this.personalCreditFiles = [];
      this.businessCreditFiles = [];
      this.resetRepaymentFields();
      this.resetKeywordsState(); // 确保重置关键词提取状态
    },
    
    handleInputFocus(event) {
      if (event && event.target) {
        setTimeout(() => {
          // 检查元素是否支持select方法
          if (event.target.select && typeof event.target.select === 'function') {
            event.target.select();
          }
        }, 0);
      }
    },

    // 计算贷款金额
    calculateLoanAmount() {
      if (this.formData.mortgage.propertyValue && this.formData.mortgage.downPaymentRatio) {
        const totalLoanAmount = this.formData.mortgage.propertyValue * (1 - this.formData.mortgage.downPaymentRatio / 100);
        this.formData.loanAmount = parseFloat(totalLoanAmount.toFixed(2));
      }
    },

    // 计算组合贷款总额
    calculateTotalLoanAmount() {
      if (this.formData.mortgage.mortgageType === 'mixed') {
        const fundAmount = this.formData.mortgage.fundLoanAmount || 0;
        const commercialAmount = this.formData.mortgage.commercialLoanAmount || 0;
        this.formData.loanAmount = parseFloat((fundAmount + commercialAmount).toFixed(2));
      }
    },

    // 处理按揭贷款方式变更
    handleMortgageTypeChange(value) {
      // 清除相关错误信息
      this.$refs.financeForm.clearValidate([
        'mortgage.minFundRate', 'mortgage.maxFundRate',
        'mortgage.minCommercialRate', 'mortgage.maxCommercialRate'
      ]);
      
      // 确保房产总价显示为空
      this.formData.mortgage.propertyValue = null;
      this.formData.mortgage.downPaymentRatio = null;

      // 根据贷款方式设置默认值
      switch(value) {
        case 'fund':
          // 设置公积金贷款的默认值
          this.formData.mortgage.fundLoanAmount = '';
          this.formData.mortgage.minFundRate = 2.85;
          this.formData.mortgage.maxFundRate = 3.325;
          this.formData.mortgage.fundRepaymentMethod = 'equal_principal_interest';
          this.formData.mortgage.minMortgageTerm = 240; // 20年
          this.formData.mortgage.maxMortgageTerm = 360; // 30年
          break;
        case 'commercial':
          // 设置商业贷款的默认值
          this.formData.mortgage.commercialLoanAmount = '';
          this.formData.mortgage.minCommercialRate = 3.0;
          this.formData.mortgage.maxCommercialRate = 3.6;
          this.formData.mortgage.commercialRepaymentMethod = 'equal_principal_interest';
          this.formData.mortgage.minMortgageTerm = 240; // 20年
          this.formData.mortgage.maxMortgageTerm = 360; // 30年
          break;
        case 'mixed':
          // 混合贷款默认值
          this.formData.mortgage.fundLoanAmount = '';
          this.formData.mortgage.commercialLoanAmount = '';
          this.formData.mortgage.minFundRate = 2.85;
          this.formData.mortgage.maxFundRate = 3.325;
          this.formData.mortgage.minCommercialRate = 3.0;
          this.formData.mortgage.maxCommercialRate = 3.6;
          this.formData.mortgage.fundRepaymentMethod = 'equal_principal_interest';
          this.formData.mortgage.commercialRepaymentMethod = 'equal_principal_interest';
          this.formData.mortgage.minMortgageTerm = 240; // 20年
          this.formData.mortgage.maxMortgageTerm = 360; // 30年
          // 默认显示公积金贷款
          this.activeLoanType = 'fund';
          break;
      }
      
      // 触发还款计划计算
      this.$nextTick(() => {
        this.calculateRepaymentSchedule();
      });
    },

    // 格式化手机号码
    formatPhoneNumber(value) {
      // 移除所有非数字字符
      const phoneNumber = value.replace(/\D/g, '');
      
      // 限制长度为11位
      const truncated = phoneNumber.substring(0, 11);
      
      // 更新原始手机号数据
      this.formData.phone = truncated;
      
      // 格式化为3-4-4格式
      if (truncated.length <= 3) {
        this.displayPhone = truncated;
      } else if (truncated.length <= 7) {
        this.displayPhone = truncated.substring(0, 3) + ' ' + truncated.substring(3);
      } else {
        this.displayPhone = truncated.substring(0, 3) + ' ' + 
                           truncated.substring(3, 7) + ' ' + 
                           truncated.substring(7);
      }
    },

    // 重置还款相关字段
    resetRepaymentFields() {
      // 重置通用字段
      this.formData.loanAmount = null;
      this.formData.minInterestRate = 0;
      this.formData.maxInterestRate = 0;
      this.formData.minLoanTerm = 0;
      this.formData.maxLoanTerm = 0;
      this.formData.repaymentMethod = [];
      
      // 重置计算结果
      this.calculationResult = {
        totalRepayment: 0,
        totalInterest: 0,
        monthlyPayment: 0,
        schedule: []
      };
    },

    // 处理需求描述输入失焦
    handleDescriptionBlur() {
      // 仅更新高度，不再自动提取关键词
      this.updateKeywordsSectionHeight();
      
      // 当输入内容为空时，重置状态
      if (!this.formData.additionalNotes || this.formData.additionalNotes.trim() === '') {
        this.extractError = '';
        this.aiKeywords = [];
        return;
      }
      
      // 检查文字长度是否少于10个字
      const trimmedText = this.formData.additionalNotes.trim();
      if (trimmedText.length < 10 && !this.aiKeywords.length) {
        this.extractError = '需求描述的文字不应该少于10个字';
      }
    },
    
    // 处理需求描述输入
    handleDescriptionInput() {
      // 限制不更新关键词，只处理输入框高度
      this.updateKeywordsSectionHeight();
      
      // 当输入内容为空时，重置所有状态
      if (!this.formData.additionalNotes || this.formData.additionalNotes.trim() === '') {
        this.resetKeywordsState();
        return;
      }
      
      // 检查文字长度是否少于10个字，并更新提示
      const trimmedText = this.formData.additionalNotes.trim();
      if (trimmedText.length < 10) {
        if (!this.aiKeywords.length) {
          this.extractError = '需求描述的文字不应该少于10个字';
        }
      } else if (this.extractError === '需求描述的文字不应该少于10个字') {
        // 如果已经有10个字以上，且之前显示的是字数不足的错误，则清除错误
        this.extractError = '';
      }
      
      // 如果之前尝试过提取，且当前内容与上次提取的内容不同，重置提取状态
      if (this.hasAttemptedExtraction && trimmedText !== this.lastExtractedText) {
        this.resetKeywordsState();
      }
      
      // 更新字数统计位置
      this.$nextTick(() => {
        if (this.$refs.descriptionTextarea && this.$refs.descriptionTextarea.$el) {
          updateWordCountPosition(this.$refs.descriptionTextarea.$el);
        }
      });
    },

    // 新增：重置关键词提取的所有状态
    resetKeywordsState() {
      this.aiKeywords = [];
      
      // 检查文字长度，如果少于10个字则显示提示
      if (this.formData.additionalNotes && this.formData.additionalNotes.trim()) {
        const trimmedText = this.formData.additionalNotes.trim();
        if (trimmedText.length < 10) {
          this.extractError = '需求描述的文字不应该少于10个字';
        } else {
          this.extractError = '';
        }
      } else {
        this.extractError = '';
      }
      
      this.hasAttemptedExtraction = false;
      this.isExtractingKeywords = false;
      this.lastExtractedText = '';
      this.resetExtractionTimer(); // 重置计时器
      
      // 递增任务ID使得之前的任务结果被忽略
      this.extractionTaskId++;
    },

    // 开始计时
    startExtractionTimer() {
      // 重置计时器状态
      this.resetExtractionTimer();
      
      // 设置开始时间和初始化持续时间
      this.extractionStartTime = Date.now();
      this.extractionDuration = 0;
      
      // 创建新的计时器
      this.extractionTimerInterval = setInterval(() => {
        if (this.extractionStartTime > 0) {
          this.extractionDuration = Math.round((Date.now() - this.extractionStartTime) / 1000);
        }
      }, 1000);
    },

    // 停止计时
    stopExtractionTimer() {
      if (this.extractionTimerInterval) {
        clearInterval(this.extractionTimerInterval);
        this.extractionTimerInterval = null;
      }
      
      // 确保最后更新一次持续时间
      if (this.extractionStartTime > 0) {
        this.extractionDuration = Math.round((Date.now() - this.extractionStartTime) / 1000);
      }
    },

    // 重置计时器
    resetExtractionTimer() {
      if (this.extractionTimerInterval) {
        clearInterval(this.extractionTimerInterval);
        this.extractionTimerInterval = null;
      }
      this.extractionDuration = 0;
      this.extractionStartTime = 0;
    },

    // 修改：提取关键词方法
    async extractKeywords() {
      if (!this.formData.additionalNotes || this.formData.additionalNotes.trim() === '') {
        this.extractError = '请输入贷款需求描述再提取关键词';
        return;
      }

      // 检查文字长度是否少于10个字
      const trimmedText = this.formData.additionalNotes.trim();
      if (trimmedText.length < 10) {
        this.extractError = '需求描述的文字不应该少于10个字';
        return;
      }

      if (this.isExtractingKeywords) {
        return;
      }

      // 重置状态
      this.aiKeywords = [];
      this.extractError = '';
      this.isExtractingKeywords = true;
      
      // 生成本次任务ID
      const currentTaskId = ++this.extractionTaskId;
      
      // 确保在开始提取前启动计时器
      this.startExtractionTimer();

      try {
        const userDescription = trimmedText;
        this.lastExtractedText = userDescription;
        
        const messages = [
          {
            role: 'user',
            content: userDescription
          }
        ];
        
        const response = await sendMessage(messages, 'loan-keywords');
        
        // 检查任务是否已被新任务取代
        if (currentTaskId !== this.extractionTaskId) {
          console.log('任务已过期，丢弃结果');
          return;
        }
        
        this.hasAttemptedExtraction = true;
        
        if (response.error) {
          console.error('API返回错误:', response.error);
          this.extractError = response.message || '关键词提取失败';
          return;
        }

        try {
          const responseText = response.content;
          
          if (!responseText || responseText.trim() === '') {
            this.extractError = 'AI返回了空响应，请重试';
            return;
          }
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          
          if (!jsonMatch) {
            console.warn('无法从AI响应中提取JSON:', responseText);
            this.extractError = '无法解析AI提取的关键词，请修改描述后重试';
            return;
          }

          let jsonData = JSON.parse(jsonMatch[0]);
          
          if (jsonData.keywords === undefined) {
            console.warn('AI返回的JSON中没有keywords字段:', jsonData);
            this.extractError = '需求描述不是有效的融资需求，请调整后重新提取。';
            return;
          }

          let keywords = Array.isArray(jsonData.keywords) 
            ? jsonData.keywords 
            : jsonData.keywords.split(/\s+/).filter(k => k);
          
          if (keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) {
            this.extractError = '需求描述不是有效的融资需求，请调整后重新提取。';
            return;
          }
          
          const colors = ['black'];
          
          this.aiKeywords = keywords.map((keyword, index) => ({
            key: `keyword_${index}`,
            value: keyword,
            type: colors[index % colors.length]
          }));
          
        } catch (error) {
          console.error('处理AI响应时出错:', error);
          this.extractError = '处理AI响应时出错，请重试';
        }
      } catch (error) {
        // 检查任务是否已被新任务取代
        if (currentTaskId !== this.extractionTaskId) {
          return;
        }
        
        console.error('提取关键词失败:', error);
        this.extractError = '提取关键词失败: ' + (error.message || '未知错误');
      } finally {
        // 检查任务是否已被新任务取代
        if (currentTaskId !== this.extractionTaskId) {
          return;
        }
        
        // 确保在所有处理完成后停止计时器
        this.isExtractingKeywords = false;
        this.stopExtractionTimer();
        
        // 重置提交按钮状态
        this.submitting = false;
      }
    },

    // 处理范围值输入
    handleRangeInput(field) {
      try {
        // 延迟验证，避免在输入过程中频繁触发
        this.$nextTick(() => {
          try {
            if (this.$refs.financeForm) {
              // 根据字段名确定需要同时校验的字段
              let fieldsToValidate = [];
              let relatedField = '';
              
              // 处理通用贷款字段
              if (field === 'minInterestRate' || field === 'maxInterestRate') {
                fieldsToValidate = ['minInterestRate', 'maxInterestRate'];
                relatedField = field === 'minInterestRate' ? 'maxInterestRate' : 'minInterestRate';
              } else if (field === 'minLoanTerm' || field === 'maxLoanTerm') {
                fieldsToValidate = ['minLoanTerm', 'maxLoanTerm'];
                relatedField = field === 'minLoanTerm' ? 'maxLoanTerm' : 'minLoanTerm';
              }
              // 处理按揭贷款字段
              else if (field === 'mortgage.minFundRate' || field === 'mortgage.maxFundRate') {
                fieldsToValidate = ['mortgage.minFundRate', 'mortgage.maxFundRate'];
                relatedField = field === 'mortgage.minFundRate' ? 'mortgage.maxFundRate' : 'mortgage.minFundRate';
              } else if (field === 'mortgage.minCommercialRate' || field === 'mortgage.maxCommercialRate') {
                fieldsToValidate = ['mortgage.minCommercialRate', 'mortgage.maxCommercialRate'];
                relatedField = field === 'mortgage.minCommercialRate' ? 'mortgage.maxCommercialRate' : 'mortgage.minCommercialRate';
              } else if (field === 'mortgage.minMortgageTerm' || field === 'mortgage.maxMortgageTerm') {
                fieldsToValidate = ['mortgage.minMortgageTerm', 'mortgage.maxMortgageTerm'];
                relatedField = field === 'mortgage.minMortgageTerm' ? 'mortgage.maxMortgageTerm' : 'mortgage.minMortgageTerm';
              }
              
              // 先清除相关字段的校验结果
              this.$refs.financeForm.clearValidate(fieldsToValidate);
              
              // 同时校验所有相关字段
              this.$refs.financeForm.validateField(fieldsToValidate, (valid) => {
                if (valid) {
                  // 如果当前字段验证通过，确保关联字段的错误也被清除
                  this.$refs.financeForm.clearValidate([relatedField]);
                }
              });
            }
          } catch (error) {
            console.warn('验证执行过程中出错:', error);
          }
        });
      } catch (error) {
        console.error('验证字段时出错:', error);
      }
    },

    updateKeywordsSectionHeight() {
      this.$nextTick(() => {
        const keywordsSection = document.querySelector('.description-content .keywords-section');
        const textarea = document.querySelector('.description-content .description-input .el-textarea__inner');
        const textareaWrapper = document.querySelector('.description-content .description-input .el-textarea__wrapper');
        
        if (!keywordsSection || !textarea || !textareaWrapper) return;

        // 先重置高度，确保正确测量
        this.keywordsSectionStyle.height = 'auto';
        
        // 获取关键词区域的实际高度
        const keywordsHeight = Math.max(keywordsSection.scrollHeight, 164);
        
        // 设置关键词区域和文本区域的最终高度
        this.keywordsSectionStyle.height = `${keywordsHeight}px`;
        
        // 设置文本区域的高度
        textarea.style.height = `${keywordsHeight - 2}px`; // 减去边框宽度
        textareaWrapper.style.height = `${keywordsHeight - 2}px`; // 减去边框宽度
      });
    },
    
    setupTextareaObserver() {
      // 创建关键词区域内容变化的监听器
      this.keywordsObserver = new MutationObserver(() => {
        this.updateKeywordsSectionHeight();
      });
      
      this.$nextTick(() => {
        // 监视关键词区域的内容变化
        const keywordsContent = document.querySelector('.description-content .keywords-section .keywords-content');
        if (keywordsContent) {
          this.keywordsObserver.observe(keywordsContent, {
            childList: true,  // 监听子节点的添加或移除
            subtree: true,    // 监听所有后代节点
            characterData: true // 监听文本内容变化
          });
        }
        
        // 初始化时调用一次
        this.updateKeywordsSectionHeight();
      });
      
      // 仍然保留文本区域的ResizeObserver，但只用于在文本区域大小变化时更新UI
      this.resizeObserver = new ResizeObserver(() => {
        this.updateKeywordsSectionHeight();
      });
      
      this.$nextTick(() => {
        const textareaWrapper = this.$refs.descriptionTextarea?.$el;
        if (textareaWrapper) {
          this.resizeObserver.observe(textareaWrapper);
        }
      });
    },
    beforeUploadDisabled() {
      ElNotification.warning('该功能暂未支持，正在努力开发中...');
      return false;
    },
    
    // 注册快捷键
    registerKeyboardShortcuts() {
      window.addEventListener('keydown', this.handleKeydown);
    },
    
    // 处理键盘事件
    handleKeydown(event) {
      // Shift+Enter 触发提取关键词
      if (event.key === 'Enter' && event.shiftKey && !event.ctrlKey && !event.altKey) {
        // 检查是否可以提取：有内容、字数足够且未在提取中
        const additionalNotes = this.formData.additionalNotes;
        const hasEnoughChars = additionalNotes && additionalNotes.trim().length >= 10;
        const canExtract = additionalNotes && hasEnoughChars && !this.isExtractingKeywords;
        
        if (canExtract) {
          event.preventDefault();
          this.extractKeywords();
        } else if (additionalNotes && !hasEnoughChars) {
          // 如果内容不足10个字，显示错误提示
          event.preventDefault();
          this.extractError = '需求描述的文字不应该少于10个字';
        }
      }
    },
  },
  mounted() {
    // 初始化时尝试计算还款计划
    this.calculateRepaymentSchedule();
    
    // 保存原始的ResizeObserver
    window._originalResizeObserver = window.ResizeObserver;
    
    // 创建一个安全的ResizeObserver包装器
    class SafeResizeObserver extends window._originalResizeObserver {
      constructor(callback) {
        const safeCallback = (entries, observer) => {
          // 防止在不可见或未连接的元素上执行回调
          if (!entries || !entries.length) return;
          
          // 使用debounce技术减少回调频率
          cancelAnimationFrame(this._rafId);
          
          this._rafId = requestAnimationFrame(() => {
            // 检查目标元素是否仍在文档中
            if (entries.some(entry => document.contains(entry.target))) {
              try {
                callback(entries, observer);
              } catch (e) {
                console.warn('ResizeObserver callback错误:', e);
              }
            }
          });
        };
        
        super(safeCallback);
        this._rafId = 0;
      }
      
      // 确保在disconnect时清理RAF
      disconnect() {
        if (this._rafId) {
          cancelAnimationFrame(this._rafId);
          this._rafId = 0;
        }
        super.disconnect();
      }
    }
    
    // 替换全局ResizeObserver
    window.ResizeObserver = SafeResizeObserver;
    
    // 添加全局错误处理，忽略 ResizeObserver 错误
    const errorHandler = (event) => {
      if (event && event.message && (
        event.message.includes('ResizeObserver') || 
        event.message.includes('ResizeObserver loop')
      )) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
      
      // 捕获和处理Object对象作为错误的情况
      if (event && event.error && typeof event.error === 'object' && !(event.error instanceof Error)) {
        console.warn('捕获到对象类型错误:', event.error);
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('error', errorHandler, true);
    this._errorHandler = errorHandler;
    
    // 添加未处理的promise rejection处理
    const rejectionHandler = (event) => {
      if (event && event.reason && event.reason.message && 
          event.reason.message.includes('ResizeObserver')) {
        event.preventDefault();
        return false;
      }
      
      // 捕获和处理Object对象作为rejection的情况
      if (event && event.reason && typeof event.reason === 'object' && !(event.reason instanceof Error)) {
        console.warn('捕获到对象类型Promise拒绝:', event.reason);
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('unhandledrejection', rejectionHandler, true);
    this._rejectionHandler = rejectionHandler; // 保存引用以便清理
    this.setupTextareaObserver();
    // 监听窗口大小变化
    window.addEventListener('resize', this.setupTextareaObserver);
    
    // 注册快捷键
    this.registerKeyboardShortcuts();
    
    // 初始化时手动触发一次字数统计位置更新
    this.$nextTick(() => {
      if (this.$refs.descriptionTextarea && this.$refs.descriptionTextarea.$el) {
        updateWordCountPosition(this.$refs.descriptionTextarea.$el);
      }
    });
  },
  beforeUnmount() {
    // 确保清理所有计时器
    this.resetExtractionTimer();
    
    // 清理其他资源
    if (this._errorHandler) {
      window.removeEventListener('error', this._errorHandler, true);
    }
    
    if (this._rejectionHandler) {
      window.removeEventListener('unhandledrejection', this._rejectionHandler, true);
    }
    
    // 移除事件监听
    window.removeEventListener('resize', this.setupTextareaObserver);
    
    // 断开ResizeObserver连接
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 断开MutationObserver连接
    if (this.keywordsObserver) {
      this.keywordsObserver.disconnect();
    }
    
    // 移除快捷键监听
    window.removeEventListener('keydown', this.handleKeydown);
  }
}
</script>

<style lang="scss" scoped>

.finance-advice-container {
  display: flex;
  height: 100%; /* 使用百分比高度填充父容器 */
  padding: 20px;
  gap: 20px;
  overflow: hidden; /* 确保不会有外层滚动条 */
  box-sizing: border-box; /* 确保padding和border包含在高度内 */
}

.left-panel {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.right-top-panel {
  flex: 0 0 auto; /* 不伸缩，保持固定高度 */
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.right-bottom-panel {
  flex: 1; /* 占用剩余所有空间 */
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.right-bottom-panel .panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 使整个内容区可滚动 */
  padding: 0; /* 移除内边距，让表格与顶部无间距 */
}

.panel-header {
  padding: 0;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  height: 60px; /* 固定标题栏高度 */
  box-sizing: border-box;
  position: relative; /* 为loan-type-switch提供相对定位参考 */
  display: flex;
  align-items: center;
}

.panel-title {
  padding: 0;
  padding-left: 20px;
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  line-height: 60px; /* 确保垂直居中 */
}

.header-content {
  height: 100%;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto; /* 确保只在y轴方向滚动 */
  height: calc(100% - 60px); /* 确保内容区域正确计算高度 */
  box-sizing: border-box;
}

/* 征信报告区域的内容样式特殊处理 */
.right-top-panel .panel-content {
  padding: 15px 15px 5px 15px; /* 减小底部内边距 */
  overflow: hidden; /* 防止滚动 */
  height: auto;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 20px;
  line-height: 1.5;
  height: 100%;
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

.range-item :deep(.el-input-number) {
  width: 100%;
}

.range-separator {
  margin: 0 10px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

/* 征信报告上传样式 */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-bottom: 20px; /* 移除底部间距 */
}

.upload-row {
  display: flex;
  gap: 20px;
}

.upload-item {
  flex: 1;
  border-radius: 8px;
  background-color: #f8f9fa;
  padding: 15px; /* 减小内边距 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.upload-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 减小标题和内容的间距 */
  font-size: 16px;
  font-weight: 500;
  color: #000000;
}

.upload-title .el-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #000000;
}

.upload-optional {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.upload-area {
  padding: 5px 0; /* 减小上下内边距 */
  position: relative;
}

.upload-disabled-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 6px;
}

.upload-disabled-content {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #00000000;
  padding: 10px 20px;
  border-radius: 4px;
  // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.upload-disabled-content .el-icon {
  font-size: 18px;
  color: #e6a23c;
}

.upload-disabled-content span {
  color: #606266;
  font-size: 14px;
}

:deep(.el-upload-dragger.is-disabled) {
  cursor: not-allowed;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

:deep(.el-upload-dragger.is-disabled .el-icon) {
  color: #c0c4cc;
}

:deep(.el-upload-dragger.is-disabled .el-upload__text) {
  color: #c0c4cc;
}

:deep(.el-upload-dragger.is-disabled .el-upload__text em) {
  color: #c0c4cc;
}

.upload-container {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  padding: 15px; /* 减小内边距 */
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fff;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #1b68de;
}

:deep(.el-upload-dragger .el-icon) {
  font-size: 30px; /* 减小图标大小 */
  color: #1b68de;
  margin-bottom: 8px; /* 减小下边距 */
}

:deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
  text-align: center;
}

:deep(.el-upload__text em) {
  color: #1b68de;
  font-style: normal;
  font-weight: 500;
}

:deep(.el-upload__tip) {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

/* 还款计划表试算样式 */
.repayment-calculator {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 减小空间间距 */
  min-width: 620px; /* 确保表格有足够宽度不换行 */
  padding: 20px; /* 将padding从panel-content移到calculator上 */
  padding-top: 15px; /* 减少顶部间距 */
}

.calculation-params {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  text-align: center;
}

.param-item {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
}

.param-label {
  font-weight: 500;
  margin-right: 8px;
  color: #606266;
}

.param-value {
  color: #1b68de;
  font-weight: 500;
}

.repayment-overview {
  display: flex;
  justify-content: space-around;
  background-color: #f0f7ff;
  border-radius: 4px;
  padding: 15px 10px;
}

.overview-item {
  text-align: center;
}

.overview-value {
  font-size: 20px;
  font-weight: bold;
  color: #1b68de;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.calculation-tips {
  text-align: center;
  line-height: 1.8;
  color: #909399;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  max-width: 450px;
  margin: 0 auto;
}

.calculation-tips .el-icon {
  font-size: 18px;
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .finance-advice-container {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel, .right-panel {
    width: 100%;
  }
  
  .right-panel {
    margin-top: 20px;
  }
  
  .calculation-params {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .repayment-overview {
    flex-direction: column;
    gap: 15px;
  }
  
  .upload-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-item {
    width: 100%;
  }
}

// /* 全局样式覆盖 */
// /* 全局覆盖Element Plus主题色 */
// :deep(:root) {
//   --el-color-primary: #1b68de !important;
//   --el-color-primary-light-3: #4785e5 !important;
//   --el-color-primary-light-5: #7da8eb !important;
//   --el-color-primary-light-7: #b3cbf2 !important;
//   --el-color-primary-light-8: #cbdbf6 !important;
//   --el-color-primary-light-9: #e5edfa !important;
//   --el-color-primary-dark-2: #1857be !important;
// }

// :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
//   background-color: #1b68de;
//   border-color: #1b68de;
// }

// :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
//   border-color: #1b68de;
// }

// :deep(.el-radio__input.is-checked .el-radio__inner) {
//   background-color: #1b68de;
//   border-color: #1b68de;
// }

// :deep(.el-radio__input.is-focus .el-radio__inner) {
//   border-color: #1b68de;
// }

// :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
//   background-color: #1b68de;
//   border-color: #1b68de;
// }

// :deep(.el-radio.is-bordered.is-checked) {
//   border-color: #1b68de;
// }

// :deep(.el-checkbox.is-bordered.is-checked) {
//   border-color: #1b68de;
// }

// :deep(.el-radio__label),
// :deep(.el-checkbox__label) {
//   color: #606266;
// }

// :deep(.el-radio__input.is-checked + .el-radio__label),
// :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
//   color: #1b68de;
// }

// /* 扩展更多Element Plus组件的颜色覆盖 */
// :deep(.el-button--primary) {
//   background-color: #1b68de;
//   border-color: #1b68de;
// }

// :deep(.el-button--primary:hover),
// :deep(.el-button--primary:focus) {
//   background-color: #4785e5;
//   border-color: #4785e5;
// }

// :deep(.el-button--primary:active) {
//   background-color: #1857be;
//   border-color: #1857be;
// }

// :deep(.el-button--text) {
//   color: #1b68de;
// }

// :deep(.el-button--text:hover),
// :deep(.el-button--text:focus) {
//   color: #4785e5;
// }

// :deep(.el-select:hover .el-input__inner) {
//   border-color: #1b68de;
// }

// :deep(.el-select .el-input.is-focus .el-input__inner) {
//   border-color: #1b68de;
// }

// :deep(.el-select-dropdown__item.selected) {
//   color: #1b68de;
// }

// :deep(.el-input__inner:focus) {
//   border-color: #1b68de;
// }

// :deep(.el-input.is-active .el-input__inner) {
//   border-color: #1b68de;
// }

// :deep(.el-input-number__increase:hover),
// :deep(.el-input-number__decrease:hover) {
//   color: #1b68de;
// }

// :deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
//   background-color: #1b68de;
// }

// :deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
//   color: #1b68de;
// }

// :deep(.el-tabs__active-bar) {
//   background-color: #1b68de;
// }

// :deep(.el-tabs__item.is-active) {
//   color: #1b68de;
// }

// :deep(.el-tabs__item:hover) {
//   color: #1b68de;
// }

// :deep(.el-tag--primary) {
//   background-color: rgba(27, 104, 222, 0.1);
//   border-color: rgba(27, 104, 222, 0.2);
//   color: #1b68de;
// }

// :deep(.el-switch.is-checked .el-switch__core) {
//   border-color: #1b68de;
//   background-color: #1b68de;
// }

// :deep(.el-slider__bar) {
//   background-color: #1b68de;
// }

// :deep(.el-slider__button) {
//   border-color: #1b68de;
// }

// :deep(.el-table th.el-table__cell > .cell.highlight) {
//   color: #1b68de;
// }

// :deep(.el-table__fixed-right::before),
// :deep(.el-table__fixed::before) {
//   background-color: #1b68de;
// }

// :deep(.el-loading-spinner .path) {
//   stroke: #1b68de;
// }

// :deep(.el-message-box__headerbtn:focus .el-message-box__close),
// :deep(.el-message-box__headerbtn:hover .el-message-box__close) {
//   color: #1b68de;
// }

// :deep(.el-message--success .el-message__icon),
// :deep(.el-message--success) {
//   color: #1b68de;
// }

// /* 上传进度条和下拉框颜色 */
// :deep(.el-progress-bar__inner) {
//   background-color: #1b68de !important;
// }

// :deep(.el-select .el-input.is-focus .el-input__wrapper) {
//   box-shadow: 0 0 0 1px #1b68de inset !important;
// }

// :deep(.el-select-dropdown__item.selected) {
//   color: #1b68de !important;
//   font-weight: bold;
// }

// :deep(.el-select .el-input__wrapper.is-focus) {
//   box-shadow: 0 0 0 1px #1b68de inset !important;
// }

// :deep(.el-input__wrapper.is-focus) {
//   box-shadow: 0 0 0 1px #1b68de inset !important;
// }

// :deep(.el-input-number.is-controls-right .el-input__wrapper) {
//   box-shadow: 0 0 0 1px #dcdfe6 inset;
// }

// :deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus) {
//   box-shadow: 0 0 0 1px #1b68de inset !important;
// }

// :deep(.el-upload-list__item.is-success .el-upload-list__item-name) {
//   color: #1b68de;
// }

// :deep(.el-upload-list__item .el-icon--close) {
//   color: #606266;
// }

// :deep(.el-upload-list__item .el-icon--close:hover) {
//   color: #1b68de;
// }

// :deep(.el-upload-list__item-delete:hover) {
//   color: #1b68de;
// }

/* 表单布局 */
.form-row {
  display: flex;
  gap: 40px;
  margin-bottom: 15px;
}

.form-item {
  flex: 1;
  min-width: 0;
}

.form-item-full {
  flex: 1 0 100%;
}

/* 贷款方式radio按钮组的样式 */
.loan-type-group {
  display: flex;
  gap: 20px;
}

.loan-type-group .el-radio {
  margin-right: 0;
  padding: 0px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.loan-type-group .el-radio.is-checked {
  background-color: #f0f5ff;
  border-color: #1b68de;
}

/* 媒体查询中添加针对小屏幕的样式调整 */
@media (max-width: 768px) {
  .loan-type-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .loan-type-group .el-radio {
    width: 100%;
  }
}

/* 在 style 部分添加以下样式 */
:deep(.bold-number .el-input__inner) {
  font-weight: bold;
  color: #000000;
  font-size: 14px;
}

:deep(.bold-number.el-input-number .el-input__inner) {
  font-weight: bold;
  color: #000000;
  font-size: 14px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.range-item .el-input-number) {
  width: 100%;
}

/* 折叠面板样式 */
.collapse-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #303133;
  
  .collapse-subtitle {
    margin-left: 8px;
    font-size: 14px;
    color: #c2c2c2;
  }
}

:deep(.el-collapse) {
  border: none;
  
  .el-collapse-item {
    margin-top: 30px; //更多选填信息与需求描述之间的距离
    margin-bottom: 50px;
    .el-collapse-item__header {
      background-color:rgb(255, 255, 255);
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      padding: 12px 20px;
      font-weight: 400;
      
      &:hover {
        background-color: rgb(250, 250, 250);
      }
      
      &.is-active {
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
      }

      .el-collapse-item__arrow {
        transform: rotate(90deg);
        
        &.is-active {
          transform: rotate(-90deg);
        }
      }
    }
    
    .el-collapse-item__wrap {
      border: 1px solid #e4e7ed;
      border-top: none;
      border-bottom-right-radius: 4px;
      border-bottom-left-radius: 4px;
      
      .el-collapse-item__content {
        padding: 20px;
      }
    }
  }
}

/* 组合贷款情况下的切换按钮 */
.loan-type-switch {
  position: absolute;
  left: 160px; /* 定位在标题右侧 */
  top: 50%;
  transform: translateY(-50%);
}

.custom-radio-group {
  display: flex;
  gap: 0;
}

.custom-radio-button {
  padding: 5px 10px;
  font-size: 12px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  color: #606266;
  height: 28px;  /* 限制高度 */
  line-height: 18px;  /* 垂直居中 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-left: none;
  }

  &.active {
  background-color: #1b68de;
  border-color: #1b68de;
    color: white;
  }
}

.repayment-schedule {
  width: 100%;
  position: relative;
  overflow: visible; /* 移除滚动效果 */
  margin-top: -1px; /* 添加-1px的负外边距，消除表头与功能区顶部的边框缝隙 */
}

/* 固定表头样式 */
:deep(.sticky-table-header) {
  position: sticky !important;
  top: 0 !important;
  z-index: 999 !important;
  background-color: #f5f7fa !important;
}

:deep(.el-table--border) {
  width: 100% !important;
}

:deep(.el-table__header-wrapper) {
  position: sticky !important;
  top: 0 !important;
  z-index: 999 !important;
}

:deep(.el-table__header) {
  border-collapse: separate !important;
}

/* 恢复Radio Button样式 */
.loan-type-switch .el-radio-group {
  display: inline-block;
}

:deep(.el-radio-button__inner) {
  color: #606266;
  border-color: #dcdfe6;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: #1b68de !important;
  border-color: #1b68de !important;
  box-shadow: -1px 0 0 0 #1b68de !important;
  color: #ffffff !important;
}

/* 强化表头吸顶效果 */
:deep(.sticky-table-header) {
  position: sticky !important;
  top: 0 !important;
  z-index: 999 !important;
  background-color: #f5f7fa !important;
}

/* 自定义表格样式 - 增强 */
.custom-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 固定表格布局 */
  margin-top: 0; /* 确保表格没有顶部边距 */
}

.custom-table th,
.custom-table td {
  padding: 12px 10px;
  border: 1px solid #ebeef5;
  text-align: left;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}

.custom-table th {
  background-color: #f5f7fa;
  font-weight: 500;
  color: #606266;
  position: sticky;
  top: -1px; /* 关键修复：确保与panel-header完全贴合 */
  z-index: 10;
  border-top: 1px solid #EBEEF5; /* 关键修复：添加顶部边框 */
}

.custom-table tbody tr:nth-child(even) {
  background-color: #FAFAFA;
}

.custom-table .center {
  text-align: center;
}

/* 调整表格在panel-content中的吸顶位置，修复间距问题 */
.right-bottom-panel .panel-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 使整个内容区可滚动 */
  max-height: none; /* 移除最大高度限制 */
}

.repayment-calculator {
  padding-top: 20px;
  background-color: #fff; /* 关键修复：确保背景色一致 */
}

/* AI关键词提取区域样式 */
.keywords-section {
  // margin-top: -10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.keywords-header {
  display: flex;
  justify-content: space-between; /* 关键属性：使用space-between让两端对齐 */
  align-items: center;
  margin-bottom: 12px;
}

.keywords-left {
  display: flex;
  align-items: center;
  gap: 16px; /* 标题和按钮之间的间距 */
}

.keywords-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap; /* 防止标题换行 */

  .el-icon {
  color: #1b68de;
    font-size: 16px;
  }
  
  .extraction-duration {
    color: var(--el-color-info);
    font-weight: normal;
  }
}

/* 提取按钮样式 */
.extract-button {
  height: 25px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  
  &.el-button--primary {
    --el-button-bg-color: var(--primary-color);
    --el-button-border-color: var(--primary-color);
    --el-button-hover-bg-color: #4285f4;
    --el-button-hover-border-color: #4285f4;
    color: white;
  }
  
  &.el-button--default {
    --el-button-bg-color: white;
    --el-button-text-color: var(--primary-color);
    --el-button-border-color: var(--primary-color);
    --el-button-hover-text-color: #4285f4;
    --el-button-hover-border-color: #4285f4;
    --el-button-hover-bg-color: #f5f7fa;
    background-color: white;
    color: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      color: #4285f4;
      border-color: #4285f4;
      background-color: #f5f7fa;
    }
  }
  
  .el-icon {
    margin-right: 4px;
    font-size: 14px;
  }

  &:focus {
    outline: none;
  }
  
  .shortcut-hint {
    margin-left: 4px;
    font-size: 12px;
    opacity: 0.7;
  }
}

.keywords-content {
  flex: 1;
  overflow-y: auto;

  .keyword-tag {
    margin: 0 3px 3px 0;
    padding: 0 6px;
    height: 22px;
    line-height: 20px;
    font-size: 12px;
  }
}

.keywords-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;

  .el-icon {
    font-size: 16px;
  }

  // 只让Loading图标旋转
  :deep(.el-icon.is-loading) {
    animation: rotating 2s linear infinite;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mortgage-term-item {
  width: calc(50% - 10px);
}

.mortgage-term-item :deep(.el-form-item__content) {
    width: 100%;
}

.mortgage-term-item .range-input {
  width: 100%;
}

.mortgage-term-row {
  display: flex;
}

.mortgage-term-row .form-item {
  width: calc(50% - 10px);
  margin-right: auto;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.description-container {
  display: flex;
  flex-direction: column;
  margin: -5px 0 20px 0;

  .container-title {
    font-size: 14px;
    font-weight: 400;
    color: var(--el-text-color-regular);
    margin-bottom: 2px;
    position: relative;
    line-height: 32px;
    text-align: left;
    box-sizing: border-box;
    display: block;
    
    .required-mark {
      color: var(--el-color-danger);
      margin-right: 4px;
      font-size: 14px;
      vertical-align: middle;
    }
    
    .subtitle {
      font-weight: normal;
      color: var(--el-text-color-secondary);
      margin-left: 4px;
      font-size: 14px;
    }
  }

  .description-content {
    display: flex;
    gap: 20px;
    align-items: stretch; /* 确保子元素在交叉轴上拉伸到相同高度 */

    .description-input {
      flex: 1.7;
      display: flex; /* 使用flex布局 */
      flex-direction: column; /* 垂直方向排列 */
      
      :deep(.el-form-item) {
        margin-bottom: 0;
        flex: 1; /* 表单项占满空间 */
        display: flex;
        flex-direction: column;
      }
      
      :deep(.el-form-item__content) {
        flex: 1; /* 表单内容占满空间 */
        display: flex;
        flex-direction: column;
      }
      
      :deep(.el-textarea) {
        display: flex; /* 使用flex布局 */
        flex-direction: column; /* 垂直方向排列 */
        flex: 1; /* 占满剩余空间 */
      }
      
      :deep(.el-textarea__wrapper) {
        flex: 1; /* 占满剩余空间 */
        display: flex;
        flex-direction: column;
      }
      
      :deep(.el-textarea__inner) {
        resize: none; /* 禁止用户手动调整大小 */
        min-height: 164px; /* 最小高度 */
        flex: 1; /* 占满剩余空间 */
        height: auto !important; /* 自动调整高度 */
      }
    }

    .keywords-section {
      flex: 1.3;
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      background-color: var(--el-fill-color-light);
      transition: all 0.3s ease;
      overflow: visible; /* 允许内容溢出，不显示滚动条 */
      box-sizing: border-box;
      min-height: 164px; /* 最小高度匹配初始textarea高度 */

      .keywords-header {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .keywords-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 400;
          color: var(--el-text-color-primary);
        }
      }

      .keywords-content {
        flex: 1;
        overflow: visible; /* 允许内容自然流动，不限制高度 */
        height: auto; /* 自动高度 */
        min-height: 50px; /* 最小内容区高度 */

        .keyword-tag {
          margin: 4px 6px 6px 0;
          display: inline-block;
        }
      }

      .keywords-placeholder {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-secondary);
        gap: 8px;
        min-height: 50px; /* 最小占位区高度 */
        
        .el-icon {
          font-size: 16px;
        }
      }
    }
  }
}

/* 字数统计的样式优化 */
:deep(.el-textarea .el-input__count) {
  transition: right 0.3s ease;
  position: absolute;
  background: transparent;
  z-index: 10;
  padding: 0 5px;
}

/* 优化滚动条样式 */
:deep(.el-textarea__inner) {
  scrollbar-width: thin; /* Firefox */
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

/* 自定义表格样式，确保在repayment-schedule内能够正常显示 */
.custom-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #ebeef5;
  margin-bottom: 0px;
  margin-top: 0; /* 确保表格没有顶部边距 */
}

.custom-table th,
.custom-table td {
  padding: 12px 10px;
  border: 1px solid #ebeef5;
  text-align: left;
}

.custom-table th {
  background-color: #f5f7fa;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.custom-table td {
  color: #606266;
  font-size: 14px;
}

.custom-table .center {
  text-align: center;
}

.right-bottom-panel .panel-content {
  display: flex;
  flex-direction: column;
}

/* 当没有内容时的占位符样式 */
.panel-content .placeholder-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 确保没有滚动条 */
  padding: 30px 0;
}

</style> 
