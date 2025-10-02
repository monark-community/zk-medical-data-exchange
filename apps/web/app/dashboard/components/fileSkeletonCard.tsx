import { Skeleton } from "@/components/ui/skeleton";

const FileSkeletonCard = () => {
  return (
    <div className="flex flex-col space-y-3  ">
      <Skeleton className="h-[150px] w-full rounded-xl" />
    </div>
  );
};

export default FileSkeletonCard;
