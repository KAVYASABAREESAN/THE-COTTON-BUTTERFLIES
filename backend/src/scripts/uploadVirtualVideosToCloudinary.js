require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const repoRoot = path.resolve(__dirname, '../../..');

const videoFiles = [
  'frontend/media/media_E7B877DF_F17E_BFDB_41D2_8F8EC283B0C6_en.mp4',
  'frontend/media/media_E7BA925A_F17E_9024_41C7_F3484DA811BA_en.mp4',
  'frontend/media/media_E8A00A3D_F17E_905C_41DA_B0415DF55474_en.mp4'
];

const localeFiles = [
  'frontend/locale/en.txt',
  'frontend/public/virtual-video/locale/en.txt'
];

const folder = 'the-cotton-butterflies/videos';

const replaceAll = (content, replacements) => {
  let next = content;
  for (const [from, to] of replacements.entries()) {
    next = next.split(from).join(to);
  }
  return next;
};

const uploadVideo = async (relativePath) => {
  const absolutePath = path.resolve(repoRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Video file not found: ${relativePath}`);
  }

  const fileName = path.basename(relativePath);
  const publicId = fileName.replace(/\.mp4$/i, '');

  const result = await cloudinary.uploader.upload(absolutePath, {
    resource_type: 'video',
    folder,
    public_id: publicId,
    overwrite: true,
    invalidate: true
  });

  return result.secure_url;
};

const updateLocaleFiles = (replacements) => {
  for (const relativePath of localeFiles) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    const current = fs.readFileSync(absolutePath, 'utf8');
    const updated = replaceAll(current, replacements);

    if (current !== updated) {
      fs.writeFileSync(absolutePath, updated, 'utf8');
      console.log(`Updated ${relativePath}`);
    } else {
      console.log(`No changes needed in ${relativePath}`);
    }
  }
};

const main = async () => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
    );
  }

  const replacements = new Map();

  for (const relativePath of videoFiles) {
    console.log(`Uploading ${relativePath}...`);
    const url = await uploadVideo(relativePath);
    replacements.set(`media/${path.basename(relativePath)}`, url);
    console.log(`Uploaded ${path.basename(relativePath)} -> ${url}`);
  }

  updateLocaleFiles(replacements);
  console.log('Cloudinary video upload complete.');
};

main().catch((error) => {
  console.error('Video upload failed:', error.message);
  process.exit(1);
});
