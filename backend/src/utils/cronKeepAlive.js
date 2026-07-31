import https from "https";
import http from "http";

/**
 * Render.com 무료 인스턴스 슬립(Spin Down: 15분 미요청 시 휴면) 방지용 Keep-Alive 핑 유틸리티
 * NODE_ENV가 production 일 때에만 동작합니다.
 */
export const initKeepAlive = () => {
  // 개발 환경(development)이거나 production 환경이 아닌 경우 핑을 동작시키지 않음
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV !== "production"
  ) {
    console.log(
      "[Keep-Alive] 개발 환경(NODE_ENV !== 'production')이므로 Self-Ping Cron을 실행하지 않습니다.",
    );
    return;
  }

  const FOURTEEN_MINUTES = 14 * 60 * 1000; // 14분 (밀리초)

  console.log(
    "[Keep-Alive] 프로덕션 환경: 14분 주기 서버 Self-Ping Cron이 초기화되었습니다.",
  );

  // 서버 시작 후 14분 주기로 실행
  setInterval(() => {
    // Render.com은 배포 시 RENDER_EXTERNAL_URL 환경변수를 자동으로 제공합니다.
    const serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;

    if (!serverUrl) {
      console.log(
        "[Keep-Alive Ping] SERVER_URL 또는 RENDER_EXTERNAL_URL 환경변수가 없어 Self-Ping을 건너뜁니다.",
      );
      return;
    }

    const healthUrl = `${serverUrl.replace(/\/$/, "")}/api/health`;
    const protocol = healthUrl.startsWith("https") ? https : http;

    console.log(
      `[Keep-Alive Ping] ${new Date().toLocaleString("ko-KR")} - Self-Ping 요청 전송: ${healthUrl}`,
    );

    protocol
      .get(healthUrl, (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const jsonData = JSON.parse(rawData);
            console.log(`[Keep-Alive Ping Success] 응답 데이터:`, jsonData);
          } catch {
            console.log(`[Keep-Alive Ping Success] 응답 데이터: ${rawData}`);
          }
        });
      })
      .on("error", (err) => {
        console.error(`[Keep-Alive Ping Error] 요청 실패: ${err.message}`);
      });
  }, FOURTEEN_MINUTES);
};
