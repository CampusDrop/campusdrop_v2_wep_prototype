import { AdminPortalShell } from "../../../_portal/AdminPortal";
import PlaytestMaker from "../../../_editor/maker/PlaytestMaker";

export default function AdminMakerPlaytestPage() {
  return <AdminPortalShell currentPath="/admin/editor" title="게임 메이커" description="초안은 이 브라우저에서만 보관되며, 서버 저장·발행 API가 연결되기 전에는 공개되지 않습니다." allowedRoles={["SUPER", "USER_SERVICE_MANAGER"]} renderContent={() => <PlaytestMaker />} />;
}
