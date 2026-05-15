import { useRouter } from "next/router";
import AppHead from "../../components/app-head";
import RoomCreateScreen from "../../components/room-create-screen";
import { useDecks } from "../../components/deck-provider";

export default function RoomCreatePage() {
  const router = useRouter();
  const { deckTree } = useDecks();

  function handleCreated(code: string, hostId: string) {
    localStorage.setItem(`spandle:room:${code}:hostId`, hostId);
    void router.push(`/room/${code}`);
  }

  return (
    <>
      <AppHead title="Play with friends | SPANDLE!" />
      <RoomCreateScreen deckTree={deckTree} onCreated={handleCreated} />
    </>
  );
}
