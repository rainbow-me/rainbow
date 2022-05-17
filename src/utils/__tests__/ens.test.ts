import { validateENS } from '../ens';

describe('valid names', () => {
  it('domain', () => {
    expect(validateENS('lol.eth')).toMatchInlineSnapshot(`
      Object {
        "valid": true,
      }
    `);
  });

  it('domain with emojis', () => {
    expect(validateENS('lol😊.eth')).toMatchInlineSnapshot(`
      Object {
        "valid": true,
      }
    `);
  });

  it('domain with ñ', () => {
    expect(validateENS('estebañ.eth')).toMatchInlineSnapshot(`
      Object {
        "valid": true,
      }
    `);
  });

  it('subdomain', () => {
    expect(validateENS('super.lol.eth')).toMatchInlineSnapshot(`
      Object {
        "valid": true,
      }
    `);
  });
});

describe('invalid names', () => {
  it('invalid domain', () => {
    expect(validateENS('wat')).toMatchInlineSnapshot(`
      Object {
        "code": "invalid-domain",
        "hint": "This is an invalid domain",
        "valid": false,
      }
    `);
  });

  it('domain with special characters', () => {
    expect(validateENS('omg$.eth')).toMatchInlineSnapshot(`
      Object {
        "code": "invalid-domain-name",
        "hint": "Your name cannot include special characters",
        "valid": false,
      }
    `);
  });

  it('domain with subdomain fails when `includeSubdomains` is falsy', () => {
    expect(validateENS('wat.lol.eth', { includeSubdomains: false }))
      .toMatchInlineSnapshot(`
      Object {
        "code": "subdomains-not-supported",
        "hint": "Subdomains are not supported",
        "valid": false,
      }
    `);
  });

  it('domain with invalid length', () => {
    expect(validateENS('no.eth')).toMatchInlineSnapshot(`
      Object {
        "code": "invalid-length",
        "hint": "Your name must be at least 3 characters",
        "valid": false,
      }
    `);
  });

  it('domain with invalid TLD', () => {
    expect(validateENS('rofl.lol')).toMatchInlineSnapshot(`
      Object {
        "code": "invalid-tld",
        "hint": "This TLD is not supported",
        "valid": false,
      }
    `);
  });

  it('subdomain with special characters', () => {
    expect(validateENS('haha$.rofl.eth')).toMatchInlineSnapshot(`
      Object {
        "code": "invalid-subdomain-name",
        "hint": "Your subdomain cannot include special characters",
        "valid": false,
      }
    `);
  });
});
