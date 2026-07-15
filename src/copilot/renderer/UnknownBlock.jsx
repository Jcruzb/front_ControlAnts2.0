import { BlockMessage } from "../components/shared/BlockPrimitives";

export default function UnknownBlock({ type }) {
  return <BlockMessage kind="error" title="Bloque no compatible" message={`No se puede mostrar el bloque “${type || "sin tipo"}”.`} />;
}
