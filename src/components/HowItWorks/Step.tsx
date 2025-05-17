interface StepProps {
  title: string;
  description: string;
}

export function Step({ title, description }: StepProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-light tracking-normal text-[#3F0052]">{title}</h3>
      <p className="text-black font-light tracking-normal leading-relaxed">{description}</p>
    </div>
  );
}