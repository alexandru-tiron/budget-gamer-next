import Image from "next/image";
import { useSidePanelContext } from "~/app/_context/SidePanelContext";

export default function SidePanelHeader({ title }: { title: string }) {
  const { setSidePanel } = useSidePanelContext();
  return (
    <div className="sticky top-0 z-10 flex w-full items-center justify-between text-white">
      <h1 className="w-full bg-[#1e1e1e] py-6 text-center text-xl font-bold">
        {title}
      </h1>
      <button
        className="absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center rounded-full bg-[#1e1e1e] p-2"
        onClick={() => setSidePanel(null)}
      >
        <Image
          src="/images/icons/arrow-left-short.svg"
          alt="Close"
          width={36}
          height={36}
        />
      </button>
    </div>
  );
}
