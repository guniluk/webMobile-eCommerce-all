import { ImageSourcePropType } from 'react-native';
import { Product } from '../types';

export const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  books: require('../assets/images/books.png'),
  electronics: require('../assets/images/electronics.png'),
  fashion: require('../assets/images/fashion.png'),
  home: require('../assets/images/home.png'),
  sports: require('../assets/images/sports.png'),
};

export const getProductImageSource = (
  product: Product,
  failedImages: Record<string, boolean> = {},
): ImageSourcePropType => {
  if (failedImages[product._id]) {
    const catKey = product.category?.toLowerCase() || '';
    return CATEGORY_IMAGES[catKey] || require('../assets/images/icon.png');
  }

  // 1. 유효한 온라인 이미지 URL 찾기 (images 배열 또는 image 필드)
  let onlineUrl = '';
  if (Array.isArray(product.images) && product.images.length > 0) {
    onlineUrl = product.images.find(
      (img) =>
        img &&
        typeof img === 'string' &&
        img.trim() !== '' &&
        !img.includes('placeholder'),
    ) || '';
  }
  if (!onlineUrl && product.image) {
    onlineUrl = product.image;
  }

  if (
    onlineUrl &&
    typeof onlineUrl === 'string' &&
    onlineUrl.trim() !== '' &&
    !onlineUrl.includes('placeholder') &&
    !onlineUrl.includes('via.placeholder') &&
    (onlineUrl.startsWith('http://') ||
      onlineUrl.startsWith('https://') ||
      onlineUrl.startsWith('data:'))
  ) {
    // 🔒 iOS ATS 및 모바일 보안을 위해 http:// -> https:// 강제 전환
    const secureUrl = onlineUrl.replace(/^http:\/\//i, 'https://');
    return { uri: encodeURI(secureUrl) };
  }

  const catKey = product.category?.toLowerCase() || '';
  if (CATEGORY_IMAGES[catKey]) {
    return CATEGORY_IMAGES[catKey];
  }
  return require('../assets/images/icon.png');
};
