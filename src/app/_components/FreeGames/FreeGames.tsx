import type { FreeGame } from "~/types/game";
import FreeGamesBrowser from "./FreeGamesBrowser";
import PageIntro from "../common/PageIntro";
import StatusMessage from "../common/StatusMessage";

export default function FreeGames({ games }: { games: FreeGame[] }) {
  if (games.length === 0) {
    return (
      <StatusMessage
        title="There are no free games"
        description="Try again later or submit a game if you know about a free one."
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Free to keep"
        title={
          games.length === 1
            ? "1 free game to claim right now"
            : `${games.length} free games to claim right now`
        }
        description="Claim them before the timer runs out and they're yours to keep."
      />
      <FreeGamesBrowser games={games} />
    </>
  );
}
