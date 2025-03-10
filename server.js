// 最后修改记录时间 -> 2024-06-05 17:35

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// 导入本地文档处理服务
const { extractTextFromPDF, extractTextFromImage } = require('./src/api/documentService');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许PDF和图片
const fileFilter = function(req, file, cb) {
  // 检查文件类型
  if (file.mimetype.includes('pdf') || file.mimetype.includes('image')) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，只接受PDF和图片文件'), false);
  }
};

// 配置multer，增加文件大小限制
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// 错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer错误:', err);
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: '文件大小超过限制（20MB）'
      });
    }
    return res.status(400).json({
      success: false,
      error: `文件上传错误: ${err.message}`
    });
  } else if (err) {
    console.error('其他错误:', err);
    // 其他错误
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
  next();
};

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 设置全局超时
app.use((req, res, next) => {
  // 设置请求超时时间为5分钟
  req.setTimeout(300000);
  // 设置响应超时时间为5分钟
  res.setTimeout(300000);
  next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 上传文件接口
app.post('/api/upload', upload.single('file'), handleMulterError, async (req, res) => {
  // 设置更长的请求超时时间
  req.setTimeout(180000); // 3分钟超时
  res.setTimeout(180000); // 3分钟超时
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: '未找到文件', 
        message: {
          role: 'assistant',
          content: '很抱歉，未能接收到您上传的文件。请重新上传。'
        }
      });
    }
    
    const file = req.file;
    const filePath = file.path;
    const fileName = file.originalname;
    const fileType = file.mimetype;
    const chatType = req.body.chatType || 'default';
    
    console.log(`接收到文件上传请求: ${fileName}, 类型: ${fileType}, 聊天类型: ${chatType}`);
    console.log(`文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    let extractedText = '';
    
    // 提取文件内容
    if (fileType.includes('pdf')) {
      try {
        // 使用PDF解析器提取文本
        const { extractTextFromPDF, postProcessChineseText } = require('./src/api/documentService');
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(filePath);
        
        console.log(`开始从PDF文件 ${fileName} 提取文本...`);
        extractedText = await extractTextFromPDF(fileBuffer, fileName);
        // 应用中文文本后处理
        extractedText = postProcessChineseText(extractedText);
        console.log(`成功提取PDF文本，长度: ${extractedText.length}`);
      } catch (error) {
        console.error('PDF解析错误:', error);
        return res.status(500).json({ 
          error: `无法提取PDF文件内容: ${error.message}`, 
          message: {
            role: 'assistant',
            content: `很抱歉，无法提取PDF文件内容。错误信息: ${error.message}`
          }
        });
      }
    } else if (fileType.includes('image')) {
      try {
        // 使用OCR提取图片文本
        const { extractTextFromImage, postProcessChineseText } = require('./src/api/documentService');
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(filePath);
        
        console.log(`开始从图片 ${fileName} 提取文本...`);
        extractedText = await extractTextFromImage(fileBuffer, fileName);
        // 应用中文文本后处理
        extractedText = postProcessChineseText(extractedText);
        console.log(`成功提取图片文本，长度: ${extractedText.length}`);
      } catch (error) {
        console.error('图片OCR错误:', error);
        return res.status(500).json({ 
          error: `无法提取图片文件内容: ${error.message}`, 
          message: {
            role: 'assistant',
            content: `很抱歉，无法提取图片文件内容。错误信息: ${error.message}`
          }
        });
      }
    } else {
      return res.status(400).json({ 
        error: '不支持的文件类型，仅支持PDF文件', 
        message: {
          role: 'assistant',
          content: '很抱歉，系统仅支持PDF格式的文件。请重新上传正确格式的文件。'
        }
      });
    }
    
    // 清理临时文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`临时文件已删除: ${filePath}`);
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }
    
    // 获取提示词配置
    const promptConfig = getPromptConfigForType(chatType);
    
    // 构建发送给DeepSeek的提示词
    const systemPrompt = promptConfig.systemPrompt || '你是一个专业的分析师';
    // 使用basePrompt作为用户提示词的基础，如果存在的话
    const basePrompt = promptConfig.basePrompt || '';
    const userPrompt = basePrompt 
      ? `${basePrompt}\n\n以下是需要分析的内容:\n\n${extractedText}`
      : `请分析以下内容:\n\n${extractedText}`;
    
    try {
      console.log('开始调用DeepSeek API进行分析...');
      
      // 调用DeepSeek API
      const deepseekResponse = await axios.post(`${DEEPSEEK_API_URL}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      });
      
      // 提取DeepSeek的回复
      const aiResponse = deepseekResponse.data.choices[0].message.content;
      
      console.log('成功获取AI分析结果');
      
      // 返回文件信息和分析结果
      res.json({
        success: true,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          path: req.file.path,
          size: req.file.size
        },
        message: {
          role: 'assistant',
          content: aiResponse
        }
      });
    } catch (error) {
      console.error('AI分析失败:', error);
      
      // 如果API调用失败，返回错误信息
      res.status(500).json({ 
        error: 'AI分析失败', 
        details: error.message,
        message: {
          role: 'assistant',
          content: `很抱歉，AI分析过程中出现错误: ${error.message}。请稍后重试或联系系统管理员。`
        }
      });
    }
  } catch (error) {
    console.error('文件上传处理错误:', error);
    res.status(500).json({ 
      error: '文件上传失败', 
      details: error.message,
      message: {
        role: 'assistant',
        content: `文件上传处理过程中出现错误: ${error.message}。请稍后重试或联系系统管理员。`
      }
    });
  }
});

