// 最后修改记录时间 -> 2025-04-15 17:20

/**
 * 模型适配器模块入口文件
 * 导出所有模型适配器和工厂类
 */

import BaseModelAdapter from './baseModel';
import DeepSeekModelAdapter from './deepseekModel';
import OllamaModelAdapter from './ollamaModel';
import ModelFactory from './modelFactory';
import { MODEL_PROVIDERS } from '@/config/models';

/**
 * 统一的聊天API函数
 * @param {Array} messages - 消息列表
 * @param {Object} options - 请求选项，包括modelId
 * @returns {Promise<Object>} - 响应结果
 */
export async function chat(messages, options = {}) {
  try {
    const { modelId, ...otherOptions } = options;
    
    // 获取模型适配器
    const modelAdapter = await ModelFactory.getModelAdapter(modelId);
    
    // 调用模型的聊天功能
    return await modelAdapter.chat(messages, otherOptions);
  } catch (error) {
    console.error('聊天请求失败:', error);
    return {
      success: false,
      error: error.message || '聊天请求失败',
      message: {
        role: 'assistant',
        content: `很抱歉，处理您的请求时出现错误: ${error.message || '未知错误'}。请稍后重试或联系系统管理员。`
      }
    };
  }
}

/**
 * 统一的文本生成API函数
 * @param {string} prompt - 提示词
 * @param {Object} options - 请求选项，包括modelId
 * @returns {Promise<Object>} - 响应结果
 */
export async function generateText(prompt, options = {}) {
  try {
    const { modelId, ...otherOptions } = options;
    
    // 获取模型适配器
    const modelAdapter = await ModelFactory.getModelAdapter(modelId);
    
    // 调用模型的文本生成功能
    return await modelAdapter.generateText(prompt, otherOptions);
  } catch (error) {
    console.error('文本生成请求失败:', error);
    return {
      success: false,
      error: error.message || '文本生成请求失败',
      data: `生成文本时出现错误: ${error.message || '未知错误'}`
    };
  }
}

/**
 * 获取当前首选模型信息
 * @returns {Promise<Object>} - 模型信息
 */
export async function getCurrentModel() {
  try {
    const modelId = ModelFactory.getPreferredModelId();
    const modelAdapter = await ModelFactory.getModelAdapter(modelId);
    return {
      success: true,
      model: modelAdapter.getModelInfo()
    };
  } catch (error) {
    console.error('获取当前模型信息失败:', error);
    return {
      success: false,
      error: error.message || '获取当前模型信息失败'
    };
  }
}

/**
 * 切换模型
 * @param {string} modelId - 新模型ID
 * @returns {Promise<Object>} - 结果
 */
export async function switchModel(modelId) {
  try {
    // 确保模型存在且可用
    const modelAdapter = await ModelFactory.getModelAdapter(modelId);
    const isAvailable = await modelAdapter.isAvailable();
    
    if (!isAvailable) {
      throw new Error(`模型 ${modelId} 不可用`);
    }
    
    // 设置为首选模型
    ModelFactory.setPreferredModel(modelId);
    
    return {
      success: true,
      model: modelAdapter.getModelInfo(),
      message: `已切换到模型: ${modelAdapter.getModelInfo().name}`
    };
  } catch (error) {
    console.error('切换模型失败:', error);
    return {
      success: false,
      error: error.message || '切换模型失败'
    };
  }
}

// 导出所有模块
export {
  BaseModelAdapter,
  DeepSeekModelAdapter,
  OllamaModelAdapter,
  ModelFactory,
  MODEL_PROVIDERS
}; 