import Image from "next/image";
import type { ReactNode } from "react";

export const STATUS_IMAGES = {
  empty: "/images/draws/empty_drawable.imageset/empty_drawable_dark.svg",
  error:
    "/images/draws/loading_error_drawable.imageset/loading_error_drawable_dark.svg",
  maintenance:
    "/images/draws/maintenance_drawable.imageset/maintenance_drawable_dark.svg",
} as const;

/**
 * Centered illustration with a title and description, used for empty lists and error pages.
 */
export default function StatusMessage({
  image = "empty",
  title,
  description,
  children,
}: {
  image?: keyof typeof STATUS_IMAGES;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="flex w-full flex-col items-center justify-center md:w-1/2 lg:w-1/3">
        <Image
          src={STATUS_IMAGES[image]}
          alt=""
          width={100}
          height={100}
          className="h-full w-full object-contain"
        />
        <h2 className="mb-2 font-medium text-[#8f73e8]">{title}</h2>
        <p className="text-gray-300">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
