// 最后修改记录时间 -> 2025-04-15 16:55

/**
 * 基础模型适配器接口
 * 所有模型适配器必须实现此接口
 */
export default class BaseModelAdapter {
  /**
   * 构造函数
   * @param {Object} config - 模型配置
   */
  constructor(config) {
    this.config = config;
    this.initialized = false;
  }

  /**
   * 初始化模型
   * @param {Object} options - 初始化选项
   * @returns {Promise<boolean>} - 是否初始化成功
   */
  async initialize(options = {}) {
    throw new Error('子类必须实现initialize方法');
  }

  /**
   * 聊天功能
   * @param {Array} messages - 消息列表（包含role和content）
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - 响应结果
   */
  async chat(messages, options = {}) {
    throw new Error('子类必须实现chat方法');
  }

  /**
   * 生成文本
   * @param {string} prompt - 提示词
   * @param {Object} options - 请求选项
   * @returns {Promise<string>} - 生成的文本
   */
  async generateText(prompt, options = {}) {
    throw new Error('子类必须实现generateText方法');
  }

  /**
   * 检查模型是否可用
   * @returns {Promise<boolean>} - 是否可用
   */
  async isAvailable() {
    throw new Error('子类必须实现isAvailable方法');
  }

  /**
   * 获取模型信息
   * @returns {Object} - 模型信息
   */
  getModelInfo() {
    return this.config;
  }

  /**
   * 统一错误处理
   * @param {Error} error - 错误对象
   * @returns {Object} - 标准化的错误信息
   */
  handleError(error) {
    return {
      success: false,
      error: error.message || '未知错误',
      details: error.details || {},
      status: error.status || 500
    };
  }
} 