import { UserIcon } from "./icons";

export function UserAvatar({
  avatarUrl,
  className,
  iconClassName,
}: {
  avatarUrl: string | null;
  className?: string;
  iconClassName?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${className ?? ""} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className ?? ""} flex items-center justify-center rounded-full bg-surface text-muted`}
    >
      <UserIcon className={iconClassName ?? "size-5"} />
    </span>
  );
}
