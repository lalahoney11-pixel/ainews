// Vercel Serverless Function - 图片上传到阿里云 OSS
// 使用环境变量存储 OSS 密钥，安全且支持在线上传

import { createHmac } from 'crypto';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { file } = req.body;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    // 从环境变量读取 OSS 配置
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    const bucket = process.env.OSS_BUCKET || 'oss-pai-jthp4harhlmya8j0ax-cn-shanghai';
    const region = process.env.OSS_REGION || 'oss-cn-shanghai';
    const endpoint = process.env.OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com';

    if (!accessKeyId || !accessKeySecret) {
      res.status(500).json({ error: 'OSS configuration not found' });
      return;
    }

    // 解析 base64 图片
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const objectKey = `images/${timestamp}_${randomStr}.jpg`;

    // 生成 OSS 签名
    const date = new Date().toISOString();
    const policy = {
      expiration: new Date(Date.now() + 3600000).toISOString(),
      conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024],
        ['eq', '$key', objectKey]
      ]
    };

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = createHmac('sha1', accessKeySecret)
      .update(policyBase64)
      .digest('base64');

    // 构建 FormData 上传到 OSS
    const formData = new FormData();
    formData.append('key', objectKey);
    formData.append('OSSAccessKeyId', accessKeyId);
    formData.append('policy', policyBase64);
    formData.append('Signature', signature);
    formData.append('file', new Blob([buffer], { type: 'image/jpeg' }));

    const uploadUrl = `https://${bucket}.${endpoint}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OSS upload error:', errorText);
      throw new Error('OSS upload failed: ' + response.status);
    }

    // 构建图片 URL
    const imageUrl = `https://${bucket}.${endpoint}/${objectKey}`;
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
