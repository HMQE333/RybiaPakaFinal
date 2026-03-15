interface UserBioProps {
  bio?: string | null;
}

export default function UserBio({ bio }: UserBioProps) {
  if (!bio || bio.trim().length === 0) {
    return <p className="text-sm text-foreground-2 leading-relaxed">Brak opisu</p>;
  }
  return <p className="text-sm text-foreground-2 leading-relaxed">{bio}</p>;
}
