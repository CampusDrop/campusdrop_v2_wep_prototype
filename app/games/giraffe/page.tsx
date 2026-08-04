import type { Metadata } from "next";
import GiraffeGame from "./GiraffeGame";

export const metadata: Metadata = {
  title: "시계탑 기린 목격 사건 | Campus Drop",
  description: "시계탑 주변에 남은 기록을 조사하는 Campus Drop 인터랙티브 게임.",
};

export default function GiraffeGamePage() {
  return <GiraffeGame />;
}
