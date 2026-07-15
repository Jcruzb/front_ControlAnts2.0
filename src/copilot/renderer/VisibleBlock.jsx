import useVisibleBlock from "../hooks/useVisibleBlock";
import { CopilotSkeleton } from "../components/shared/BlockPrimitives";

export default function VisibleBlock({ children }) {
  const { ref, visible } = useVisibleBlock();
  return <div ref={ref} className="min-h-24 min-w-0 max-w-full">{visible ? children : <CopilotSkeleton compact />}</div>;
}
