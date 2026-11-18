import { Scorecard } from "@/components/scorecard";

export function generateStaticParams() {
  return [
    { id: "local" },
    ...Array.from({ length: 45 }, (_, index) => ({ id: `minato-${index + 1}` })),
  ];
}

export default function Page() {
  return <Scorecard />;
}
