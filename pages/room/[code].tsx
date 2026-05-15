import React from "react";
import AppHead from "../../components/app-head";
import RoomScreen from "../../components/room-screen";

export function getStaticPaths() {
  return { paths: [{ params: { code: "__shell__" } }], fallback: false };
}

export function getStaticProps() {
  return { props: {} };
}

export default function RoomPage() {
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const roomCode = parts[1];
    if (roomCode && roomCode !== "__shell__") {
      setCode(roomCode.toUpperCase());
    }
  }, []);

  const hostId = React.useMemo(() => {
    if (!code) return null;
    return localStorage.getItem(`spandle:room:${code}:hostId`);
  }, [code]);

  if (!code) return null;

  return (
    <>
      <AppHead title={`Room ${code} | SPANDLE!`} />
      <RoomScreen code={code} hostId={hostId} />
    </>
  );
}
