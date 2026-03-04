// Vercel Serverless Function - 图片上传到 Cloudinary
// Cloudinary 提供免费额度，稳定可靠

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

    // 解析 base64 图片
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    
    // 使用 Cloudinary 的 unsigned upload preset
    // 这个 preset 需要在 Cloudinary 控制台创建，设置为允许 unsigned upload
    const cloudName = 'dymvx6qdl'; // 使用示例 cloud name
    const uploadPreset = 'ml_default';
    
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64Data}`);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary error:', errorText);
      throw new Error('Cloudinary upload failed');
    }

    const data = await response.json();
    res.status(200).json({ url: data.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
