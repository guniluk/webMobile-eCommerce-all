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
 * - http:// -> https:// 강제 전환 (iOS ATS 및 Expo Go 모바일 보안 대응)
 * - Cloudinary URL(cloudinary.com)은 이미 올바른 URL 형태이므로 훼손 없이 https 안전 전환 후 즉시 반환
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

  // http:// 로 시작하는 경우 Expo Go / iOS ATS 보안을 위해 https:// 로 변환
  let secureUrl = trimmed.replace(/^http:\/\//i, 'https://');

  // Cloudinary CDN URL은 변형 없이 https 전환본 그대로 반환
  if (secureUrl.includes('cloudinary.com')) {
    return secureUrl;
  }

  // 기타 일반 외부 URL 안전 URI 인코딩 처리
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

  // 1. 단일 image 필드가 지정된 경우 (상세 모달 슬라이더 등) 최우선 선택
  let selectedUrl = '';
  if (
    product.image &&
    typeof product.image === 'string' &&
    product.image.trim() !== '' &&
    !product.image.includes('placeholder')
  ) {
    selectedUrl = product.image;
  }

  // 2. images 배열에서 유효한 URL 탐색 (image 필드가 없는 경우)
  if (
    !selectedUrl &&
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    selectedUrl =
      product.images.find(
        (img) =>
          img &&
          typeof img === 'string' &&
          img.trim() !== '' &&
          !img.includes('placeholder'),
      ) || '';
  }

  // 3. URL 포맷팅 적용
  const formattedUrl = formatImageUrl(selectedUrl);

  // 이미지 로드 실패 기록이 없고, 유효한 포맷팅 URL이 존재하는 경우 해당 URI 반환
  if (formattedUrl && (!product._id || !failedImages[product._id])) {
    return { uri: formattedUrl };
  }

  // 4. 실패했거나 URL이 없는 경우 카테고리 에셋으로 폴백
  const catKey = product.category?.toLowerCase() || '';
  if (CATEGORY_IMAGES[catKey]) {
    return CATEGORY_IMAGES[catKey];
  }
  return require('../assets/images/icon.png');
};
