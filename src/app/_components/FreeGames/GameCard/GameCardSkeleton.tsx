export default function GameCardSkeleton() {
   return (
      <div className="card relative flex flex-col mb-4 bg-[#1e1e1e] rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
         <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100" />
         <div className="p-3">
            <div className="h-4 w-24 bg-gray-100 rounded-full mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded-full mb-2" />
            <div className="h-4 w-28 bg-gray-100 rounded-full" />
         </div>
      </div>
   );
}
