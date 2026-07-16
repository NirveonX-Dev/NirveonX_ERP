export default function Avatar({ user, size = 8 }) {
  if (!user) return null;
  const initials = (user.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0`}
      style={{ backgroundColor: user.avatarColor || "#4338CA", width: `${size * 4}px`, height: `${size * 4}px` }}
      title={user.name}
    >
      {initials}
    </div>
  );
}
