import { validateENS } from '../ens';

describe('valid names', () => {
  it('domain', () => {
    expect(validateENS('lol.eth')).toMatchInlineSnapshot(`
      {
        "valid": true,
      }
    `);
  });

  it('domain with emojis', () => {
    expect(validateENS('lol😊.eth')).toMatchInlineSnapshot(`
      {
        "valid": true,
      }
    `);
  });

  it('domain with ñ', () => {
    expect(validateENS('estebañ.eth')).toMatchInlineSnapshot(`
      {
        "valid": true,
      }
    `);
  });

  it('subdomain', () => {
    expect(validateENS('super.lol.eth')).toMatchInlineSnapshot(`
      {
        "valid": true,
      }
    `);
  });
});

describe('invalid names', () => {
  it('invalid domain', () => {
    expect(validateENS('wat')).toMatchInlineSnapshot(`
      {
        "code": "invalid-domain",
        "hint": "This is an invalid domain",
        "valid": false,
      }
    `);
  });

  it('domain with special characters', () => {
    expect(validateENS('omg$.eth')).toMatchInlineSnapshot(`
      {
        "code": "invalid-subdomain-name",
        "hint": "Your name cannot include special characters",
        "valid": false,
      }
    `);
  });

  it('domain with subdomain fails when `includeSubdomains` is falsy', () => {
    expect(validateENS('wat.lol.eth', { includeSubdomains: false }))
      .toMatchInlineSnapshot(`
      {
        "code": "subdomains-not-supported",
        "hint": "Subdomains are not supported",
        "valid": false,
      }
    `);
  });

  it('domain with empty subdomain fails when `includeSubdomains` is falsy', () => {
    expect(validateENS('.lol.eth', { includeSubdomains: false }))
      .toMatchInlineSnapshot(`
      {
        "code": "subdomains-not-supported",
        "hint": "Subdomains are not supported",
        "valid": false,
      }
    `);
  });

  it('domain with invalid length', () => {
    expect(validateENS('no.eth')).toMatchInlineSnapshot(`
      {
        "code": "invalid-length",
        "hint": "Your name must be at least 3 characters",
        "valid": false,
      }
    `);
  });

  it('domain with invalid TLD', () => {
    expect(validateENS('rofl.lol')).toMatchInlineSnapshot(`
      {
        "code": "invalid-tld",
        "hint": "This TLD is not supported",
        "valid": false,
      }
    `);
  });

  it('subdomain with special characters', () => {
    expect(validateENS('haha$.rofl.eth')).toMatchInlineSnapshot(`
      {
        "code": "invalid-subdomain-name",
        "hint": "Your name cannot include special characters",
        "valid": false,
      }
    `);
  });
});
