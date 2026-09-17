# belld-sample-next-ai-echo

Public fixture repository for BellD's production journey E2E (WO-032). Mirrors
`runtime-plane/runner/testdata/samples/next-ai-echo` from BellD-Web-V2: a minimal Next.js app that calls
`ai.generate` through the BellD SDK. No secrets; the SDK tarball is vendored so the build runs through the
registry proxy without private packages.

## Routes

- `POST /invoke` — `ai.generate` (chat-completions shaped input, 100 max tokens); the WO-032 journey step.
- `POST /store` — `storage.object` round trip under the declared `/data/` prefix: write → read → delete →
  read (missing). Returns `written` / `deleted` as the platform returned them plus `read_matches`,
  `sha256_matches`, `missing_after_delete`. Added for the cloud baseline journey (BellD WO-105,
  RELEASE-GATE #6); it needs an `s3_compatible` provider binding for `storage.object`, otherwise the
  platform answers `binding_missing` and the route forwards that problem.
