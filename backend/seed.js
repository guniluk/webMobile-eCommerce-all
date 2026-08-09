import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './src/models/product.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI가 설정되지 않았습니다.');
  process.exit(1);
}

const sampleProducts = [
  // 📚 1. Books (도서 5개)
  {
    name: '클린 코드 (Clean Code)',
    description: '애자일 소프트웨어 혁명과 애자일 소프트웨어 개발 기법을 적용한 깨끗한 코드 작성법 가이드.',
    price: 33000,
    stock: 50,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '리팩터링 2판 (Refactoring)',
    description: '코드 구조를 안전하게 개선하는 체계적인 리팩터링 카탈로그와 명확한 가이드라인.',
    price: 35000,
    stock: 45,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '자바스크립트 완벽 가이드',
    description: '자바스크립트 프로그래밍 언어의 모든 핵심과 바닐라 JS 최신 명세 해설.',
    price: 45000,
    stock: 30,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: 'Do it! 점프 투 파이썬',
    description: '초보자도 쉽고 빠르게 쉽게 배우는 실전 파이썬 프로그래밍 베스트셀러.',
    price: 22000,
    stock: 60,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '객체지향의 사실과 오해',
    description: '역할, 책임, 협력 관점에서 바라보는 객체지향 프로그래밍의 정수.',
    price: 20000,
    stock: 40,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80'],
  },

  // 🎧 2. Electronics (전자제품 5개)
  {
    name: '노이즈 캔슬링 무선 헤드폰',
    description: '프리미엄 노이즈 캔슬링과 하이레조 음질을 제공하는 몰입형 아웃도어 헤드폰.',
    price: 299000,
    stock: 25,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '스마트 울트라 워치 Series 9',
    description: '심박수, 운동 추적, GPS 및 혈중 산소 측정을 지원하는 프리미엄 스마트워치.',
    price: 499000,
    stock: 20,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '4K HDR IPS 커브드 모니터',
    description: '넓은 생동감 넘치는 색감과 몰입감 뛰어난 초고화질 34인치 가로 커브드 디스플레이.',
    price: 420000,
    stock: 15,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '기계식 게이밍 RGB 키보드',
    description: '타건감이 뛰어난 적축 스위치와 커스텀 RGB 조명을 지원하는 체리형 메카니컬 키보드.',
    price: 129000,
    stock: 35,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '고속 충전 맥세이프 보조배터리',
    description: '10,000mAh 대용량 무선 자력 결착형 15W 맥세이프 초고속 보조배터리.',
    price: 49000,
    stock: 80,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'],
  },

  // 👕 3. Fashion (패션 5개)
  {
    name: '프레시 오버핏 후드 티셔츠',
    description: '부드러운 100% 헤비 코튼 원단으로 착용감이 뛰어난 데일리 스타일 오버핏 후드.',
    price: 59000,
    stock: 50,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '프리미엄 데님 자켓',
    description: '빈티지한 인디고 워싱과 세련된 워크웨어 트렌드를 접목한 데님 자켓.',
    price: 89000,
    stock: 30,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '클래식 슬림핏 와이드 슬랙스',
    description: '찰랑거리는 스판 혼방 소재로 다리가 길어보이는 트렌디 와이드 실루엣 팬츠.',
    price: 49000,
    stock: 65,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '어반 트렌디 러닝 스니커즈',
    description: '충격 흡수 쿠셔닝 아웃솔과 통기성 핏이 결합된 시크 데일리 운동화.',
    price: 119000,
    stock: 40,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '100% 캐시미어 미니멀 머플러',
    description: '극강의 부드러움과 따뜻한 체온을 지켜주는 프리미엄 순모 캐시미어 머플러.',
    price: 69000,
    stock: 45,
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=80'],
  },

  // 🏡 4. Home (홈/인테리어 5개)
  {
    name: '미니멀 스마트 무드등 조명',
    description: '터치 및 터치 드래그로 조도와 색온도를 세밀하게 조절할 수 있는 차분한 침실 스탠드.',
    price: 39000,
    stock: 40,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '프리미엄 호텔식 메모리폼 베개',
    description: '경추 곡선을 유연하게 받쳐주어 수면 경추 통증을 개선해주는 고밀도 메모리폼.',
    price: 45000,
    stock: 55,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '자동 감지 스마트 에어클리너',
    description: 'H13 등급 헤파필터 탑재로 초미세먼지를 99.97% 제거해주는 360도 공기청정기.',
    price: 189000,
    stock: 20,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '네스프레소 캡슐 커피머신',
    description: '원터치 19바 고압 펌프로 홈카페풍Rich 아로마 크레마 추출을 지원하는 컴팩트 커피머신.',
    price: 149000,
    stock: 30,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1517668808822-9e428824603b?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1517668808822-9e428824603b?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '친환경 아로마 디퓨저 세트',
    description: '천연 아로마 오일 추출물로 깊고 편안한 힐링 향기를 전해주는 프리미엄 디퓨저.',
    price: 29000,
    stock: 70,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'],
  },

  // ⚽ 5. Sports (스포츠 5개)
  {
    name: '고탄성 넌슬립 요가 매트 10mm',
    description: '쿠션감이 뛰어나고 충격을 흡수해 홈트레이닝에 최적화된 고급 TPE 요가매트.',
    price: 32000,
    stock: 50,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '프로패셔널 라텍스 핑거 덤벨 5kg',
    description: '손에 감기는 미끄럼 방지 네오프렌 코팅이 처리된 근력 운동용 패밀리 덤벨 세트.',
    price: 28000,
    stock: 45,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '경량 아웃도어 트레킹 등산 스틱',
    description: '초경량 초강도 두랄루민 소재로 무릎 부담을 줄여주는 인체공학 등산용 스틱.',
    price: 48000,
    stock: 35,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '카본 프리미엄 배드민턴 라켓 세트',
    description: '경량 카본 소재와 고탄력 셔틀콕이 세트로 포함된 토너먼트급 배드민턴 라켓.',
    price: 79000,
    stock: 30,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=600&q=80'],
  },
  {
    name: '고성능 에어 카운터 줄줄이 줄넘기',
    description: '자동 회전수 및 칼로리 소모량이 측정되는 디지털 인텔리전스 스마트 줄넘기.',
    price: 15000,
    stock: 80,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=600&q=80'],
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 MongoDB 데이터베이스 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공!');

    // 기존 상품 데이터 삭제 후 새로 시드 (카테고리별 5개씩 총 25개)
    console.log('🧹 기존 상품 데이터 삭제 중...');
    await Product.deleteMany({});
    console.log('✅ 기존 상품 삭제 완료!');

    console.log('📦 5개 카테고리별 5개씩 총 25개 상품 데이터 삽입 중...');
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`🎉 성공적으로 ${inserted.length}개의 상품을 DB에 저장했습니다!`);

    // 카테고리별 개수 검증 출력
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    console.log('📊 카테고리별 저장 결과:');
    counts.forEach((c) => {
      console.log(`   - ${c._id}: ${c.count}개`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 시드 실패:', error);
    process.exit(1);
  }
}

seedDatabase();
