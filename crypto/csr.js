import * as asn1js from 'https://esm.sh/asn1js';
import { encode } from './base64.js';

const OID_MAPPING = {
  commonName: "2.5.4.3",
  organization: "2.5.4.10",
  organizationalUnit: "2.5.4.11",
  locality: "2.5.4.7",
  state: "2.5.4.8",
  country: "2.5.4.6",
  email: "1.2.840.113549.1.9.1"
};

function createAttributeSequence(oid, value) {
  return new asn1js.Sequence({
    value: [
      new asn1js.ObjectIdentifier({ value: oid }),
      new asn1js.Utf8String({ value })
    ]
  });
}

function createSubject(csrInfo) {
  return new asn1js.Sequence({
    value: Object.entries(csrInfo).map(([key, value]) => new asn1js.Set({
      value: [createAttributeSequence(OID_MAPPING[key], value)]
    }))
  })
}

export async function generateCSR(keyPair, info) {
  const subject = createSubject(info);
  const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyInfo = asn1js.fromBER(spki).result;
  const csrInfo = new asn1js.Sequence({
    value: [
      new asn1js.Integer({ value: 0 }),
      subject,
      publicKeyInfo,
      new asn1js.Constructed({
        idBlock: {
          tagClass: 3,
          tagNumber: 0
        },
        value: []
      })
    ]
  });
  const csrInfoBer = csrInfo.toBER(false);
  const signature = await window.crypto.subtle.sign(
    keyPair.privateKey.algorithm,
    keyPair.privateKey,
    csrInfoBer
  );
  const csr = new asn1js.Sequence({
    value: [
      csrInfo,
      new asn1js.Sequence({
        value: [
          new asn1js.ObjectIdentifier({ value: "1.2.840.113549.1.1.11" }), // sha256WithRSAEncryption
          new asn1js.Null()
        ]
      }),
      new asn1js.BitString({ valueHex: signature })
    ]
  });
  return csr.toBER(false);
}

export const generateCSRPem = async (keyPair, info) => {
  const csr = await generateCSR(keyPair, info);
  return [
    "-----BEGIN CERTIFICATE REQUEST-----",
    encode(csr).replace(/(.{64})/g, "$1\n"),
    "-----END CERTIFICATE REQUEST-----"
  ].join("\n");
}
