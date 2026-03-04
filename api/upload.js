// Vercel Serverless Function - 图片上传代理
// 解决前端跨域问题

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 使用 file.io 上传
    const formData = new FormData();
    
    // 获取上传的文件
    const { file } = req.body;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    // 将 base64 转换回文件
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 创建 Blob
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');

    // 上传到 file.io
    const response = await fetch('https://file.io', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    res.status(200).json({ url: data.link });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
