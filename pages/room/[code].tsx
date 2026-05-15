import { useRouter } from "next/router";
import React from "react";
import AppHead from "../../components/app-head";
import RoomScreen from "../../components/room-screen";

export default function RoomPage() {
  const router = useRouter();
  const { code } = router.query;

  const hostId = React.useMemo(() => {
    if (typeof code !== "string") return null;
    return localStorage.getItem(`spandle:room:${code.toUpperCase()}:hostId`);
  }, [code]);

  if (!router.isReady || typeof code !== "string") {
    return null;
  }

  return (
    <>
      <AppHead title={`Room ${code} | SPANDLE!`} />
      <RoomScreen code={code.toUpperCase()} hostId={hostId} />
    </>
  );
}
