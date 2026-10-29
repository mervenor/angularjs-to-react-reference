import { screen, waitFor } from '@testing-library/react';
import angular from 'angular';
import { describe, expect, it } from 'vitest';
import { reactComponent } from './reactComponent';

function Greeting({ name }: { name?: string }) {
  return <p>Hello, {name ?? 'nobody'}</p>;
}

angular.module('bridgeTest', []).component('greeting', reactComponent(Greeting, ['name']));

function compile(template: string) {
  const injector = angular.injector(['ng', 'bridgeTest']);
  const scope = injector.get('$rootScope').$new() as angular.IScope & { who?: string };
  const element = injector.get('$compile')(template)(scope);
  document.body.append(element[0]!);
  return { scope, host: element[0] as HTMLElement };
}

describe('reactComponent bridge', () => {
  it('renders a React component inside an AngularJS template', async () => {
    const { scope } = compile('<greeting name="who"></greeting>');
    scope.who = 'Ada';
    scope.$digest();
    expect(await screen.findByText('Hello, Ada')).toBeInTheDocument();
    scope.$destroy();
  });

  it('passes AngularJS binding changes to React as new props', async () => {
    const { scope } = compile('<greeting name="who"></greeting>');
    scope.who = 'Ada';
    scope.$digest();
    await screen.findByText('Hello, Ada');
    scope.who = 'Grace';
    scope.$digest();
    expect(await screen.findByText('Hello, Grace')).toBeInTheDocument();
    scope.$destroy();
  });

  it('unmounts the React tree when AngularJS destroys the scope', async () => {
    const { scope, host } = compile('<greeting name="who"></greeting>');
    scope.who = 'Ada';
    scope.$digest();
    await screen.findByText('Hello, Ada');
    scope.$destroy();
    await waitFor(() => expect(host).toBeEmptyDOMElement());
  });
});
