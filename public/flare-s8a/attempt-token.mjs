// Opaque per-run identity (Friend Feedback 002B). A genuine run gets a fresh token; the same
// completed run reuses it for every retry of that one receipt. Never derived from room/encounter/
// score/timestamp — those describe the build, not the attempt, and the whole point of this token
// is to decouple "a new run" from "the same build submitted again."
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function createAttemptToken(){
  const bytes=new Uint8Array(24);
  (globalThis.crypto||{}).getRandomValues?.(bytes);
  if(!bytes.some(Boolean))for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  let token='';
  for(const byte of bytes)token+=ALPHABET[byte%ALPHABET.length];
  return token;
}
