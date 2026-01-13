const crypto = require('crypto');

function toBase64Url(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generates a VAPID Authorization header
 * @param {string} audience - The origin of the push service (e.g. https://fcm.googleapis.com)
 * @param {string} subject - mailto: email or URL
 * @param {string} privateKeyBase64 - The raw P-256 private key (base64 encoded)
 * @returns {string|null} - The Authorization header value or null on error
 */
function generateVapidHeader(audience, subject, privateKeyBase64) {
    try {
        const header = {
            typ: 'JWT',
            alg: 'ES256'
        };

        const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

        const payload = {
            aud: audience,
            exp: exp,
            sub: subject
        };

        const headerEncoded = toBase64Url(Buffer.from(JSON.stringify(header)));
        const payloadEncoded = toBase64Url(Buffer.from(JSON.stringify(payload)));
        const input = `${headerEncoded}.${payloadEncoded}`;

        // 1. Convert raw private key to KeyObject
        // The VAPID private key is a 32-byte integer.
        // We use ECDH to derive the public key components (x, y) needed for a valid JWK.
        const ecdh = crypto.createECDH('prime256v1');
        ecdh.setPrivateKey(Buffer.from(privateKeyBase64, 'base64url'));
        const pubKey = ecdh.getPublicKey(); // 0x04 + x + y

        // Extract x and y (skip 0x04 prefix)
        const x = pubKey.slice(1, 33);
        const y = pubKey.slice(33, 65);

        const privateKeyObject = crypto.createPrivateKey({
            key: {
                kty: 'EC',
                crv: 'P-256',
                d: toBase64Url(Buffer.from(privateKeyBase64, 'base64url')),
                x: toBase64Url(x),
                y: toBase64Url(y)
            },
            format: 'jwk'
        });

        // 2. Sign
        const signature = crypto.sign(null, Buffer.from(input), privateKeyObject);

        // 3. Convert DER signature to Raw (R|S)
        // DER: 0x30 | Len | 0x02 | LenR | R | 0x02 | LenS | S
        // We just need R and S, padded to 32 bytes each.
        const rawSignature = derToRaw(signature);
        const signatureEncoded = toBase64Url(rawSignature);

        return `vapid t=${headerEncoded}.${payloadEncoded}.${signatureEncoded}, k=${toBase64Url(pubKey)}`;
    } catch (err) {
        console.error('VAPID generation failed:', err);
        return null;
    }
}

function derToRaw(signature) {
    let offset = 2; // Sequence tag + len

    // R
    offset++; // Tag 0x02
    let rLen = signature[offset++];
    let r = signature.slice(offset, offset + rLen);
    offset += rLen;

    // S
    offset++; // Tag 0x02
    let sLen = signature[offset++];
    let s = signature.slice(offset, offset + sLen);

    // Pad or trim to 32 bytes
    const to32 = (b) => {
        // If leading zero (positive Int sign), trim it if length > 32
        if (b.length > 32 && b[0] === 0) b = b.slice(1);
        if (b.length < 32) {
            const pad = Buffer.alloc(32 - b.length);
            b = Buffer.concat([pad, b]);
        }
        return b;
    };

    return Buffer.concat([to32(r), to32(s)]);
}

module.exports = {
    generateVapidHeader
};
