<template>
  <div class="finance-advice-container">
    <!-- 左侧：客户融资需求 -->
    <div class="left-panel">
      <div class="panel-header">
        <h2>客户融资需求</h2>
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
              <el-form-item label="年龄" prop="age" class="form-item">
                <el-input-number v-model="formData.age" :min="18" :max="100" :precision="0" :step="1" placeholder="请输入年龄"  @focus="handleInputFocus"></el-input-number>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="婚姻状况" prop="maritalStatus" class="form-item">
                <el-select v-model="formData.maritalStatus" placeholder="请选择婚姻状况" style="width: 100%">
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

            <!-- 需求描述文本框 -->
            <div class="form-row">
              <el-form-item label="需求描述" prop="additionalNotes" class="form-item form-item-full" :rules="[{ required: true, message: '请输入需求描述', trigger: 'blur' }]">
                <el-input
                  v-model="formData.additionalNotes"
                  type="textarea"
                  :rows="4"
                  :placeholder="getMoreDescriptionPlaceholder"
                  @focus="handleInputFocus"
                ></el-input>
              </el-form-item>
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
                      :min="1" 
                      :max="10000" 
                      :precision="0" 
                      :step="1" 
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
                      class="form-item">
                      <div class="range-input">
                        <el-form-item prop="minInterestRate" class="range-item">
                          <el-input-number 
                            v-model="formData.minInterestRate" 
                            :min="0" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            placeholder="最小值" 
                            @focus="handleInputFocus"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                        <span class="range-separator">至</span>
                        <el-form-item prop="maxInterestRate" class="range-item">
                          <el-input-number 
                            v-model="formData.maxInterestRate" 
                            :min="0" 
                            :max="20" 
                            :precision="2" 
                            :step="0.1" 
                            placeholder="最大值" 
                            @focus="handleInputFocus"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                      </div>
                    </el-form-item>
                    
                    <el-form-item 
                      label="贷款期限范围(月)" 
                      prop="minLoanTerm" 
                      class="form-item">
                      <div class="range-input">
                        <el-form-item prop="minLoanTerm" class="range-item">
                          <el-input-number 
                            v-model="formData.minLoanTerm" 
                            :min="1" 
                            :max="360" 
                            :step="1" 
                            placeholder="最小值" 
                            @focus="handleInputFocus"
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
                            :max="120" 
                            :precision="2" 
                            :step="1" 
                            style="width: 100%" 
                            @focus="handleInputFocus"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                        <el-form-item label="公积金贷款利率范围(%)" prop="fundInterestRate" class="form-item">
                          <div class="range-input">
                            <el-form-item prop="minFundRate" class="range-item">
                              <el-input-number 
                                v-model="formData.mortgage.minFundRate" 
                                :min="0" 
                                :max="20" 
                                :precision="2" 
                                :step="0.1" 
                                placeholder="最小值" 
                                @focus="handleInputFocus"
                                class="bold-number"></el-input-number>
                            </el-form-item>
                            <span class="range-separator">至</span>
                            <el-form-item prop="maxFundRate" class="range-item">
                              <el-input-number 
                                v-model="formData.mortgage.maxFundRate" 
                                :min="0" 
                                :max="20" 
                                :precision="2" 
                                :step="0.1" 
                                placeholder="最大值" 
                                @focus="handleInputFocus"
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
                            :step="1" 
                            style="width: 100%" 
                            @focus="handleInputFocus"
                            class="bold-number"></el-input-number>
                        </el-form-item>
                        <el-form-item label="商业贷款利率范围(%)" prop="commercialInterestRate" class="form-item">
                          <div class="range-input">
                            <el-form-item prop="minCommercialRate" class="range-item">
                              <el-input-number 
                                v-model="formData.mortgage.minCommercialRate" 
                                :min="0" 
                                :max="20" 
                                :precision="2" 
                                :step="0.1" 
                                placeholder="最小值" 
                                @focus="handleInputFocus"
                                class="bold-number"></el-input-number>
                            </el-form-item>
                            <span class="range-separator">至</span>
                            <el-form-item prop="maxCommercialRate" class="range-item">
                              <el-input-number 
                                v-model="formData.mortgage.maxCommercialRate" 
                                :min="0" 
                                :max="20" 
                                :precision="2" 
                                :step="0.1" 
                                placeholder="最大值" 
                                @focus="handleInputFocus"
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

                    <!-- 按揭贷款期限 -->
                    <div class="form-row">
                      <el-form-item label="按揭贷款期限范围(月)" prop="mortgageLoanTerm" class="form-item form-item-full">
                        <div class="range-input">
                          <el-form-item prop="minMortgageTerm" class="range-item">
                            <el-input-number 
                              v-model="formData.mortgage.minMortgageTerm" 
                              :min="120" 
                              :max="360" 
                              :step="12" 
                              placeholder="最小值" 
                              @focus="handleInputFocus"
                              class="bold-number"></el-input-number>
                          </el-form-item>
                          <span class="range-separator">至</span>
                          <el-form-item prop="maxMortgageTerm" class="range-item">
                            <el-input-number 
                              v-model="formData.mortgage.maxMortgageTerm" 
                              :min="120" 
                              :max="360" 
                              :step="12" 
                              placeholder="最大值" 
                              @focus="handleInputFocus"
                              class="bold-number"></el-input-number>
                          </el-form-item>
                        </div>
                      </el-form-item>
                    </div>

                    <!-- 房产信息 -->
                    <div class="form-row">
                      <el-form-item label="房产总价(万元)" prop="propertyValue" class="form-item">
                        <el-input-number 
                          v-model="formData.mortgage.propertyValue" 
                          :min="1" 
                          :max="5000" 
                          :precision="2" 
                          :step="1" 
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
                      <el-input-number v-model="formData.secured.collateralValue" :min="1" :max="5000" :precision="2" :step="1" style="width: 100%" @focus="handleInputFocus"></el-input-number>
                    </el-form-item>
                    <el-form-item label="抵押率(%)" prop="mortgageRatio" class="form-item">
                      <el-input-number v-model="formData.secured.mortgageRatio" :min="10" :max="90" :step="5" style="width: 100%" @focus="handleInputFocus"></el-input-number>
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
              <el-button type="primary" @click="submitForm" :loading="submitting">获取AI建议报告</el-button>
              <el-button @click="resetForm">重置</el-button>
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
          <h2>客户征信报告</h2>
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
                  <el-upload
                    class="upload-container"
                    drag
                    action="/api/upload"
                    :on-success="handlePersonalCreditSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUpload"
                    :file-list="personalCreditFiles"
                    :limit="1"
                    :on-exceed="handleExceed"
                    :on-remove="handlePersonalCreditRemove"
                    accept=".pdf"
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
                  <el-upload
                    class="upload-container"
                    drag
                    action="/api/upload"
                    :on-success="handleBusinessCreditSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUpload"
                    :file-list="businessCreditFiles"
                    :limit="1"
                    :on-exceed="handleExceed"
                    :on-remove="handleBusinessCreditRemove"
                    accept=".pdf"
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
      
      <!-- 右下部分：融资方案分析 -->
      <div class="right-bottom-panel">
        <div class="panel-header">
          <h2>还款计划试算</h2>
        </div>
        <div class="panel-content">
          <!-- 还款计划表试算区域 -->
          <div v-if="canCalculateRepayment" class="repayment-calculator">
            <!-- 试算参数展示 -->
            <div class="calculation-params">
              <div class="param-item">
                <span class="param-label">贷款金额:</span>
                <span class="param-value">{{ formData.loanAmount }}万元</span>
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
                <div class="overview-label">还款总额</div>
              </div>
              <div class="overview-item">
                <div class="overview-value">{{ formatCurrency(calculationResult.totalInterest) }}</div>
                <div class="overview-label">支付利息</div>
              </div>
              <div class="overview-item" v-if="calculationParams.repaymentMethod === 'equal_principal_interest'">
                <div class="overview-value">{{ formatCurrency(calculationResult.monthlyPayment) }}</div>
                <div class="overview-label">月供金额</div>
              </div>
            </div>
            
            <!-- 还款计划表 -->
            <div class="repayment-schedule">
              <el-table :data="calculationResult.schedule" stripe style="width: 100%" height="300" :border="true">
                <el-table-column prop="period" label="期数" width="60" />
                <el-table-column prop="paymentDate" label="还款日期" width="100" />
                <el-table-column prop="monthlyPayment" label="月供金额" :formatter="formatTableCurrency" />
                <el-table-column prop="principal" label="本金" :formatter="formatTableCurrency" />
                <el-table-column prop="interest" label="利息" :formatter="formatTableCurrency" />
                <el-table-column prop="remainingPrincipal" label="剩余本金" :formatter="formatTableCurrency" />
              </el-table>
            </div>
          </div>
          
          <!-- 提示信息 -->
          <div v-else class="placeholder-content">
            <div class="calculation-tips">
              <el-icon><InfoFilled /></el-icon>
              <span>请完善贷款金额、利率、期限和还款方式信息，系统将自动计算还款计划</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Document, UploadFilled, InfoFilled } from '@element-plus/icons-vue'

