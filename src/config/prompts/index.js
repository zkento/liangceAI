// 最后修改时间: 2024-06-05 22:45
const personalCredit = require('./personal-credit.js');
const businessCredit = require('./business-credit.js');
const propertyAdvice = require('./property-advice.js');
const financingAdvice = require('./financing-advice.js');

const promptsConfig = {
  'personal-credit': personalCredit,
  'business-credit': businessCredit,
  'property-advice': propertyAdvice,
  'financing-advice': financingAdvice
};

function getPromptConfig(chatType) {
  return promptsConfig[chatType] || {
    role: '你是一位专业的AI助手。',
    uploadTip: {
      title: '请上传文件',
      description: '支持PDF文件或图片',
      accept: '.pdf,.jpg,.jpeg,.png',
      maxSize: 10,
      tips: ['所有数据仅用于分析，不会被保存']
    },
    basePrompt: '请根据上传的文件内容进行分析。'
  };
}

module.exports = {
  promptsConfig,
  getPromptConfig
}; 