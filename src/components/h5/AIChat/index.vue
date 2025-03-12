<!-- 最后修改时间: 2024-03-19 -->
<template>
  <div class="ai-chat">
    <div class="chat-container" ref="chatContainer">
      <div class="messages" ref="messages">
        <div v-for="(message, index) in messages" 
             :key="index" 
             :class="['message', message.type]">
          <div v-if="message.type === 'user'" class="message-content user">
            {{ message.content }}
          </div>
          <div v-else class="message-content ai">{{ message.content }}</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="请描述您的需求..."
        @keyup.enter.ctrl="sendMessage"
        :disabled="loading"
      />
      <div class="button-area">
        <el-button 
          type="primary" 
          :loading="loading"
          @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { chatWithAI } from '@/api/deepseek'
import { ElMessage } from 'element-plus'

export default {
  name: 'AIChat',
  props: {
    type: {
      type: String,
      required: true,
      validator: value => ['personal-credit', 'business-credit', 'property-advice', 'financing-advice'].includes(value)
    }
  },
  data() {
    return {
      userInput: '',
      messages: [],
      loading: false
    }
  },
  methods: {
    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return;

      const userMessage = this.userInput.trim();
      this.messages.push({
        type: 'user',
        content: userMessage
      });

      this.loading = true;
      this.userInput = '';

      try {
        const response = await chatWithAI(userMessage, this.type);
        
        if (!response.success) {
          throw new Error(response.error || '分析失败');
        }
        
        this.messages.push({
          type: 'ai',
          content: response.data
        });
      } catch (error) {
        ElMessage.error(error.message || '请求失败，请稍后重试');
        console.error('AI请求错误:', error);
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },

    scrollToBottom() {
      const container = this.$refs.messages;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
}
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f8f9fa;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  margin-bottom: 12px;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content.user {
  background-color: #1a73e8;
  color: white;
  border-radius: 12px 12px 0 12px;
}

.message-content.ai {
  background-color: white;
  color: #202124;
  border-radius: 12px 12px 12px 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.input-area {
  padding: 20px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.button-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

:deep(.el-textarea__inner) {
  resize: none;
  border-radius: 8px;
}

:deep(.el-button) {
  padding: 12px 24px;
  font-size: 14px;
}

/* AI响应样式 */
:deep(.ai-response) {
  h3 {
    color: #1a73e8;
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 500;
  }

  .content {
    p {
      margin: 8px 0;
      line-height: 1.6;
    }
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  strong {
    color: #202124;
    font-weight: 500;
  }
}
</style> 