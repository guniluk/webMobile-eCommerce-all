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

  const onlineUrl = product.image || product.images?.[0];
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
    return { uri: onlineUrl };
  }

  const catKey = product.category?.toLowerCase() || '';
  if (CATEGORY_IMAGES[catKey]) {
    return CATEGORY_IMAGES[catKey];
  }
  return require('../assets/images/icon.png');
};
