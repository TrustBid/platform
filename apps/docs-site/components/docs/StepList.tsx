interface Step {
  number: number;
  title: string;
  body: string | React.ReactNode;
  note?: string | React.ReactNode;
}

interface StepListProps {
  steps: Step[];
}

export default function StepList({ steps }: StepListProps) {
  return (
    <div className="my-8 space-y-8">
      {steps.map((step) => (
        <div key={step.number} className="flex gap-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2B5BFF] text-sm font-black text-[#2B5BFF]">
            {step.number}
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-base font-semibold text-gray-800">
              {step.title}
            </h3>
            <div className="text-[15px] leading-relaxed text-gray-600">{step.body}</div>
            {step.note && (
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">{step.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
