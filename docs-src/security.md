---
title: OCPP Security
group: Guides
---
# OCPP Security

It is possible to achieve all levels of OCPP security using ocpp-rpc. Keep in mind though that many aspects of OCPP security (such as key management, certificate generation, etc...) are beyond the scope of this module and it will be up to you to implement them yourself.

Please consult the official specifications to learn about the full security requirements. This guide is only provided to give you:
- A brief overview of the [differences and similarities](#overview-of-ocpp-security-requirements) in the security architecture between OCPP versions
- A [set of examples](#ocpp-security-implementation-examples) for how to begin implementing the different OCPP security profiles using ocpp-rpc.

## Overview of OCPP security requirements

### Charge point identities

A charging station is free to choose their own identity and/or make available a way for an owner/operator to change that identity. However, there are differing constraints on what the identity can look like depending on the OCPP version and Security Profile being used:

#### Security profile 0 (no auth)

OCPP 1.6 defines the identity as a string, with no additional restrictions.

OCPP 2+ defines the identity as a string no longer than 48 characters, only containing characters from this list: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-_=+|@.`

#### Security profiles 1 & 2 (basic auth)

In addition to profile 0 requirements, profiles 1 & 2 require basic auth (RFC 2617) credentials to authenticate the charging station, and the identity will be used as the basic auth username.

RFC 2617 imposes restrictions on the characters which can be used in basic auth usernames; Namely, they must not contain colons.

> userid      = *<TEXT excluding ":">  
> password    = *TEXT
>
> <cite>- [RFC 2617, section 2](https://datatracker.ietf.org/doc/html/rfc2617#section-2)</cite>

> [!TIP]
> Despite these restrictions, ocpp-rpc's RPCServer *does* fully support colons in charging station identities without ambiguity, if this is something that you need to support.

#### Security profile 3 (mTLS auth)

Security profile 3 does not add any additional requirements on top of profile 0.

> [!NOTE]
> Under security profile 3, the common name (CN) of the charging station's X509 certificate should contain the charging station's unique serial number - not its identity.

### Passwords / authorization keys

OCPP Security profiles 1 & 2 require a basic auth (RFC 2617) password to authenticate the charging station with the CSMS.

**In OCPP 1.6**, the basic auth password is sometimes referred to as the "authorization key". This term has been a continual point of confusion, however, as it is used interchangeably to refer to either:
- The RFC 2617 basic auth password itself, which is 16-20 bytes of random binary data., or...
- The configuration key (named `"AuthorizationKey"`), which is a write-only field that requires you to wrap the 16-20 byte password as a 32-40 character hexadecimal-encoded string in order to be able to transport it safely within a `ChangeConfiguration` request.

Adding to this confusion, the RFC 2617 specification of basic authentication does not permit certain characters inside the basic auth password (namely, bytes `0x00`-`0x09`, `0x0B`-`0x0C`, `0x0E`-`0x1F`, `0x7F`). Since a "randomly generated binary" password is seemingly incompatible with RFC 2617, it suggests that maybe the OCA's intent was for the hex-encoded representation of the password to be used as the basic auth password itself (- but this is not the case).

And then the cherry on top: From OCPP 2.0.1 onwards, the basic auth password is intended to be a 16-40 (or sometimes 16-64) *character*, UTF-8 encoded string, further clouding the intent for OCPP 1.6.

Needless to say, these inconsistencies and the [resulting confusion](https://github.com/steve-community/steve/issues/1895#issuecomment-3617799115) have led to various [incompatibilities](https://github.com/EVerest/EVerest/issues/2034) across the EV charging ecosystem, and this is probably the main reason why OCPP 2.0.1 onwards has distanced itself from the usage of the term "authorization key" almost entirely, and re-worked and re-labelled the configuration variable as `BasicAuthPassword` instead.

The OCPP 2.0.1 spec is at pains to say:

> Please note, that the encoding of the basic authentication password in OCPP 2.0.1 (A00.FR.205) differs from how this was done in OCPP 1.6.
>
> <cite>- OCPP 2.0.1 [Edition 4, 2025-12-03], section 1.3.2</cite>

So, from OCPP 2.0.1 going forward, the password is no longer hex-encoded for transport purposes, and is naturally encoded in a format that is both compatible with the OCPP JSON transport *and* with standard implementations of HTTP basic auth.

> [!TIP]
> If you need to support both OCPP 1.6 and 2+ simultaneously though, don't worry; ocpp-rpc always handles the password as a `Buffer`, allowing you to choose whether to interpret it as a UTF-8 string or not.
>
> See the note under the example for [security profile 1](#security-profile-1-unsecured-transport-with-basic-authentication) for more information.

### Password requirements across OCPP versions

Different OCPP versions impose different requirements for the length and content of the basic auth password, which are catalogued here:

- In the original OCPP1.6-J spec, the AuthorizationKey (configuration key) was defined as a 40-character hexidecimal representation of a 20-byte password:

  > To set a charge point’s [basic authentication password] via OCPP, the Central System SHALL send the Charge Point a ChangeConfiguration.req message with the key AuthorizationKey and as the value a 40-character hexadecimal representation of the 20-byte [basic authentication password].
  >
  > <cite>- OCPP-J 1.6 Specification [FINAL, 2015-10-08]</cite>  
  > (with edits made for clarity)

- In the subsequent security whitepapers ("Improved security for OCPP 1.6-J"), the AuthorizationKey (configuration key) was redefined to be a 32-to-40-character hexidecimal representation of a 16-to-20-byte password:

  > The basic authentication password is used for HTTP Basic Authentication, minimal length: 16 bytes. It is strongly advised to be randomly generated binary to get maximal entropy. Hexadecimal represented (20 bytes maximum, represented as a string of up to 40 hexadecimal digits).
  >
  > <cite>- Improved security for OCPP 1.6-J [edition 4, 2026-02-05]</cite>

- OCPP 2.0.1 and 2.1 changes the maximum length upper bound, and measures the length of the password in UTF-8 characters rather than in bytes (not that this distinction makes any difference, as pointed out [later in this guide](#for-csms-developers-implementing-ocpp-201-or-21)):

  > The basic authentication password is used for HTTP Basic Authentication. The password SHALL be a randomly chosen passwordString with a sufficiently high entropy, consisting of minimum 16 and a maximum as defined by the maxLimit of BasicAuthPassword, which must be at least 40 characters and at most 64.
  >
  > <cite>- OCPP 2.0.1 [Edition 4, 2025-12-03], section 2.2.1</cite>

In light of these requirements and the [problems detailed above](#passwords-authorization-keys), here are a few recommendations on how best to ensure compatibility with your charging station or CSMS:

#### For CSMS developers implementing OCPP 1.6:

  - When changing the password of a charging station, ensure that its raw (non-hex encoded) form consists solely of ASCII characters. This way, if the charging station tries to decode it from hex into an ASCII string (or unicode string for that matter), then it can be stored as plain text (perhaps in an XML or JSON file) without corruption. It also ensures that if the charging station uses a library with a strict interpretation of RFC 2617 for basic auth, then the password will not break the encoding of the auth header. Admittedly, this does go against the advice to use "randomly generated binary" - but this strategy is better for compatibility.

  - When authenticating a charging station using a basic auth password, perform a 2-pass authentication check:

      1) First, check the password as provided.
      2) If the password provided was incorrect, but it looks like a hex string, then attempt to decode the hex string into a new password and try to check it again.

    This technique ensures that if the charging station mistakenly uses the hex-encoded `AuthorizationKey` as its basic auth password instead of its raw binary form, then it can still connect to your system.

#### For CSMS developers implementing OCPP 2.0.1 or 2.1:

  - Despite mandating that the password is a UTF-8 encoded string, the OCPP 2+ specifications do limit the possible character space to the following subset of ASCII characters: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-_=:+|~.`
  
    Yes, sadly this means you can't use emojis in your passwords, sorry!

    On the bright side, this ensures that (for a properly encoded UTF-8 password), the character length and byte length will be exactly the same. (One less possible ambiguity. *Phew!*)

  - A simple way to generate a compatible password is to base64url-encode some random bytes, like so: `require('crypto').randomBytes(48).toString('base64url')`. This will produce a valid 64-character password with high entropy.

    > [!CAUTION]
    > If following this advice, be sure to convert the random bytes to `base64url` and not `base64` by mistake, as otherwise this can introduce a `/` character which is not on the permitted character list.

#### For Charging Station developers implementing OCPP 1.6:
  - Be prepared for CSMSes to send an `AuthorizationKey` that does not fit the length requirements of the spec. CSMS implementations vary wildly in their interpretation of whether the `AuthorizationKey` should be 20, 40, or even 80 characters long.

  - Always treat the `AuthorizationKey` as a hex-encoded blob of data. Always reject a ChangeConfiguration request that tries to set the configuration with a non-hex value.

  - When using ocpp-rpc as the RPC client, the password should ideally be passed in the constructor options as a `Buffer`, and not as a string, like so:

    ```js
    const client = new RPCClient({
        identity: 'Example',
        password: Buffer.from('48656C6C6F2C206F6370702D72706320F09F9889', 'hex')
                            // ^ Your `AuthorizationKey` here
    });
    ```

#### For Charging Station developers implementing OCPP 2.0.1 or 2.1:

  - The `BasicAuthPassword` configuration variable in OCPP 2+ is restricted to the following list of UTF-8 characters: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-_=:+|~.`  
    It's advised to reject any change of password which includes a character that is not in this list.

    > [!CAUTION]
    > If you accept passwords containing UTF-8 characters outside of this subset, then you are opening up the possibility of 4-byte characters (such as emoji), and almost endless compound characters/grapheme clusters (depending on how you count characters), potentially ballooning the password up to 255,000+ bytes long in the worst case scenario.


### TLS requirements

All modern versions of OCPP require TLS v1.2 or greater.

Prior to 2026-02-05, OCPP 1.6 was granted an exception to this rule:

> To provide an adequate level of security for legacy Charge Points that cannot support TLS v1.2 or above, TLS v1.0 or v1.1 MAY be used with cypher suite TLS_RSA_WITH_AES_128_CBC_SHA.
>
> <cite>- Improved security for OCPP 1.6-J [edition 3 FINAL, 2022-02-17], section 2.4</cite>

However, this exception has been rescinded in subsequent editions of the whitepaper.

> [!WARNING]
> Since this exception was only removed in 2026, CSMSes should anticipate that many charging stations manufactured before this date may still only support TLS v1.0 or v1.1.

#### Cipher suite requirements

OCPP has set consistent requirements for TLS cipher suites (aside from the one exception above). These rules apply to all versions of OCPP since the concept of security profiles was first introduced in 2018:

> The Central System SHALL support at least the following four cipher suites:  
> **TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256**  
> **TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384**  
> **TLS_RSA_WITH_AES_128_GCM_SHA256**  
> **TLS_RSA_WITH_AES_256_GCM_SHA384**  
>
> Note: The Central System will have to provide 2 different certificates to support both Digital Signature Algorithms (RSA and ECDSA). Also when using security profile 3, the Central System should be capable of generating client side certificates for both Digital Signature Algorithms.
>
> <cite>- Improved security for OCPP 1.6-J [edition 4, 2026-02-05], A00.FR.317, section 2.4.1</cite>

> The Charging Station SHALL support at least the cipher suites:  
> ( **TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256**  
> AND  
> **TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384** )  
> OR  
> ( **TLS_RSA_WITH_AES_128_GCM_SHA256**  
> AND  
> **TLS_RSA_WITH_AES_256_GCM_SHA384** )  
>
> Note 1: TLS_RSA does not support forward secrecy, therefore TLS_ECDHE is RECOMMENDED. In certain jurisdictions forward secrecy is mandatory. Furthermore, if the Charging Station detects an algorithm used that is not secure, it SHOULD trigger an InvalidTLSCipherSuite security event (See part 2 appendices for the full list of security events).
>
> Note 2: Please note that ISO15118-2 prescribes to implement the following cipher suites for the communication between EV and Charging Station:  
> **TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA256**,  
> **TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256**
>
> <cite>- OCPP 2.1 Part 2 [Edition 2, 2025-12-03], A00.FR.319, section 1.3.5</cite>

### PKI & security hierarchy

Traditionally, it has been quite common for chargers and CSMSes alike to use standard web CA bundles (like those bundled with operating systems and web browsers) to provide a root of trust for establishing security between them. It was not uncommon to see CSMSes secured with LetsEncrypt certificates, or a Cloudflare HTTPS proxy, for convenience.

However, this is not good practice. While it works somewhat ok for OCPP 1.6, it breaks part of the security model for OCPP 2+.

For the avoidance of doubt, here's a quote from the OCPP 1.6 security whitepaper:

> It is not recommended to have preinstalled well-known root CA certificates as used in operating systems or browsers on a Charge Point, like for example a CA bundle. Only root and intermediate certificates part of the Charge Point Operator hierarchy should be used for the OCPP connection, as described by section Certificate Hierarchy. Trusting many additional well-known root CA certificates creates security risks.
>
> <cite>- Improved security for OCPP 1.6-J [edition 4, 2026-02-05]</cite>

Instead, the modern OCPP specs (along with the OCPP 1.6 security whitepaper) provides mechanisms to install/update/delete root certificates for different use-cases. This is the preferred way to establish & maintain a secure trust relationship between the charger and CSMS.

> [!NOTE]
> Prior to 2018, the published OCPP specs provided no advice on PKI. As a result, many charging stations manufactured before 2018 either assumed CSMSes would use TLS certificates that chained back to well-known browser/OS certificate authorities, or in many cases did not perform any trust-chain verification at all.
>
> If you need to support chargers like this, you may wish to operate a separate endpoint for them, or explore using SNI to allow a single server instance to operate using multiple PKI hierarchies.

## OCPP security implementation examples

### Security Profile 1 - Unsecured transport with basic authentication

This security profile requires HTTP Basic Authentication. Clients are able to provide a HTTP basic auth password via the `password` option of the [`RPCClient` constructor](../classes/RPCClient.html#constructor). Servers are able to validate the password within the callback passed to [`auth()`](../classes/RPCServer.html#auth).

#### Client & Server Example

```js
const server = new RPCServer();
server.auth((accept, reject, handshake) => {
    if (handshake.identity === "AzureDiamond" && handshake.password.toString('utf8') === "hunter2") {
        accept();
    } else {
        reject(401);
    }
});
await server.listen(3080);

const cli = new RPCClient({
    endpoint: "ws://localhost:3080",
    identity: "AzureDiamond",
    password: "hunter2",
});
await cli.connect();
```

> [!TIP]
> During the RPCServer's auth callback, the password is provided to you as a `Buffer` rather than a `string`. This is to ensure backwards compatibility with OCPP 1.6. (While OCPP 2+ requires that the password must be a valid UTF-8 string, the OCPP 1.6 security whitepaper advises that passwords consist of randomly generated binary data instead.)
>
> Since all UTF-8 strings can be represented as binary data (but not vice versa), it is recommended to perform authentication checks using the binary representation of the password in order to be compatible with all versions of OCPP. However, if you're only dealing with OCPP 2+ or a custom protocol (and therefore you know all passwords should be encodable as UTF-8) then you can safely call `password.toString('utf8')` and perform string comparisons as per the previous example, if you want to.

### Security Profile 2 - TLS with basic authentication

This security profile requires that the central system offers a TLS-secured endpoint in addition to HTTP Basic Authentication [(as per profile 1)](#security-profile-1-unsecured-transport-with-basic-authentication).

When implementing TLS, keep in mind that OCPP specifies a [minimum TLS version](#tls-requirements) and [minimum set of cipher suites](#cipher-suite-requirements) for maximal compatibility and security. Node.js natively supports this minimum set of requirements, but there's a couple of things you should keep in mind:

* The minimum TLS version should be explicitly enforced to prevent a client from using a weak TLS version. The OCPP spec currently sets the minimum TLS version at v1.2 (with v1.1 and v1.0 being permitted for OCPP1.6 only under exceptional circumstances).
* The central server role must support both RSA & ECDSA algorithms, so will need a corresponding key and certificate for each.

#### TLS Client Example

```js
import { RPCClient } from 'ocpp-rpc';

const cli = new RPCClient({
    endpoint: 'wss://localhost',
    identity: 'EXAMPLE',
    password: 'monkey1',
    wsOpts: { minVersion: 'TLSv1.2' }
});

await cli.connect();
```

#### TLS Server Example

Implementing TLS on the server can be achieved in a couple of different ways. The most direct way is to [create an HTTPS server](https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener), giving you full end-to-end control over the TLS connectivity.

```js
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { RPCServer } from 'ocpp-rpc';

const server = new RPCServer();

const httpsServer = https.createServer({
    cert: [
        await readFile('./server.crt', 'utf8'), // RSA certificate
        await readFile('./ec_server.crt', 'utf8'), // ECDSA certificate
    ],
    key: [
        await readFile('./server.key', 'utf8'), // RSA key
        await readFile('./ec_server.key', 'utf8'), // ECDSA key
    ],
    minVersion: 'TLSv1.2', // require TLS >= v1.2
});

httpsServer.on('upgrade', server.handleUpgrade);
httpsServer.listen(443);

server.auth((accept, reject, handshake) => {
    const tlsClient = handshake.request.client;

    if (!tlsClient) {
        return reject();
    }

    console.log(`${handshake.identity} connected using TLS:`, {
        password: handshake.password, // the HTTP auth password
        cert: tlsClient.getCertificate(), // the certificate used by the server
        cipher: tlsClient.getCipher(), // the cipher suite
        version: tlsClient.getProtocol(), // the TLS version
    });
    accept();
});
```

Alternatively, your TLS endpoint might be terminated at a different service (e.g. an Ingress controller in a Kubernetes environment or a third-party SaaS reverse-proxy). In this case, you may be able to manage your server's TLS through configuration of the relevant service.

Whatever the case, be sure to keep in mind the [PKI Recommendations](#pki-security-hierarchy) above.

### Security Profile 3 - TLS with client side certificates

This security profile requires a TLS-secured central system, and client-side certificates; This is also known as "Mutual TLS" (or "mTLS" for short).

The client-side example is fairly straight-forward:

#### mTLS Client Example

```js
import { RPCClient } from 'ocpp-rpc';
import { readFile } from 'node:fs/promises';

// Read PEM-encoded certificate & key
const cert = await readFile('./client.crt', 'utf8');
const key = await readFile('./client.key', 'utf8');

const cli = new RPCClient({
    endpoint: 'wss://localhost',
    identity: 'EXAMPLE',
    wsOpts: { cert, key, minVersion: 'TLSv1.2' }
});

await cli.connect();
```

#### mTLS Server Example

This example is very similar to the example for [security profile 2](#security-profile-2-tls-with-basic-authentication), except for these changes:

* The HTTPS server needs the option `requestCert: true` to allow the client to send its certificate.
* The client's certificate can be inspected during the auth() callback via `handshake.request.client.getPeerCertificate()`.
* A HTTP auth password is no longer required.

> [!NOTE]
> If the client does not present a certificate (or the presented certificate is invalid), [`getPeerCertificate()`](https://nodejs.org/api/tls.html#tlssocketgetpeercertificatedetailed) will return an empty object instead.

```js
import https from 'node:https';
import { RPCServer } from 'ocpp-rpc';
import { readFile } from 'node:fs/promises';

const server = new RPCServer();

const httpsServer = https.createServer({
    cert: [
        await readFile('./server.crt', 'utf8'), // RSA certificate
        await readFile('./ec_server.crt', 'utf8'), // ECDSA certificate
    ],
    key: [
        await readFile('./server.key', 'utf8'), // RSA key
        await readFile('./ec_server.key', 'utf8'), // ECDSA key
    ],
    minVersion: 'TLSv1.2', // require TLS >= v1.2
    requestCert: true, // ask client for a certificate
});

httpsServer.on('upgrade', server.handleUpgrade);
httpsServer.listen(443);

server.auth((accept, reject, handshake) => {
    const tlsClient = handshake.request.client;

    if (!tlsClient) {
        return reject();
    }

    console.log(`${handshake.identity} connected using TLS:`, {
        clientCert: tlsClient.getPeerCertificate(), // the certificate used by the client
        serverCert: tlsClient.getCertificate(), // the certificate used by the server
        cipher: tlsClient.getCipher(), // the cipher suite
        version: tlsClient.getProtocol(), // the TLS version
    });

    accept();
});
```
