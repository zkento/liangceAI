// 测试PDF解析功能
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// 测试函数
async function testPDFParse(filePath) {
  console.log(`开始测试PDF解析: ${filePath}`);
  
  try {
    // 读取文件
    console.log(`读取文件...`);
    const dataBuffer = fs.readFileSync(filePath);
    console.log(`文件大小: ${(dataBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // 解析PDF
    console.log(`开始解析PDF...`);
    console.time('pdf-parse');
    const data = await pdfParse(dataBuffer);
    console.timeEnd('pdf-parse');
    
    // 输出结果
    console.log(`PDF页数: ${data.numpages}`);
    console.log(`提取的文本长度: ${data.text.length}`);
    console.log(`提取的文本前100个字符: ${data.text.substring(0, 100)}`);
    
    return data.text;
  } catch (error) {
    console.error(`PDF解析错误:`, error);
    throw error;
  }
}

// 如果有命令行参数，使用它作为文件路径
const filePath = process.argv[2] || path.join(__dirname, 'uploads', 'test.pdf');

// 执行测试
testPDFParse(filePath)
  .then(text => {
    console.log('测试成功!');
    // 将提取的文本写入文件以便检查
    const outputPath = path.join(__dirname, 'extracted-text.txt');
    fs.writeFileSync(outputPath, text);
    console.log(`提取的文本已保存到: ${outputPath}`);
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 