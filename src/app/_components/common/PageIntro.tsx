/**
 * Eyebrow, headline and one line of context at the top of a list page.
 */
export default function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="animate-fade-up mb-6 flex flex-col gap-1.5">
      <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold text-balance text-white md:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm text-gray-400 md:text-base">
        {description}
      </p>
    </div>
  );
}
