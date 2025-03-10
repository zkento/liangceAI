<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="credit-report" v-if="analysisData">
    <!-- 数据提取部分 -->
    <div class="credit-report-section">
      <h2>原始数据提取</h2>
      
      <!-- 贷款明细 -->
      <h3>贷款明细（{{ analysisData.loans.total }}笔）</h3>
      <el-table
        :data="analysisData.loans.items"
        class="credit-report-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="institution" label="机构" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="amount" label="授信金额" />
        <el-table-column prop="balance" label="当前余额" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <span :class="{ 'credit-report-highlight': scope.row.status === '未结清' }">
              {{ scope.row.status }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 贷记卡明细 -->
      <h3>贷记卡明细（{{ analysisData.creditCards.total }}张）</h3>
      <el-table
        :data="analysisData.creditCards.items"
        class="credit-report-table"
      >
        <el-table-column prop="bank" label="发卡行" />
        <el-table-column prop="limit" label="授信额度" />
        <el-table-column prop="used" label="已用额度" />
        <el-table-column prop="usageRate" label="使用率">
          <template #default="scope">
            <span :class="{ 'credit-report-risk-tag': scope.row.usageRate > 80 }">
              {{ scope.row.usageRate }}%
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 担保责任明细 -->
      <h3>担保责任明细（{{ analysisData.guarantees.total }}笔）</h3>
      <el-table
        :data="analysisData.guarantees.items"
        class="credit-report-table"
      >
        <el-table-column prop="target" label="担保对象" />
        <el-table-column prop="amount" label="责任金额" />
        <el-table-column prop="balance" label="当前余额" />
      </el-table>
    </div>

    <!-- 风险分析部分 -->
    <div class="credit-report-section">
      <h2>风险指标分析</h2>
      <div class="credit-report-chart" id="riskIndicators"></div>
      <div style="display: flex; gap: 20px">
        <div class="credit-report-chart" id="loanType"></div>
        <div class="credit-report-chart" id="creditCardUsage"></div>
      </div>
    </div>

    <!-- 查询记录分析 -->
    <div class="credit-report-section">
      <h2>查询记录分析</h2>
      <div class="credit-report-chart" id="queryTrend"></div>
      <div class="credit-report-chart" id="queryType"></div>
    </div>

    <!-- 改善建议 -->
    <div class="credit-report-section">
      <h2>改善建议</h2>
      <div class="suggestions" v-html="analysisData.suggestions"></div>
    </div>
  </div>
  <div v-else class="credit-report-loading">
    <el-empty description="暂无分析结果" />
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { initializeCharts, setupChartResize } from '@/config/charts/credit-report'
import { generateCreditReportCSS } from '@/config/styles/credit-report'

export default {
  name: 'AnalysisResult',
  props: {
    analysisData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    let charts = null

    // 初始化图表
    const initCharts = () => {
      if (props.analysisData && !charts) {
        charts = initializeCharts(echarts, props.analysisData.charts)
        setupChartResize(charts)
      }
    }

    // 获取行样式
    const getRowClassName = ({ row }) => {
      return {
        'risk-row': row.isRisky
      }
    }

    // 监听数据变化
    watch(() => props.analysisData, (newVal) => {
      if (newVal) {
        initCharts()
      }
    })

    onMounted(() => {
      if (props.analysisData) {
        initCharts()
      }
      
      // 添加全局样式
      const styleElement = document.createElement('style')
      styleElement.innerHTML = generateCreditReportCSS()
      document.head.appendChild(styleElement)
    })

    onUnmounted(() => {
      if (charts) {
        Object.values(charts).forEach(chart => chart.dispose())
      }
    })

    return {
      getRowClassName
    }
  }
}
</script>

<style scoped>
/* 额外的样式 */
.suggestions {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  line-height: 1.6;
}

.risk-row {
  background-color: #fff3f3;
}

.credit-report-loading {
  padding: 40px;
  text-align: center;
}
</style> 