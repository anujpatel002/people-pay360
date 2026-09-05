interface Props {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  size?: number;
}

export default function EmployeeAvatar({ avatarUrl, firstName, lastName, size = 48 }: Props) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const style = { width: size, height: size, borderRadius: '50%', fontSize: size * 0.38 };

  if (avatarUrl) {
    return <img src={avatarUrl} alt={`${firstName} ${lastName}`} style={style} />;
  }

  return (
    <div
      style={{
        ...style,
        background: '#4f46e5',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