// 获取提示词配置
function getPromptConfigForType(chatType) {
  try {
    // 从配置文件中获取提示词配置
    const { getPromptConfig } = require('./src/config/prompts/index.js');
    const config = getPromptConfig(chatType);
    
    if (!config) {
      throw new Error(`未找到类型 ${chatType} 的提示词配置`);
    }
    
    return {
      systemPrompt: config.role,
      basePrompt: config.basePrompt
    };
  } catch (error) {
    console.error('加载提示词配置失败:', error);
    throw error; // 向上抛出错误，而不是使用默认配置
  }
}

// 聊天接口
app.post('/api/chat', async (req, res) => {
  // 设置更长的请求超时时间
  req.setTimeout(180000); // 3分钟超时
  res.setTimeout(180000); // 3分钟超时
  
  try {
    const { messages, chatType } = req.body;
    
    console.log(`接收到聊天请求，聊天类型: ${chatType}`);
    console.log(`消息数量: ${messages ? messages.length : 0}`);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '消息格式不正确' });
    }
    
    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!lastUserMessage) {
      return res.status(400).json({ error: '没有找到用户消息' });
    }
    
    // 获取提示词配置
    const promptConfig = getPromptConfigForType(chatType || 'default');
    
    // 构建发送给DeepSeek的消息
    const deepseekMessages = [
      {
        role: 'system',
        content: promptConfig.systemPrompt
      },
      ...messages
    ];
    
    try {
      console.log('开始调用DeepSeek API进行聊天...');
      console.log(`用户最后一条消息长度: ${lastUserMessage.content.length}`);
      
      // 设置axios请求超时
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 120000 // 2分钟超时
      };
      
      // 调用DeepSeek API
      const deepseekResponse = await axios.post(`${DEEPSEEK_API_URL}/chat/completions`, {
        model: 'deepseek-chat',
        messages: deepseekMessages,
        temperature: 0.3,
        max_tokens: 2000
      }, axiosConfig);
      
      // 提取DeepSeek的回复
      const aiResponse = deepseekResponse.data.choices[0].message.content;
      
      console.log('成功获取AI回复');
      console.log(`AI回复长度: ${aiResponse.length}`);
      
      // 返回AI回复
      res.json({
        message: {
          role: 'assistant',
          content: aiResponse
        }
      });
    } catch (error) {
      console.error('聊天请求处理错误:', error);
      
      let errorMessage = error.message || '未知错误';
      let statusCode = 500;
      
      // 处理不同类型的错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'AI服务响应超时，请稍后重试或尝试发送更简短的消息';
        statusCode = 504;
      } else if (error.response) {
        // 服务器返回了错误状态码
        statusCode = error.response.status;
        errorMessage = `AI服务返回错误 (${statusCode}): ${error.response.data?.error || error.message}`;
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '无法连接到AI服务，请检查网络连接或稍后重试';
        statusCode = 503;
      }
      
      // 如果API调用失败，返回错误信息
      res.status(statusCode).json({ 
        error: '聊天请求失败', 
        details: errorMessage,
        message: {
          role: 'assistant',
          content: `很抱歉，处理您的请求时出现错误: ${errorMessage}。请稍后重试或联系系统管理员。`
        }
      });
    }
  } catch (error) {
    console.error('聊天请求处理错误:', error);
    res.status(500).json({ 
      error: '聊天请求失败', 
      details: error.message,
      message: {
        role: 'assistant',
        content: `聊天请求处理过程中出现错误: ${error.message}。请稍后重试或联系系统管理员。`
      }
    });
  }
});

// 添加PDF文本提取API端点
app.post('/api/extract-text', upload.single('file'), handleMulterError, async (req, res) => {
  console.log('收到文件上传请求');
  // 设置更长的请求超时时间
  req.setTimeout(300000); // 5分钟超时
  res.setTimeout(300000); // 5分钟超时
  
  try {
    if (!req.file) {
      console.error('未找到文件');
      return res.status(400).json({ success: false, error: '未找到文件' });
    }

    const file = req.file;
    const filePath = file.path;
    const fileName = file.originalname;
    const fileType = file.mimetype;
    
    console.log(`开始处理文件:
      文件名: ${fileName}
      类型: ${fileType}
      大小: ${(file.size / 1024 / 1024).toFixed(2)}MB
      临时路径: ${filePath}
    `);
    
    let extractedText = '';
    
    if (fileType.includes('pdf')) {
      try {
        console.log('开始读取PDF文件...');
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`文件读取成功，大小: ${fileBuffer.length} 字节`);
        
        console.log('开始解析PDF...');
        console.time('pdf-parse');
        extractedText = await extractTextFromPDF(fileBuffer, fileName);
        console.timeEnd('pdf-parse');
        
        console.log(`PDF解析完成，提取文本长度: ${extractedText.length}`);
      } catch (pdfError) {
        console.error('PDF处理错误:', pdfError);
        throw new Error(`PDF处理失败: ${pdfError.message}`);
      }
    } else {
      throw new Error('不支持的文件类型，仅支持PDF文件');
    }
    
    // 清理临时文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`临时文件已删除: ${filePath}`);
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }
    
    // 返回提取的文本
    console.log(`准备返回提取的文本，长度: ${extractedText.length}`);
    res.json({
      success: true,
      text: extractedText
    });
    console.log('文本提取API请求完成');
    
  } catch (error) {
    console.error('文本提取错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '文本提取失败'
    });
  }
});

// API路由
app.get('/api/test', (req, res) => {
  res.json({ message: 'API服务器正常运行' });
});

// 所有其他请求返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 