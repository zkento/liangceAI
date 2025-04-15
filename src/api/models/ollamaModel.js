// 最后修改记录时间 -> 2025-04-15 17:12

import axios from 'axios';
import BaseModelAdapter from './baseModel';
import { MODEL_PROVIDERS } from '@/config/models';

/**
 * Ollama模型适配器
 * 处理与本地Ollama API的交互
 */
export default class OllamaModelAdapter extends BaseModelAdapter {
  /**
   * 构造函数
   * @param {Object} config - 模型配置
   */
  constructor(config) {
    super(config);
    
    if (config.provider !== MODEL_PROVIDERS.OLLAMA) {
      throw new Error(`OllamaModelAdapter只支持${MODEL_PROVIDERS.OLLAMA}提供商`);
    }
    
    this.apiClient = null;
    this.modelIdentifier = config.modelIdentifier;
  }

  /**
   * 初始化模型
   * @param {Object} options - 初始化选项
   * @returns {Promise<boolean>} - 是否初始化成功
   */
  async initialize(options = {}) {
    try {
      // 创建axios实例
      this.apiClient = axios.create({
        baseURL: this.config.apiEndpoint,
        headers: {
          'Content-Type': 'application/json'
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
      
      // 检查模型是否存在
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error(`Ollama模型 ${this.modelIdentifier} 不可用，请确保Ollama服务已启动并加载了该模型`);
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Ollama模型初始化失败:', error);
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
      throw new Error('Ollama模型未初始化，请先调用initialize方法');
    }
  }

  /**
   * 将标准格式的消息转换为Ollama格式
   * @param {Array} messages - 标准格式的消息数组
   * @returns {Object} - Ollama格式的请求体
   * @private
   */
  _formatMessagesForOllama(messages, options = {}) {
    // 提取系统消息
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const otherMessages = messages.filter(msg => msg.role !== 'system');
    
    // 合并所有系统消息
    let systemPrompt = '';
    if (systemMessages.length > 0) {
      systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    }
    
    // 如果没有用户消息，添加一个默认的
    if (otherMessages.length === 0) {
      otherMessages.push({
        role: 'user',
        content: '请开始对话'
      });
    }
    
    // 获取最后一条用户消息作为prompt
    let prompt = '';
    for (const msg of otherMessages) {
      if (msg.role === 'user') {
        prompt = msg.content;
      } else if (msg.role === 'assistant') {
        prompt += `\n\nAssistant: ${msg.content}\n\nUser: `;
      }
    }
    
    // 合并默认参数和自定义参数
    const params = {
      ...this.config.defaultParams,
      ...options
    };
    
    // 构建Ollama请求体
    return {
      model: this.modelIdentifier,
      prompt: prompt,
      system: systemPrompt || undefined,
      stream: false,
      options: {
        temperature: params.temperature,
        num_predict: params.max_tokens
      }
    };
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
      
      // 格式化请求
      const requestBody = this._formatMessagesForOllama(messages, options);
      
      // 发送请求
      const startTime = new Date();
      const response = await this.apiClient.post('/generate', requestBody);
      const endTime = new Date();
      const duration = endTime - startTime;
      
      // 处理响应
      const result = response.data;
      
      if (!result.response) {
        throw new Error('Ollama API返回了空响应');
      }
      
      return {
        success: true,
        data: result.response,
        message: {
          role: 'assistant',
          content: result.response
        },
        metadata: {
          modelId: this.config.id,
          duration: duration,
          usage: {
            prompt_tokens: result.prompt_eval_count || 0,
            completion_tokens: result.eval_count || 0,
            total_tokens: (result.prompt_eval_count || 0) + (result.eval_count || 0)
          }
        }
      };
    } catch (error) {
      console.error('Ollama聊天请求失败:', error);
      
      // 处理特定的API错误
      let errorMessage = error.message || '未知错误';
      let statusCode = 500;
      
      if (error.response) {
        statusCode = error.response.status;
        const responseData = error.response.data;
        
        if (statusCode === 404) {
          errorMessage = `模型 ${this.modelIdentifier} 未找到`;
        } else if (statusCode === 400) {
          errorMessage = '请求格式错误';
          if (responseData && responseData.error) {
            errorMessage += `: ${responseData.error}`;
          }
        } else {
          errorMessage = `服务器错误(${statusCode}): ${responseData?.error || '未知原因'}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        statusCode = 504;
        errorMessage = '请求超时，服务器响应时间过长';
      } else if (error.code === 'ECONNREFUSED') {
        statusCode = 503;
        errorMessage = '无法连接到Ollama服务，请确保服务已启动';
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
      // 检查Ollama服务是否可用
      const response = await this.apiClient.get('/tags');
      
      // 检查模型是否存在
      const models = response.data.models || [];
      const modelExists = models.some(model => model.name === this.modelIdentifier);
      
      return modelExists;
    } catch (error) {
      console.error('Ollama API可用性检查失败:', error);
      return false;
    }
  }
} 