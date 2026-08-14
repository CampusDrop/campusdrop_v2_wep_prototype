import type { Metadata } from "next";
import DesignTokensReference from "../_editor/DesignTokensReference";
import EditorTool from "../_editor/EditorTool";
import { AdminPortalShell } from "../_portal/AdminPortal";

export const metadata: Metadata = { title: "미션 에디터 | Campus Drop" };

export default function AdminEditorPage() {
  return <AdminPortalShell currentPath="/admin/editor" title="미션 에디터" description="현장 조사 미션을 설계하는 내부 제작 도구입니다." allowedRoles={["SUPER", "USER_SERVICE_MANAGER"]} renderContent={() => <><DesignTokensReference /><EditorTool /></>} />;
}
