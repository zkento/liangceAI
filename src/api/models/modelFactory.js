// 最后修改记录时间 -> 2025-04-15 17:18

import { MODEL_PROVIDERS, getModelById } from '@/config/models';
import DeepSeekModelAdapter from './deepseekModel';
import OllamaModelAdapter from './ollamaModel';

// 存储已创建的模型实例
const modelInstances = new Map();

/**
 * 模型工厂类
 * 负责创建和管理模型适配器实例
 */
export default class ModelFactory {
  /**
   * 获取模型适配器实例
   * @param {string} modelId - 模型ID
   * @param {Object} options - 初始化选项
   * @returns {Promise<BaseModelAdapter>} - 模型适配器实例
   */
  static async getModelAdapter(modelId, options = {}) {
    // 如果请求的是默认模型且未指定
    if (!modelId) {
      // 从localStorage获取用户首选模型
      const preferredModelId = localStorage.getItem('preferredModelId');
      if (preferredModelId) {
        modelId = preferredModelId;
      } else {
        // 默认使用DeepSeek
        modelId = 'deepseek-chat';
      }
    }
    
    // 检查是否已经创建了该模型的实例
    if (modelInstances.has(modelId)) {
      return modelInstances.get(modelId);
    }
    
    // 获取模型配置
    const modelConfig = getModelById(modelId);
    if (!modelConfig) {
      throw new Error(`未找到ID为 ${modelId} 的模型配置`);
    }
    
    // 根据提供商创建适当的适配器
    let modelAdapter;
    
    switch (modelConfig.provider) {
      case MODEL_PROVIDERS.DEEPSEEK:
        modelAdapter = new DeepSeekModelAdapter(modelConfig);
        break;
      case MODEL_PROVIDERS.OLLAMA:
        modelAdapter = new OllamaModelAdapter(modelConfig);
        break;
      default:
        throw new Error(`不支持的模型提供商: ${modelConfig.provider}`);
    }
    
    // 初始化模型
    try {
      await modelAdapter.initialize(options);
      
      // 缓存实例
      modelInstances.set(modelId, modelAdapter);
      
      return modelAdapter;
    } catch (error) {
      console.error(`初始化模型 ${modelId} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 清除模型缓存
   * @param {string} modelId - 特定模型ID，如果未提供则清除所有缓存
   */
  static clearModelCache(modelId = null) {
    if (modelId) {
      modelInstances.delete(modelId);
    } else {
      modelInstances.clear();
    }
  }
  
  /**
   * 设置用户首选模型
   * @param {string} modelId - 模型ID
   */
  static setPreferredModel(modelId) {
    if (!modelId) return;
    
    // 存储到localStorage
    localStorage.setItem('preferredModelId', modelId);
  }
  
  /**
   * 获取用户首选模型ID
   * @returns {string|null} - 首选模型ID
   */
  static getPreferredModelId() {
    return localStorage.getItem('preferredModelId') || null;
  }
} 