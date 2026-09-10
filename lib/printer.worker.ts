import { createPrinterRenderer, type PrinterViewState } from './printer-scene';
import type { PrinterBuffers } from './printer-resources';
// Only explicit scene state crosses the boundary; the worker never accesses the DOM.
let state: PrinterViewState;
let renderer: ReturnType<typeof createPrinterRenderer> | undefined;
const send = (message: object) => globalThis.postMessage(message);
globalThis.onmessage = (event: MessageEvent<
  | { type: 'init'; canvas: OffscreenCanvas; state: PrinterViewState; buffers: PrinterBuffers }
  | { type: 'update'; state: PrinterViewState }
>) => {
  const message = event.data;
  if (message.type === 'init') {
    state = message.state;
    try {
      renderer = createPrinterRenderer(message.canvas, () => state,
        error => send({ type: 'error', message: error.message }),
        () => send({ type: 'ready' }), message.buffers);
    } catch (error) { send({ type: 'error', message: String(error) }); }
  } else { state = message.state; renderer?.update(); }
};
