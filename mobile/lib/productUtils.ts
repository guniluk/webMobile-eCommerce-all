import { ImageSourcePropType } from 'react-native';
import { Product } from '../types';

export const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  books: require('../assets/images/books.png'),
  electronics: require('../assets/images/electronics.png'),
  fashion: require('../assets/images/fashion.png'),
  home: require('../assets/images/home.png'),
  sports: require('../assets/images/sports.png'),
};

/**
 * 🔒 이미지 URL 포맷팅 유틸리티
 * - relative path(/uploads/...)를 API 서버 URL과 결합
 * - http:// -> https:// 강제 전환 (iOS ATS 및 모바일 보안 대응)
 * - 이미 이중 인코딩되었거나 Cloudinary 변환 문자가 깨지지 않도록 안전한 URI 인코딩 처리
 */
export const formatImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (
    !trimmed ||
    trimmed.includes('placeholder') ||
    trimmed.includes('via.placeholder')
  ) {
    return '';
  }

  // Base64 데이터 URL은 그대로 반환
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 상대 경로 (/uploads/...) 처리: API 서버 주소 붙이기
  if (trimmed.startsWith('/')) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    return `${cleanBase}${trimmed}`;
  }

  // http:// 로 시작하는 경우 iOS ATS 및 모바일 보안을 위해 https:// 로 변환
  let secureUrl = trimmed.replace(/^http:\/\//i, 'https://');

  // Cloudinary 및 일반 URL의 안전한 URI 인코딩 처리
  // (이중 인코딩 방지를 위해 decodeURI 후 encodeURI 적용)
  try {
    const decoded = decodeURI(secureUrl);
    secureUrl = encodeURI(decoded);
  } catch (e) {
    // decodeURI 실패시 변환된 secureUrl 그대로 사용
  }

  return secureUrl;
};

/**
 * 🖼️ 상품 객체에서 안전하게 ImageSourcePropType을 가져오는 함수
 */
export const getProductImageSource = (
  product?: Partial<Product> | null,
  failedImages: Record<string, boolean> = {},
): ImageSourcePropType => {
  if (!product) {
    return require('../assets/images/icon.png');
  }

  // 이미지 로드에 이미 실패한 상품이면 카테고리 기본 이미지로 바로 폴백
  if (product._id && failedImages[product._id]) {
    const catKey = product.category?.toLowerCase() || '';
    return CATEGORY_IMAGES[catKey] || require('../assets/images/icon.png');
  }

  // 1. 유효한 온라인 이미지 URL 찾기 (images 배열 또는 image 필드)
  let onlineUrl = '';
  if (Array.isArray(product.images) && product.images.length > 0) {
    onlineUrl =
      product.images.find(
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

  // 2. URL 포맷팅 적용
  const formattedUrl = formatImageUrl(onlineUrl);

  if (formattedUrl) {
    return { uri: formattedUrl };
  }

  // 3. 포맷팅 가능한 URL이 없는 경우 카테고리 에셋으로 폴백
  const catKey = product.category?.toLowerCase() || '';
  if (CATEGORY_IMAGES[catKey]) {
    return CATEGORY_IMAGES[catKey];
  }
  return require('../assets/images/icon.png');
};
