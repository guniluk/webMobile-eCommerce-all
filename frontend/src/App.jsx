import { useEffect, useState } from "react";
import { Show, SignInButton, UserButton, useUser } from "@clerk/react";

const App = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncStatus, setSyncStatus] = useState("대기 중");

  useEffect(() => {
    const syncUserToMongoDB = async () => {
      if (isLoaded && isSignedIn && user) {
        setSyncStatus("MongoDB 동기화 진행 중...");
        try {
          const email = user.primaryEmailAddress?.emailAddress || "";
          const name =
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "User";
          const imageUrl = user.imageUrl || "";

          const payload = {
            clerkId: user.id,
            email,
            name,
            imageUrl,
          };

          let res = await fetch("/api/user/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch(() => null);

          if (res && res.ok) {
            const data = await res.json();
            if (data.success) {
              setSyncStatus("✅ MongoDB 유저 동기화 성공!");
              console.log("[Client Sync] MongoDB 유저 동기화 성공:", data.user);
            } else {
              setSyncStatus(`⚠️ 동기화 경고: ${data.message}`);
            }
          } else {
            setSyncStatus("❌ 백엔드 서버(포트 3000) 연결 실패");
          }
        } catch (error) {
          console.error("[Client Sync Error] 백엔드 동기화 예외 발생:", error);
          setSyncStatus(`❌ 동기화 에러: ${error.message}`);
        }
      }
    };
    syncUserToMongoDB();
  }, [isLoaded, isSignedIn, user]);

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1>E-Commerce Store</h1>

      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            로그인 / 회원가입
          </button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              환영합니다, {user?.fullName || user?.firstName || "고객님"}!
            </span>
            <UserButton />
          </div>
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
            }}
          >
            <strong>MongoDB 동기화 상태:</strong> {syncStatus}
          </div>
        </div>
      </Show>
    </div>
  );
};

export default App;
