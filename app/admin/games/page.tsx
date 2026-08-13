import type { Metadata } from "next";
import { AdminScreen } from "../_portal/AdminScreen";
export const metadata: Metadata = { title: "게임·이벤트 관리 | Campus Drop" };
export default function AdminGamesPage() { return <AdminScreen currentPath="/admin/games" title="게임·이벤트 관리" description="게임 테마, 미션 발행과 이벤트의 시작·종료 시각을 관리합니다." allowedRoles={["SUPER", "USER_SERVICE_MANAGER"]} capability="게임·이벤트 관리" />; }
