/**
 * 첫 글자를 대문자로 변환
 * @param {string} str
 * @returns {string}
 */
export const capitalizeText = (str) => {
  if (!str) return "";
  const stringVal = String(str);
  return stringVal.charAt(0).toUpperCase() + stringVal.slice(1);
};

/**
 * 날짜 포맷팅 (기본: ko-KR YYYY. MM. DD.)
 * Invalid Date 방어 코드 포함
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * 날짜 및 시간 포맷팅 (YYYY. MM. DD. HH:mm)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * 통화/금액 포맷팅 (원화 ₩ 및 달러 $ 유연 지원)
 * toFixed 문자열 toLocaleString 결합 버그 방지 및 Intl 규격 적용
 * @param {number|string} amount
 * @param {string} symbol - 기본값: '₩'
 * @returns {string}
 */
export const formatCurrency = (amount = 0, symbol = "₩") => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return `${symbol}0`;

  const isDollar = symbol === "$";
  const formattedNumber = numericAmount.toLocaleString("ko-KR", {
    minimumFractionDigits: isDollar ? 2 : 0,
    maximumFractionDigits: isDollar ? 2 : 0,
  });

  return `${symbol}${formattedNumber}`;
};

/**
 * 긴 ID 문자열 축약 (기본: 뒤 8자리)
 * @param {string} id
 * @param {number} length
 * @returns {string}
 */
export const truncateId = (id, length = 8) => {
  if (!id) return "#-";
  const strId = String(id);
  return `#${strId.substring(Math.max(0, strId.length - length))}`;
};

/**
 * 긴 텍스트 말줄임(...) 처리
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (str, maxLength = 30) => {
  if (!str) return "";
  const stringVal = String(str);
  if (stringVal.length <= maxLength) return stringVal;
  return `${stringVal.slice(0, maxLength)}...`;
};

/**
 * 주문 상태에 따른 뱃지 스타일 및 상태 라벨 정보 반환
 * @param {string} status
 * @returns {{ badgeClass: string, label: string }}
 */
export const getOrderStatusInfo = (status = "pending") => {
  const normalizedStatus = String(status || "pending").toLowerCase();
  switch (normalizedStatus) {
    case "delivered":
      return { badgeClass: "badge-success", label: "DELIVERED" };
    case "shipped":
      return { badgeClass: "badge-info", label: "SHIPPED" };
    case "pending":
    default:
      return { badgeClass: "badge-warning", label: "PENDING" };
  }
};

/**
 * 조건부 Tailwind 클래스 결합 유틸리티
 * @param  {...any} classes
 * @returns {string}
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};
