interface TermsSectionProps {
  title: string;
  content: string;
}

export function TermsSection({ title, content }: TermsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-light text-[#3F0052] tracking-normal">{title}</h2>
      <p className="text-black leading-relaxed tracking-normal whitespace-pre-line font-light">
        {content}
      </p>
    </section>
  );
}