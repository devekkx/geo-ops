/* eslint-disable @typescript-eslint/no-empty-function */
class ResizeObserverStub {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

globalThis.ResizeObserver ??= ResizeObserverStub;
