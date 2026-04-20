
const opts = { with: { type: 'css' } };
await import(/* webpackChunkName: "initial" */ './sass/initial.scss', opts);
await import(/* webpackChunkName: "container" */ './container.mjs');