import { avatarHue, initials } from "@/lib/format";

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const hue = avatarHue(name);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size < 32 ? 10 : 12,
        background: `hsl(${hue} 42% 42%)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
