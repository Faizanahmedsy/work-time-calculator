import dynamic from "next/dynamic";

const TimeCalculator = dynamic(() => import("..//components/TimeCalculator"), {
  ssr: false,
});

export default function Page() {
  return <TimeCalculator />;
}
