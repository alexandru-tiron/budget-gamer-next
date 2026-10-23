import ArticlesCardSkeleton from "../_components/Articles/ArticlesCard/ArticlesCardSkeleton";
import SkeletonGrid from "../_components/common/SkeletonGrid";

export default function Loading() {
  return (
    <SkeletonGrid label="Loading articles">
      <ArticlesCardSkeleton />
    </SkeletonGrid>
  );
}
