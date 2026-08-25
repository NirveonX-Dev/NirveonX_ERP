export default function Avatar({ user, size = 8, onLeave = false }) {
  if (!user) return null;
  const initials = (user.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: `${size * 4}px`, height: `${size * 4}px` }}>
      <div
        className="flex items-center justify-center rounded-full text-white text-xs font-semibold w-full h-full"
        style={{ backgroundColor: user.avatarColor || "#4338CA", opacity: onLeave ? 0.4 : 1 }}
        title={onLeave ? `${user.name} · On leave` : user.name}
      >
        {initials}
      </div>
      {onLeave && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-red-500 border-2 border-white"
          style={{ width: `${Math.max(size * 0.9, 8)}px`, height: `${Math.max(size * 0.9, 8)}px` }}
          title="On leave"
        />
      )}
    </div>
  );
}