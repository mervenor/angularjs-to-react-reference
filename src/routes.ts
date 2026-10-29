/** Where a phone's page lives. AngularJS still owns routing, hence the "#!" URLs. */
export const phoneHref = (id: string) => `#!/phones/${encodeURIComponent(id)}`;
