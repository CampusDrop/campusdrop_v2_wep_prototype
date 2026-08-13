import type { Metadata } from "next";
import GameEventAuthoring from "../_games/GameEventAuthoring";
import { AdminPortalShell } from "../_portal/AdminPortal";
export const metadata: Metadata = { title: "게임·이벤트 관리 | Campus Drop" };
export default function AdminGamesPage() {
  return <AdminPortalShell currentPath="/admin/games" title="게임·이벤트 관리" description="게임 참여 인원, 미션 발행과 이벤트 보상 전환을 관리합니다." allowedRoles={["SUPER", "USER_SERVICE_MANAGER"]} renderContent={() => <GameEventAuthoring />} />;
}
