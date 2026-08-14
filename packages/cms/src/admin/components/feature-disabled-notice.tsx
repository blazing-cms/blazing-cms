interface FeatureDisabledNoticeProps {
  title: string;
  description: string;
}

export function FeatureDisabledNotice({ description, title }: FeatureDisabledNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
