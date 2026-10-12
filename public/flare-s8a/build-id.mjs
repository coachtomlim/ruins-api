// 002E9E: the one central build token for the S8A challenge page. The same value is the document marker
// (data-app-build on #receiverApp in challenge.html), the ?v= query on the page's own entry CSS/module references,
// and the value of the one-shot recovery parameter used by build-gate.mjs. Bump it on a release whose HTML and
// entry module must be loaded as a matching pair. tests/flare-friend-feedback-002e9e-version-skew.test.mjs pins
// challenge.html to this token.
export const APP_BUILD='friend-feedback-002e9e';
export const RECOVERY_PARAM='__wf_reload';
