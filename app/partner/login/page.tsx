import type { Metadata } from "next";
import { PartnerAuthScreen } from "../_portal/PartnerAuthScreen";

export const metadata: Metadata = { title: "파트너 로그인 | Campus Drop" };

export default function PartnerLoginPage() {
  return (
    <PartnerAuthScreen
      eyebrow="PARTNER SIGN IN"
      title="파트너 포털 로그인"
      description="승인된 매장 전용 계정으로 방문 현황과 운영자 제안을 확인합니다. 현재는 보안 서버 인증 연동을 준비하고 있습니다."
      fields={[
        { label: "아이디", placeholder: "서버 연동 후 입력 가능" },
        { label: "비밀번호", type: "password", placeholder: "서버 연동 후 입력 가능" },
      ]}
    />
  );
}
