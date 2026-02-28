export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/Gemini_Generated_Image_3c5l663c5l663c5l.webp"
        alt="Mocky Logo"
        className="h-10 w-10 rounded-lg object-cover shadow"
        width={40}
        height={40}
        priority={false}
      />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-zinc-900">Mocky</span>
        <span className="text-xs text-zinc-500">Mock Server</span>
      </div>
    </div>
  );
}