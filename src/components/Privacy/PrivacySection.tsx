interface PrivacySectionProps {
  title: string;
  content: string;
  isMainTitle?: boolean;
}

export function PrivacySection({ title, content, isMainTitle }: PrivacySectionProps) {
  return (
    <section className="space-y-4">
      {!isMainTitle && (
        <h2 className="text-2xl font-light text-[#3F0052] tracking-normal">{title}</h2>
      )}
      <p className="text-black leading-relaxed tracking-normal font-light">
        {content}
      </p>
    </section>
  );
}