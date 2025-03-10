// 测试文件上传和文本提取功能
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// 测试函数
async function testFileUpload(filePath) {
  console.log(`开始测试文件上传: ${filePath}`);
  
  try {
    // 读取文件
    console.log(`读取文件...`);
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`文件大小: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(filePath),
      contentType: 'application/pdf'
    });
    formData.append('chatType', 'personal-credit');
    
    // 发送请求
    console.log(`发送请求到 /api/extract-text...`);
    console.time('extract-text');
    
    const response = await axios.post('http://127.0.0.1:3000/api/extract-text', formData, {
      headers: {
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60秒超时
    });
    
    console.timeEnd('extract-text');
    
    // 输出结果
    console.log(`响应状态: ${response.status}`);
    console.log(`响应数据:`, response.data);
    console.log(`提取的文本长度: ${response.data.text ? response.data.text.length : 0}`);
    
    if (response.data.text) {
      console.log(`提取的文本前100个字符: ${response.data.text.substring(0, 100)}`);
      
      // 将提取的文本写入文件以便检查
      const outputPath = path.join(__dirname, 'extracted-text.txt');
      fs.writeFileSync(outputPath, response.data.text);
      console.log(`提取的文本已保存到: ${outputPath}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`文件上传错误:`, error);
    if (error.response) {
      console.error(`响应状态: ${error.response.status}`);
      console.error(`响应数据:`, error.response.data);
    }
    throw error;
  }
}

// 如果有命令行参数，使用它作为文件路径
const filePath = process.argv[2] || path.join(__dirname, 'uploads', 'test.pdf');

// 执行测试
testFileUpload(filePath)
  .then(data => {
    console.log('测试成功!');
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 