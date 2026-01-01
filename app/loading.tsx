import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex h-screen w-full bg-white">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r bg-white h-screen p-6 hidden md:block">
                <div className="flex items-center gap-3 mb-8">
                    <Skeleton className="h-10 w-10 rounded-lg bg-gray-100" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-gray-100" />
                        <Skeleton className="h-3 w-16 bg-gray-100" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl bg-gray-50" />
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col">
                <header className="px-8 py-6 border-b border-gray-50 bg-white">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48 bg-gray-100" />
                            <Skeleton className="h-4 w-32 bg-gray-100" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-12 w-32 rounded-2xl bg-gray-100" />
                            <Skeleton className="h-12 w-32 rounded-2xl bg-gray-100" />
                        </div>
                    </div>
                </header>
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32 w-full rounded-3xl bg-gray-50" />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-8 h-96">
                        <Skeleton className="col-span-2 h-full rounded-3xl bg-gray-50" />
                        <Skeleton className="col-span-1 h-full rounded-3xl bg-gray-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}
