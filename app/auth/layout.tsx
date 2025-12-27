import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
            {/* Left Column - Form */}
            <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {children}
                </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="hidden lg:block relative h-full w-full bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" /> {/* Overlay */}
                <Image
                    src="/images/auth-bg.png"
                    alt="Restaurant Ambience"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 p-12 text-white">
                    <div className="max-w-md">
                        <div className="mb-6 h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-6 w-6"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <blockquote className="text-2xl font-bold leading-tight mb-4">
                            "Quality is not an act, it is a habit. Service is our signature."
                        </blockquote>
                        <p className="text-sm font-medium" style={{ opacity: 0.5, color: "#ffffff" }}>
                            Ready for a great service tonight?
                        </p>

                        <div className="mt-8 flex gap-2">
                            <div className="h-1.5 w-8 rounded-full bg-brand-500"></div>
                            <div className="h-1.5 w-1.5 rounded-full bg-white/40"></div>
                            <div className="h-1.5 w-1.5 rounded-full bg-white/40"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
