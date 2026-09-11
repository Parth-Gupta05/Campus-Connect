const cloudinary = require('cloudinary').v2;

const extractCloudinaryInfo = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Example url: https://res.cloudinary.com/demo/image/upload/v1312461204/folder/sample.jpg
  // Or: https://res.cloudinary.com/demo/raw/upload/v123123/resumes/file.pdf
  
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return null;
  
  let resourceType = 'image';
  if (url.includes('/raw/upload/')) resourceType = 'raw';
  else if (url.includes('/video/upload/')) resourceType = 'video';
  else if (url.includes('/image/upload/')) resourceType = 'image';

  let pathAfterUpload = url.substring(uploadIndex + 8);
  
  // Remove version (e.g. v1234567890/)
  if (pathAfterUpload.match(/^v\d+\//)) {
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
  }
  
  // Remove extension (Cloudinary public_id for images/videos typically doesn't include extension, for raw it often does)
  if (resourceType !== 'raw') {
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }
  }

  return { publicId: pathAfterUpload, resourceType };
};

const deleteCloudinaryAsset = async (url) => {
  try {
    const info = extractCloudinaryInfo(url);
    if (!info) return;

    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }

    await cloudinary.uploader.destroy(info.publicId, { resource_type: info.resourceType });
    console.log(`Deleted Cloudinary asset: ${info.publicId} (${info.resourceType})`);
  } catch (error) {
    console.error('Error deleting Cloudinary asset:', error);
  }
};

module.exports = {
  extractCloudinaryInfo,
  deleteCloudinaryAsset
};
