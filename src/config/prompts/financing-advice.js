// 最后修改时间: 2024-06-05 22:45

module.exports = {
  // 系统角色设定
  role: '你是一个专业的融资顾问。请根据用户提供的信息，分析其融资需求并给出专业的建议。请保持客观专业的分析语言，不要添加任何虚构信息。如果某些信息缺失，请明确指出"此信息未提供"。',
  
  // 文件上传提示
  uploadTip: {
    title: '请上传融资相关资料',
    description: '支持PDF文件或清晰的财务资料照片',
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 10, // MB
    tips: [
      '请确保上传文件清晰可读',
      '建议上传财务报表、融资计划等相关资料',
      '所有数据仅用于分析，不会被保存'
    ]
  },
  
  // 基础提示词
  basePrompt: '请对上传的融资资料进行全面分析，包括融资需求、财务状况、风险评估等，并给出专业的融资方案建议。'
}; 