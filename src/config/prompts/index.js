// 最后修改时间: 2024-06-05 22:45
const personalCredit = require('./personal-credit');
const businessCredit = require('./business-credit');
const propertyAdvice = require('./property-advice');
const financingAdvice = require('./financing-advice');
const followupChat = require('./followup-chat');

const promptsConfig = {
  'personal-credit': personalCredit,
  'business-credit': businessCredit,
  'property-advice': propertyAdvice,
  'financing-advice': financingAdvice,
  'followup-chat': followupChat
};

function getPromptConfig(chatType) {
  const config = promptsConfig[chatType];
  if (!config) {
    throw new Error(`未找到类型 ${chatType} 的提示词配置`);
  }
  return config;
}

module.exports = {
  promptsConfig,
  getPromptConfig
}; 