import Link from "next/link";
import StatusMessage from "./_components/common/StatusMessage";

export default function NotFound() {
  return (
    <StatusMessage
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
    >
      <Link
        href="/"
        className="rounded-lg bg-gradient-to-br from-[#7c3196] to-[#694ace] px-6 py-2 text-white"
      >
        Back to free games
      </Link>
    </StatusMessage>
  );
}
