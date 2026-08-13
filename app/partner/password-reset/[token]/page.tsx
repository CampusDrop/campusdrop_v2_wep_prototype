import type { Metadata } from "next";
import { PartnerAuthScreen } from "../../_portal/PartnerAuthScreen";

export const metadata: Metadata = { title: "파트너 비밀번호 재설정 | Campus Drop" };

export default async function PartnerPasswordResetPage({ params }: { params: Promise<{ token: string }> }) {
  await params;
  return (
    <PartnerAuthScreen
      eyebrow="ONE-TIME PASSWORD RESET"
      title="비밀번호 재설정"
      description="운영자가 발급한 하루짜리 일회용 링크에서 새 비밀번호를 등록합니다. 완료되면 기존 로그인 상태는 모두 종료됩니다."
      tokenMessage="재설정 링크는 서버에서 일회성·당일 자정(KST) 만료 여부를 확인해야 합니다. 링크 정보는 화면에 표시하거나 브라우저 저장소에 보관하지 않습니다."
      fields={[
        { label: "새 비밀번호", type: "password", placeholder: "12자 이상, 3종 조합" },
        { label: "새 비밀번호 확인", type: "password", placeholder: "서버 연동 후 입력 가능" },
      ]}
    />
  );
}
