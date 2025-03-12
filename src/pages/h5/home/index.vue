<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="home">
    <header class="header">
      <h1>AI 智能助手</h1>
      <p class="subtitle">提升您的工作效率与专业性</p>
    </header>

    <div class="tools-grid">
      <router-link 
        v-for="tool in tools" 
        :key="tool.id" 
        :to="tool.path"
        class="tool-card"
      >
        <el-card :body-style="{ padding: '0px' }" shadow="hover">
          <div class="tool-content">
            <i :class="tool.icon"></i>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
          </div>
        </el-card>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  data() {
    return {
      tools: [
        {
          id: 1,
          name: '个人征信分析',
          description: '智能分析个人征信报告，提供专业见解',
          path: '/personal-credit',
          icon: 'el-icon-user'
        },
        {
          id: 2,
          name: '企业征信分析',
          description: '深度解析企业征信报告，助力决策',
          path: '/business-credit',
          icon: 'el-icon-office-building'
        },
        {
          id: 3,
          name: '置业建议',
          description: '基于数据分析，提供个性化置业方案',
          path: '/property-advice',
          icon: 'el-icon-house'
        },
        {
          id: 4,
          name: '融资建议',
          description: '智能规划融资方案，优化资金结构',
          path: '/financing-advice',
          icon: 'el-icon-money'
        }
      ]
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 60px;
}

.header h1 {
  font-size: 2.5rem;
  color: #1a73e8;
  margin-bottom: 16px;
  font-weight: 600;
}

.subtitle {
  font-size: 1.2rem;
  color: #5f6368;
  margin: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.tool-card {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
}

.tool-content {
  padding: 32px 24px;
  text-align: center;
}

.tool-content i {
  font-size: 48px;
  color: #1a73e8;
  margin-bottom: 16px;
}

.tool-content h3 {
  font-size: 1.25rem;
  margin: 16px 0;
  color: #202124;
}

.tool-content p {
  color: #5f6368;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .home {
    padding: 20px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style> 