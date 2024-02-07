export function charFromEmojiObject(obj: any) {
  return charFromUtf16(obj.unified);
}

function charFromUtf16(utf16: any): string {
  return String.fromCodePoint(...utf16.split('-').map((codeElement: string) => '0x' + codeElement));
}
