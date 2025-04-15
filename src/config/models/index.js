// 最后修改记录时间 -> 2025-04-15 16:52

/**
 * AI模型配置文件
 * 此文件定义了系统支持的所有AI模型及其配置信息
 */

// 模型类型枚举
export const MODEL_TYPES = {
  CLOUD: 'cloud',    // 云端API
  LOCAL: 'local'     // 本地部署
};

// 模型提供商枚举
export const MODEL_PROVIDERS = {
  DEEPSEEK: 'deepseek',
  OLLAMA: 'ollama'
};

// 默认模型ID
export const DEFAULT_MODEL_ID = 'deepseek-chat';

// 支持的模型列表
export const SUPPORTED_MODELS = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: '云端DeepSeek大模型服务',
    provider: MODEL_PROVIDERS.DEEPSEEK,
    type: MODEL_TYPES.CLOUD,
    apiEndpoint: 'https://api.deepseek.com/v1',
    contextLength: 16000,
    defaultParams: {
      temperature: 0.3,
      max_tokens: 2000
    },
    tags: ['默认', '中文优化']
  },
  {
    id: 'gemma3-12b',
    name: 'Gemma 3 (12B)',
    description: '本地部署的Google Gemma 3模型（12B参数）',
    provider: MODEL_PROVIDERS.OLLAMA,
    type: MODEL_TYPES.LOCAL,
    apiEndpoint: 'http://localhost:11434/api',
    contextLength: 8000,
    modelIdentifier: 'gemma3:12b',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 1500
    },
    tags: ['本地', '开源']
  },
  {
    id: 'gemma3-4b',
    name: 'Gemma 3 (4B)',
    description: '本地部署的Google Gemma 3模型（4B参数）',
    provider: MODEL_PROVIDERS.OLLAMA,
    type: MODEL_TYPES.LOCAL,
    apiEndpoint: 'http://localhost:11434/api',
    contextLength: 8000,
    modelIdentifier: 'gemma3:4b',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 1500
    },
    tags: ['本地', '开源', '轻量']
  }
];

/**
 * 获取指定ID的模型配置
 * @param {string} modelId - 模型ID
 * @returns {Object|null} - 模型配置或null
 */
export function getModelById(modelId) {
  return SUPPORTED_MODELS.find(model => model.id === modelId) || null;
}

/**
 * 获取所有支持的模型
 * @returns {Array} - 模型配置数组
 */
export function getAllModels() {
  return [...SUPPORTED_MODELS];
}

/**
 * 获取默认模型
 * @returns {Object} - 默认模型配置
 */
export function getDefaultModel() {
  return getModelById(DEFAULT_MODEL_ID);
}

/**
 * 检查模型是否可用
 * @param {string} modelId - 模型ID
 * @returns {Promise<boolean>} - 是否可用
 */
export async function isModelAvailable(modelId) {
  const model = getModelById(modelId);
  if (!model) return false;
  
  // TODO: 实现模型可用性检查
  return true;
} 