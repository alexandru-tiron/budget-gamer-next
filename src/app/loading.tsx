import GameCardSkeleton from "./_components/FreeGames/GameCard/GameCardSkeleton";
import SkeletonGrid from "./_components/common/SkeletonGrid";

export default function Loading() {
  return (
    <SkeletonGrid label="Loading free games">
      <GameCardSkeleton />
    </SkeletonGrid>
  );
}
