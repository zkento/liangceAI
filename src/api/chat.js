// 最后修改记录时间 -> 2025-04-15 17:30

// 导入模型适配器
import { chat as modelChat } from '@/api/models';
import store from '@/store';

/**
 * 发送消息到AI模型
 * @param {Array} messages - 消息列表
 * @param {string} chatType - 聊天类型
 * @param {Object} options - 其他选项
 * @returns {Promise<Object>} - AI响应消息
 */
export async function sendMessage(messages, chatType, options = {}) {
  try {
    console.log('发送请求到AI模型');
    console.log('消息数量:', messages.length);
    console.log('聊天类型:', chatType);
    
    // 获取当前使用的模型ID
    const modelId = options.modelId || store.getters['user/currentModelId'];
    console.log('使用模型:', modelId);
    
    // 调用统一的模型API
    const result = await modelChat(messages, {
      modelId,
      chatType,
      ...options
    });
    
    if (!result.success) {
      throw new Error(result.error || '发送消息失败');
    }
    
    return result.message;
  } catch (error) {
    console.error('API调用错误:', error);
    
    // 返回标准格式的错误消息
    return {
      role: 'assistant',
      content: `很抱歉，处理您的请求时出现错误: ${error.message || '未知错误'}。请稍后重试或联系系统管理员。`
    };
  }
}

/**
 * 上传PDF文件并获取分析结果
 * @param {File} file - 要上传的PDF文件
 * @param {string} chatType - 聊天类型
 * @param {Object} options - 其他选项
 * @returns {Promise<Object>} - 服务器响应
 */
export async function uploadPDFFile(file, chatType, options = {}) {
  try {
    console.log('上传PDF文件:', file.name);
    console.log('聊天类型:', chatType);
    console.log('文件大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatType', chatType);
    
    // 添加模型ID
    const modelId = options.modelId || store.getters['user/currentModelId'];
    formData.append('modelId', modelId);
    console.log('使用模型:', modelId);
    
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时
    
    try {
      // 发送请求 - 使用相对路径
      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      });
      
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // 处理HTTP错误状态
        if (response.status === 504) {
          throw new Error('请求超时，文件可能过大或服务器处理时间过长');
        }
        
        const errorText = await response.text();
        console.error('文件上传错误:', response.status, errorText);
        
        try {
          // 尝试解析JSON错误
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `文件上传错误: ${response.status}`);
        } catch (e) {
          // 如果不是JSON，直接使用文本
          throw new Error(`文件上传错误: ${response.status} ${errorText.substring(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log('文件上传响应:', data);
      
      // 返回包含提取文本和消息的对象
      const result = {
        role: 'assistant'
      };
      
      // 添加提取的文本，如果有的话
      if (data.extractedText) {
        result.extractedText = data.extractedText;
      }
      
      // 添加消息内容
      if (data.message && data.message.role && data.message.content) {
        result.role = data.message.role;
        result.content = data.message.content;
      } else if (data.message && data.message.content) {
        result.content = data.message.content;
      } else if (data.message) {
        result.content = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
      } else {
        result.content = '文件已成功上传，但服务器未返回分析结果。';
      }
      
      return result;
    } catch (fetchError) {
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      // 处理网络错误、超时等
      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时，文件可能过大或网络连接不稳定');
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      role: 'assistant',
      content: `文件上传失败: ${error.message || '未知错误'}`
    };
  }
}