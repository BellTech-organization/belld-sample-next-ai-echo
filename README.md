# belld-sample-next-ai-echo

Public fixture repository for BellD's production journey E2E (WO-032). Mirrors
`runtime-plane/runner/testdata/samples/next-ai-echo` from BellD-Web-V2: a minimal Next.js app that calls
`ai.generate` through the BellD SDK. No secrets; the SDK tarball is vendored so the build runs through the
registry proxy without private packages.
