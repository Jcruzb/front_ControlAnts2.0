import { Component } from "react";
import { BlockMessage } from "./BlockPrimitives";

export default class BlockErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <BlockMessage kind="error" title="No se pudo mostrar este bloque" message="El resto del informe sigue disponible." />;
    }
    return this.props.children;
  }
}