export default {
  name: 'FinanceAdviceForm',
  components: {
    Document,
    UploadFilled,
    InfoFilled
  },
  data() {
    return {
      submitting: false,
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
      formData: {
        // 基本信息
        name: '',
        age: 30,
        maritalStatus: '',
        phone: '',
        
        // 融资需求通用字段
        loanType: '',
        loanAmount: 100,
        minInterestRate: 3.5,
        maxInterestRate: 5.5,
        minLoanTerm: 12,
        maxLoanTerm: 36,
        repaymentMethod: [],
        
        // 按揭贷款特定字段
        mortgage: {
          propertyType: 'residential',
          propertyValue: 300,
          downPaymentRatio: 30,
          isFirstProperty: true,
          mortgageType: '',
          fundLoanAmount: 0,
          commercialLoanAmount: 0,
          minMortgageTerm: 120,
          maxMortgageTerm: 360
        },
        
        // 抵押贷款特定字段
        secured: {
          loanPurpose: '',
          collateralType: '',
          collateralValue: 200,
          mortgageRatio: 60,
          // 企业经营相关字段
          businessYears: 0,
          hasBusinessLicense: false,
          businessLicenseMonths: 0
        },
        
        // 信用贷款特定字段
        credit: {
          loanPurpose: '',
          monthlyIncome: 10000,
          employerType: '',
          workYears: 3
        },
        additionalNotes: ''
      },
      rules: {
        // 基本信息验证规则
        name: [
          { required: true, message: '请输入客户姓名', trigger: 'blur' }
        ],
        age: [
          { required: true, message: '请输入年龄', trigger: 'blur' }
        ],
        maritalStatus: [
          { required: true, message: '请选择婚姻状况', trigger: 'change' }
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
        ]
      },
      // 不同贷款方式的还款方式选项
      repaymentOptions: [
        { label: '等额本息', value: 'equal_principal_interest' },
        { label: '等额本金', value: 'equal_principal' },
        { label: '先息后本', value: 'interest_first' },
        { label: '一次性还本付息', value: 'lump_sum' },
        { label: '按月付息到期还本', value: 'monthly_interest' }
      ],
    }
  },
  computed: {
    // 判断是否为抵押贷款且用途为企业经营
    isBusinessSecuredLoan() {
      return this.formData.loanType === 'secured' && this.formData.secured.loanPurpose === 'business';
    },
    
    // 判断是否可以计算还款计划
    canCalculateRepayment() {
      return (
        this.formData.loanType && // 必须选择贷款方式
        this.formData.loanAmount > 0 &&
        this.formData.minInterestRate > 0 &&
        this.formData.maxInterestRate > 0 &&
        this.formData.minLoanTerm > 0 &&
        this.formData.maxLoanTerm > 0 &&
        this.formData.repaymentMethod.length > 0
      );
    },
    
    // 计算参数
    calculationParams() {
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
        interestRate,
        loanTerm,
        repaymentMethod,
        repaymentMethodLabel
      };
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
          loanType = '按揭贷款';
          break;
        case 'secured':
          loanType = '抵押贷款';
          break;
        case 'credit':
          loanType = '信用贷款';
          break;
        default:
          loanType = '';
      }
      return `你可以在这里直接用文字完整描述客户${loanType}的融资需求。`;
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
    'formData.phone': {
      immediate: true,
      handler(newValue) {
        if (newValue && !this.displayPhone) {
          this.formatPhoneNumber(newValue);
        }
      }
    }
  },
  methods: {
    // 贷款方式变更处理
    handleLoanTypeChange(value) {
      // 根据贷款方式更新还款方式选项
      switch(value) {
        case 'secured':
          this.repaymentOptions = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '等额本金', value: 'equal_principal' },
            { label: '先息后本', value: 'interest_first' }
          ];
          // 设置抵押贷款默认值（根据广州地区最新政策）
          this.formData.loanAmount = 140; // 假设抵押物价值200万，贷款70%
          this.formData.minInterestRate = 3.1; // 最低可至3.1%
          this.formData.maxInterestRate = 4.5; // 上限约4.5%
          this.formData.minLoanTerm = 12; // 1年
          this.formData.maxLoanTerm = 120; // 10年
          this.formData.repaymentMethod = ['equal_principal_interest'];
          break;
        case 'credit':
          this.repaymentOptions = [
            { label: '等额本息', value: 'equal_principal_interest' },
            { label: '先息后本', value: 'interest_first' },            
            { label: '一次性还本付息', value: 'lump_sum' }
          ];
          // 设置信用贷款默认值（根据广州地区最新政策）
          this.formData.loanAmount = 50; // 50万元
          this.formData.minInterestRate = 4.0; // 最低可至4.0%
          this.formData.maxInterestRate = 8.0; // 上限约8.0%
          this.formData.minLoanTerm = 12; // 1年
          this.formData.maxLoanTerm = 36; // 3年
          this.formData.repaymentMethod = ['equal_principal_interest'];
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
        this.$message.error('只能上传PDF格式的文件!');
        return false;
      }
      if (!isLt10M) {
        this.$message.error('文件大小不能超过10MB!');
        return false;
      }
      return true;
    },
    
    // 个人征信报告上传成功处理
    handlePersonalCreditSuccess(response, file, fileList) {
      this.$message.success('个人征信报告上传成功');
      this.personalCreditFiles = fileList;
    },
    
    // 企业征信报告上传成功处理
    handleBusinessCreditSuccess(response, file, fileList) {
      this.$message.success('企业征信报告上传成功');
      this.businessCreditFiles = fileList;
    },
    
    // 上传错误处理
    handleUploadError() {
      this.$message.error('文件上传失败，请重试');
    },
    
    // 文件数量超出限制处理
    handleExceed() {
      this.$message.warning('只能上传一个文件，请先删除已上传文件');
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
      
      const { interestRate, loanTerm, repaymentMethod } = this.calculationParams;
      const loanAmount = this.formData.loanAmount * 10000; // 转换为元
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
          monthlyPayment = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm) / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
          totalRepayment = monthlyPayment * loanTerm;
          totalInterest = totalRepayment - loanAmount;
          
          // 生成还款计划表
          let remainingPrincipal1 = loanAmount;
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
          const monthlyPrincipal = loanAmount / loanTerm;
          totalRepayment = 0;
          
          // 生成还款计划表
          let remainingPrincipal2 = loanAmount;
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
          const monthlyInterest = loanAmount * monthlyInterestRate;
          totalInterest = monthlyInterest * loanTerm;
          totalRepayment = loanAmount + totalInterest;
          
          // 生成还款计划表
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const principal = i === loanTerm ? loanAmount : 0;
            const payment = i === loanTerm ? (loanAmount + monthlyInterest) : monthlyInterest;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: principal.toFixed(2),
              interest: monthlyInterest.toFixed(2),
              remainingPrincipal: i === loanTerm ? '0.00' : loanAmount.toFixed(2)
            });
          }
          break;
          
        case 'lump_sum': // 一次性还本付息
          const totalInterestAmount = loanAmount * monthlyInterestRate * loanTerm;
          totalInterest = totalInterestAmount;
          totalRepayment = loanAmount + totalInterest;
          
          // 生成还款计划表
          const paymentDate = new Date(firstPaymentDate);
          paymentDate.setMonth(firstPaymentDate.getMonth() + loanTerm - 1);
          
          schedule.push({
            period: 1,
            paymentDate: paymentDate.toISOString().split('T')[0],
            monthlyPayment: totalRepayment.toFixed(2),
            principal: loanAmount.toFixed(2),
            interest: totalInterest.toFixed(2),
            remainingPrincipal: '0.00'
          });
          break;
          
        case 'monthly_interest': // 按月付息到期还本
          const monthlyInterestPayment = loanAmount * monthlyInterestRate;
          totalInterest = monthlyInterestPayment * loanTerm;
          totalRepayment = loanAmount + totalInterest;
          
          // 生成还款计划表
          for (let i = 1; i <= loanTerm; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(firstPaymentDate.getMonth() + i - 1);
            
            const principal = i === loanTerm ? loanAmount : 0;
            const payment = i === loanTerm ? (loanAmount + monthlyInterestPayment) : monthlyInterestPayment;
            
            schedule.push({
              period: i,
              paymentDate: paymentDate.toISOString().split('T')[0],
              monthlyPayment: payment.toFixed(2),
              principal: principal.toFixed(2),
              interest: monthlyInterestPayment.toFixed(2),
              remainingPrincipal: i === loanTerm ? '0.00' : loanAmount.toFixed(2)
            });
          }
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
    
    // 表格中格式化货币
    formatTableCurrency(row, column, cellValue) {
      return this.formatCurrency(cellValue);
    },
    
    // 提交表单
    submitForm() {
      this.$refs.financeForm.validate((valid) => {
        if (valid) {
          this.submitting = true;
          // 准备提交数据
          const submitData = {
            ...this.formData,
            personalCreditFile: this.personalCreditFiles.length > 0 ? this.personalCreditFiles[0].response : null,
            businessCreditFile: this.businessCreditFiles.length > 0 ? this.businessCreditFiles[0].response : null,
            repaymentSchedule: this.calculationResult
          };
          
          // 模拟提交
          setTimeout(() => {
            this.submitting = false;
            this.$message.success('提交成功，正在分析中...');
            console.log('提交的数据:', submitData);
            // TODO: 调用后端API进行分析
          }, 1500);
        } else {
          this.$message.error('请完善表单信息');
          return false;
        }
      });
    },
    
    // 重置表单
    resetForm() {
      this.$refs.financeForm.resetFields();
      this.personalCreditFiles = [];
      this.businessCreditFiles = [];
      // 重置计算结果
      this.calculationResult = {
        totalRepayment: 0,
        totalInterest: 0,
        monthlyPayment: 0,
        schedule: []
      };
      // 重置贷款类型，这样会清空所有相关字段
      this.formData.loanType = '';
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
      // 重置相关字段
      this.formData.minInterestRate = null;
      this.formData.maxInterestRate = null;
      this.formData.minLoanTerm = 120;
      this.formData.maxLoanTerm = 360;
      this.formData.repaymentMethod = [];

      // 根据贷款方式设置默认值
      switch(value) {
        case 'fund':
          this.formData.minInterestRate = 3.1;
          this.formData.maxInterestRate = 3.1;
          break;
        case 'commercial':
          this.formData.minInterestRate = 4.2;
          this.formData.maxInterestRate = 4.85;
          break;
        case 'mixed':
          this.formData.mortgage.fundLoanAmount = 0;
          this.formData.mortgage.commercialLoanAmount = 0;
          break;
      }
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
          // 使用requestAnimationFrame来避免循环通知问题
          window.requestAnimationFrame(() => {
            if (document.contains(entries[0].target)) {
              try {
                callback(entries, observer);
              } catch (e) {
                console.warn('ResizeObserver error caught:', e);
              }
            }
          });
        };
        super(safeCallback);
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
    };
    
    window.addEventListener('unhandledrejection', rejectionHandler, true);
    this._rejectionHandler = rejectionHandler;
  },
  beforeUnmount() {
    // 恢复原始的ResizeObserver
    if (window._originalResizeObserver) {
      window.ResizeObserver = window._originalResizeObserver;
    }
    
    // 移除事件监听器
    if (this._errorHandler) {
      window.removeEventListener('error', this._errorHandler, true);
    }
    
    if (this._rejectionHandler) {
      window.removeEventListener('unhandledrejection', this._rejectionHandler, true);
    }
  }
}
</script>

