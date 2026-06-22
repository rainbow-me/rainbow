import { type SandboxTestCaseResult } from '../models/cases';
import {
  classifyHttpAllowed,
  classifyHttpBlocked,
  classifyWebViewAllowed,
  classifyWebViewBlocked,
  type BlockedHttpOutcome,
} from './classifier';

describe('sandbox classifier', () => {
  describe('#classifyHttpAllowed', () => {
    it('passes when the allow-listed request succeeds', () => {
      expect(classifyHttpAllowed({ ok: true, status: 200 })).toEqual({ passed: true, detail: 'reachable (status 200)' });
    });

    it('fails on a non-ok response (the host should be reachable)', () => {
      expect(classifyHttpAllowed({ ok: false, status: 500 })).toEqual({ passed: false, detail: 'unexpected status 500' });
    });

    it('fails when the request errors', () => {
      expect(classifyHttpAllowed({ error: 'network down' })).toEqual({ passed: false, detail: 'errored: network down' });
    });
  });

  describe('#classifyHttpBlocked', () => {
    // The security-critical boundary: a blocked host is a breach ONLY if it
    // returns a real 2xx. Everything else (non-2xx, reject, timeout) is blocked.
    it.each<[BlockedHttpOutcome, SandboxTestCaseResult]>([
      [
        { kind: 'resolved', status: 200 },
        { passed: false, detail: 'not blocked (status 200)' },
      ], // real 2xx -> breach
      [
        { kind: 'resolved', status: 299 },
        { passed: false, detail: 'not blocked (status 299)' },
      ], // upper 2xx bound -> breach
      [
        { kind: 'resolved', status: 199 },
        { passed: true, detail: 'blocked (status 199)' },
      ], // below 2xx -> blocked
      [
        { kind: 'resolved', status: 300 },
        { passed: true, detail: 'blocked (status 300)' },
      ], // above 2xx -> blocked
      [
        { kind: 'resolved', status: 500 },
        { passed: true, detail: 'blocked (status 500)' },
      ], // Android synthetic 500 -> blocked
      [
        { kind: 'rejected', error: 'refused' },
        { passed: true, detail: 'blocked (request failed)' },
      ], // reject -> blocked
      [{ kind: 'timeout' }, { passed: true, detail: 'blocked (no response)' }], // iOS hang/drop -> blocked
    ])('outcome %o -> %o', (outcome, expected) => {
      expect(classifyHttpBlocked(outcome)).toEqual(expected);
    });
  });

  describe('#classifyWebViewAllowed', () => {
    it('passes when the allow-listed page loads', () => {
      expect(classifyWebViewAllowed(true)).toEqual({ passed: true, detail: 'allow-listed page loaded' });
    });

    it('fails when the allow-listed page does not load', () => {
      expect(classifyWebViewAllowed(false)).toEqual({ passed: false, detail: 'allow-listed page did not load' });
    });
  });

  describe('#classifyWebViewBlocked', () => {
    it('passes when the blocked host is never reached', () => {
      expect(classifyWebViewBlocked(false)).toEqual({ passed: true, detail: 'blocked (did not load)' });
    });

    it('fails when the blocked host loads, naming the observed url', () => {
      expect(classifyWebViewBlocked(true, 'https://example.com/')).toEqual({
        passed: false,
        detail: 'loaded blocked host: https://example.com/',
      });
    });

    it('fails with an empty url when none is observed', () => {
      expect(classifyWebViewBlocked(true)).toEqual({ passed: false, detail: 'loaded blocked host: ' });
    });
  });
});
