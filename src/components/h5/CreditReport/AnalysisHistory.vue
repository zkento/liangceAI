<!-- 最后修改时间: 2024-03-19 -->
<template>
  <el-dialog
    v-model="visible"
    title="分析记录"
    width="90%"
    :close-on-click-modal="true"
    destroy-on-close
  >
    <div class="analysis-history">
      <el-table
        :data="currentPageData"
        style="width: 100%"
        height="calc(100vh - 300px)"
        border
      >
        <el-table-column
          prop="submitTime"
          label="提交时间"
          min-width="180"
          :formatter="formatDateTime"
        />
        <el-table-column
          prop="generateTime"
          label="生成时间"
          min-width="180"
          :formatter="formatDateTime"
        />
        <el-table-column
          label="征信文件"
          min-width="150"
        >
          <template #default="scope">
            <el-link
              type="primary"
              @click="openFile(scope.row.originalFile)"
              :underline="false"
            >
              查看文件
            </el-link>
          </template>
        </el-table-column>
        <el-table-column
          label="分析结果"
          min-width="150"
        >
          <template #default="scope">
            <el-link
              type="primary"
              @click="openFile(scope.row.resultFile)"
              :underline="false"
            >
              查看结果
            </el-link>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalRecords"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { formatDate } from '@/utils/date'

export default {
  name: 'AnalysisHistory',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // 控制对话框显示
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalRecords = ref(0)

    // 模拟数据 - 实际项目中应该从API获取
    const historyData = ref([
      {
        id: 1,
        submitTime: new Date('2024-03-19 10:00:00'),
        generateTime: new Date('2024-03-19 10:01:30'),
        originalFile: '/path/to/original/file1.pdf',
        resultFile: '/path/to/result/file1.html'
      },
      // ... 更多数据
    ])

    // 当前页数据
    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return historyData.value.slice(start, end)
    })

    // 格式化日期时间
    const formatDateTime = (row, column) => {
      const date = row[column.property]
      return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
    }

    // 在新标签页中打开文件
    const openFile = (url) => {
      window.open(url, '_blank')
    }

    // 处理分页大小变化
    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    // 处理页码变化
    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    return {
      visible,
      currentPage,
      pageSize,
      totalRecords,
      currentPageData,
      formatDateTime,
      openFile,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.analysis-history {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-dialog__body) {
  padding: 20px;
  height: calc(100vh - 200px);
  overflow: hidden;
}

:deep(.el-table) {
  flex: 1;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}
</style> 