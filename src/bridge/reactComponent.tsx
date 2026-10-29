import type { IComponentOptions, IController, IOnChangesObject } from 'angular';
import { StrictMode, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Wraps a React component as an AngularJS component, so it can be used in
 * AngularJS templates and routes during the migration:
 *
 *   angular.module('app').component('phoneList', reactComponent(PhoneList));
 *   angular.module('app').component('phoneDetail', reactComponent(PhoneDetail, ['phoneId']));
 *
 * Each name in `bindings` becomes a one-way ('<') AngularJS binding and is
 * passed to React as a prop. React owns everything inside the element;
 * AngularJS owns the element itself and decides when it is destroyed.
 */
export function reactComponent<P extends object>(
  Component: ComponentType<P>,
  bindings: ReadonlyArray<keyof P & string> = [],
): IComponentOptions {
  class ReactBridgeController implements IController {
    static $inject = ['$element'];
    private root: Root | null = null;
    private props = {} as P;

    constructor(private readonly $element: JQLite) {}

    $onChanges(changes: IOnChangesObject) {
      const next: Record<string, unknown> = { ...(this.props as Record<string, unknown>) };
      for (const [name, change] of Object.entries(changes)) next[name] = change.currentValue;
      this.props = next as P;
      this.render();
    }

    $postLink() {
      const host = this.$element[0];
      if (!host) throw new Error('reactComponent: AngularJS gave us no element to render into');
      this.root = createRoot(host);
      this.render();
    }

    $onDestroy() {
      this.root?.unmount();
      this.root = null;
    }

    private render() {
      this.root?.render(
        <StrictMode>
          <Component {...this.props} />
        </StrictMode>,
      );
    }
  }

  return {
    bindings: Object.fromEntries(bindings.map((name) => [name, '<'])),
    controller: ReactBridgeController,
  };
}
