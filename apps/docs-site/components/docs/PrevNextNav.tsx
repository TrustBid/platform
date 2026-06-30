import Link from "next/link";
import { getAdjacentPages } from "@/lib/navigation";

interface PrevNextNavProps {
  currentHref: string;
}

export default function PrevNextNav({ currentHref }: PrevNextNavProps) {
  const { prev, next } = getAdjacentPages(currentHref);

  if (!prev && !next) return null;

  return (
    <nav className="mt-16 flex justify-between border-t border-gray-100 pt-6">
      {prev ? (
        <Link href={prev.href} className="group max-w-[45%]">
          <span className="text-xs text-gray-400">Previous</span>
          <p className="text-sm font-medium text-gray-900 group-hover:text-[#2B5BFF]">
            {prev.label}
          </p>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={next.href} className="group max-w-[45%] text-right">
          <span className="text-xs text-gray-400">Next</span>
          <p className="text-sm font-medium text-gray-900 group-hover:text-[#2B5BFF]">
            {next.label}
          </p>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
