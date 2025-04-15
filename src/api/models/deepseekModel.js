// 最后修改记录时间 -> 2025-04-15 16:58

import axios from 'axios';
import BaseModelAdapter from './baseModel';
import { MODEL_PROVIDERS } from '@/config/models';

/**
 * DeepSeek模型适配器
 * 处理与DeepSeek API的交互
 */
export default class DeepSeekModelAdapter extends BaseModelAdapter {
  /**
   * 构造函数
   * @param {Object} config - 模型配置
   */
  constructor(config) {
    super(config);
    
    if (config.provider !== MODEL_PROVIDERS.DEEPSEEK) {
      throw new Error(`DeepSeekModelAdapter只支持${MODEL_PROVIDERS.DEEPSEEK}提供商`);
    }
    
    this.apiClient = null;
  }

  /**
   * 初始化模型
   * @param {Object} options - 初始化选项
   * @returns {Promise<boolean>} - 是否初始化成功
   */
  async initialize(options = {}) {
    try {
      // 获取API密钥（优先使用选项中的密钥，否则从环境变量中获取）
      const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        throw new Error('缺少DeepSeek API密钥');
      }
      
      // 创建axios实例
      this.apiClient = axios.create({
        baseURL: this.config.apiEndpoint,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: options.timeout || 90000 // 默认90秒超时
      });
      
      // 添加请求拦截器记录时间戳
      this.apiClient.interceptors.request.use(config => {
        config.metadata = { startTime: new Date() };
        return config;
      });
      
      // 添加响应拦截器记录耗时
      this.apiClient.interceptors.response.use(
        response => {
          const startTime = response.config.metadata.startTime;
          response.metadata = { 
            ...response.config.metadata,
            endTime: new Date(),
            duration: new Date() - startTime
          };
          return response;
        },
        error => {
          // 错误也记录耗时
          if (error.config && error.config.metadata) {
            const startTime = error.config.metadata.startTime;
            error.metadata = {
              ...error.config.metadata,
              endTime: new Date(),
              duration: new Date() - startTime
            };
          }
          
          return Promise.reject(error);
        }
      );
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('DeepSeek模型初始化失败:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * 确保模型已初始化
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized || !this.apiClient) {
      throw new Error('DeepSeek模型未初始化，请先调用initialize方法');
    }
  }

  /**
   * 聊天功能
   * @param {Array} messages - 消息列表
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应结果
   */
  async chat(messages, options = {}) {
    try {
      this._ensureInitialized();
      
      // 合并默认参数和自定义参数
      const params = {
        ...this.config.defaultParams,
        ...options
      };
      
      // 发送请求
      const response = await this.apiClient.post('/chat/completions', {
        model: options.model || 'deepseek-chat',
        messages: messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens
      });
      
      // 处理响应
      const result = response.data;
      
      if (!result.choices || !result.choices.length) {
        throw new Error('DeepSeek API返回了空响应');
      }
      
      return {
        success: true,
        data: result.choices[0].message.content,
        message: {
          role: 'assistant',
          content: result.choices[0].message.content
        },
        metadata: {
          modelId: this.config.id,
          duration: response.metadata.duration,
          usage: result.usage
        }
      };
    } catch (error) {
      console.error('DeepSeek聊天请求失败:', error);
      
      // 处理特定的API错误
      let errorMessage = error.message || '未知错误';
      let statusCode = 500;
      
      if (error.response) {
        statusCode = error.response.status;
        const responseData = error.response.data;
        
        if (statusCode === 400) {
          errorMessage = '请求格式错误';
          if (responseData && responseData.error) {
            errorMessage += `: ${responseData.error.message || responseData.error}`;
          }
        } else if (statusCode === 401) {
          errorMessage = 'API密钥无效或已过期';
        } else if (statusCode === 429) {
          errorMessage = 'API请求次数超限，请稍后再试';
        } else {
          errorMessage = `服务器错误(${statusCode}): ${responseData?.error?.message || '未知原因'}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        statusCode = 504;
        errorMessage = '请求超时，服务器响应时间过长';
      }
      
      return this.handleError({
        message: errorMessage,
        status: statusCode,
        details: error.response?.data || {}
      });
    }
  }

  /**
   * 生成文本
   * @param {string} prompt - 提示词
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应结果
   */
  async generateText(prompt, options = {}) {
    // 将单个提示转换为消息格式，然后调用chat方法
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // 如果有系统提示，添加到消息前面
    if (options.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    return this.chat(messages, options);
  }

  /**
   * 检查模型是否可用
   * @returns {Promise<boolean>} - 是否可用
   */
  async isAvailable() {
    try {
      this._ensureInitialized();
      
      // 发送简单请求验证API是否可用
      const response = await this.apiClient.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('DeepSeek API可用性检查失败:', error);
      return false;
    }
  }
} 