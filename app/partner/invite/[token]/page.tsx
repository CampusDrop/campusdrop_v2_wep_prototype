import type { Metadata } from "next";
import { PartnerAuthScreen } from "../../_portal/PartnerAuthScreen";

export const metadata: Metadata = { title: "파트너 계정 등록 | Campus Drop" };

export default async function PartnerInvitePage({ params }: { params: Promise<{ token: string }> }) {
  await params;
  return (
    <PartnerAuthScreen
      eyebrow="ONE-TIME INVITATION"
      title="파트너 계정 등록"
      description="운영자가 보낸 일회용 링크에서 업체 계정을 등록합니다. 등록 후 운영자 승인 전까지는 로그인할 수 없습니다."
      tokenMessage="초대 링크는 서버에서 일회성·당일 자정(KST) 만료 여부를 검증해야 합니다. 링크 정보는 화면에 표시하거나 브라우저 저장소에 보관하지 않습니다."
      fields={[
        { label: "가게 이름", placeholder: "서버 검증 후 입력 가능" },
        { label: "가게 주소", placeholder: "서버 검증 후 입력 가능" },
        { label: "전화번호", type: "tel", placeholder: "서버 검증 후 입력 가능" },
        { label: "아이디", placeholder: "12자 이상 비밀번호와 함께 등록" },
        { label: "비밀번호", type: "password", placeholder: "서버 연동 후 입력 가능" },
      ]}
    />
  );
}