<style lang="scss" scoped>
.finance-advice-container {
  display: flex;
  height: calc(100vh - 100px);
  padding: 20px;
  gap: 20px;
}

.left-panel {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-top-panel {
  flex: 0.42; /* 减少顶部面板的高度占比 */
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-bottom-panel {
  flex: 0.58; /* 增加底部面板的高度占比 */
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.panel-header h2 {
  margin: 0;
  color: #1b68de;
  font-size: 18px;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1b68de;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.placeholder-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.range-input {
  display: flex;
  align-items: center;
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
  margin-top: 30px;
}

/* 征信报告上传样式 */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-row {
  display: flex;
  gap: 20px;
}

.upload-item {
  flex: 1;
  border-radius: 8px;
  background-color: #f8f9fa;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.upload-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #1b68de;
}

.upload-title .el-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #1b68de;
}

.upload-optional {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.upload-area {
  padding: 10px 0;
}

.upload-container {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  padding: 20px;
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
  font-size: 40px;
  color: #1b68de;
  margin-bottom: 10px;
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
  gap: 20px;
}

.calculation-params {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  padding: 15px;
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
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
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

.repayment-schedule {
  margin-top: 20px;
}

.calculation-tips {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #909399;
}

.calculation-tips .el-icon {
  font-size: 20px;
  color: #1b68de;
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

/* 全局样式覆盖 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #1b68de;
  border-color: #1b68de;
}

:deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
  border-color: #1b68de;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #1b68de;
  border-color: #1b68de;
}

:deep(.el-radio__input.is-focus .el-radio__inner) {
  border-color: #1b68de;
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #1b68de;
  border-color: #1b68de;
}

:deep(.el-radio.is-bordered.is-checked) {
  border-color: #1b68de;
}

:deep(.el-checkbox.is-bordered.is-checked) {
  border-color: #1b68de;
}

:deep(.el-radio__label),
:deep(.el-checkbox__label) {
  color: #606266;
}

:deep(.el-radio__input.is-checked + .el-radio__label),
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #1b68de;
}

/* 扩展更多Element Plus组件的颜色覆盖 */
:deep(.el-button--primary) {
  background-color: #1b68de;
  border-color: #1b68de;
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus) {
  background-color: #4785e5;
  border-color: #4785e5;
}

:deep(.el-button--primary:active) {
  background-color: #1857be;
  border-color: #1857be;
}

:deep(.el-button--text) {
  color: #1b68de;
}

:deep(.el-button--text:hover),
:deep(.el-button--text:focus) {
  color: #4785e5;
}

:deep(.el-select:hover .el-input__inner) {
  border-color: #1b68de;
}

:deep(.el-select .el-input.is-focus .el-input__inner) {
  border-color: #1b68de;
}

:deep(.el-select-dropdown__item.selected) {
  color: #1b68de;
}

:deep(.el-input__inner:focus) {
  border-color: #1b68de;
}

:deep(.el-input.is-active .el-input__inner) {
  border-color: #1b68de;
}

:deep(.el-input-number__increase:hover),
:deep(.el-input-number__decrease:hover) {
  color: #1b68de;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled).active) {
  background-color: #1b68de;
}

:deep(.el-pagination.is-background .el-pager li:not(.disabled):hover) {
  color: #1b68de;
}

:deep(.el-tabs__active-bar) {
  background-color: #1b68de;
}

:deep(.el-tabs__item.is-active) {
  color: #1b68de;
}

:deep(.el-tabs__item:hover) {
  color: #1b68de;
}

:deep(.el-tag--primary) {
  background-color: rgba(27, 104, 222, 0.1);
  border-color: rgba(27, 104, 222, 0.2);
  color: #1b68de;
}

:deep(.el-switch.is-checked .el-switch__core) {
  border-color: #1b68de;
  background-color: #1b68de;
}

:deep(.el-slider__bar) {
  background-color: #1b68de;
}

:deep(.el-slider__button) {
  border-color: #1b68de;
}

:deep(.el-table th.el-table__cell > .cell.highlight) {
  color: #1b68de;
}

:deep(.el-table__fixed-right::before),
:deep(.el-table__fixed::before) {
  background-color: #1b68de;
}

:deep(.el-loading-spinner .path) {
  stroke: #1b68de;
}

:deep(.el-message-box__headerbtn:focus .el-message-box__close),
:deep(.el-message-box__headerbtn:hover .el-message-box__close) {
  color: #1b68de;
}

:deep(.el-message--success .el-message__icon),
:deep(.el-message--success) {
  color: #1b68de;
}

/* 上传进度条和下拉框颜色 */
:deep(.el-progress-bar__inner) {
  background-color: #1b68de !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #1b68de inset !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: #1b68de !important;
  font-weight: bold;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1b68de inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1b68de inset !important;
}

:deep(.el-input-number.is-controls-right .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1b68de inset !important;
}

:deep(.el-upload-list__item.is-success .el-upload-list__item-name) {
  color: #1b68de;
}

:deep(.el-upload-list__item .el-icon--close) {
  color: #606266;
}

:deep(.el-upload-list__item .el-icon--close:hover) {
  color: #1b68de;
}

:deep(.el-upload-list__item-delete:hover) {
  color: #1b68de;
}

/* 表单布局 */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
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
  font-weight: bold !important;
  color: #000 !important;
}

:deep(.bold-number.el-input-number .el-input__inner) {
  font-weight: bold !important;
  color: #000 !important;
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
    margin-top: -15px; /* 减少与需求描述的距离 */
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
</style> 