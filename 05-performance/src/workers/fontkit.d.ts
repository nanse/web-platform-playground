// fontkit 2에는 타입 파일이 없어서, 이 샘플이 쓰는 것만 적어요.
declare module 'fontkit' {
  type Subset = { encode(): Uint8Array; encodeStream?: () => unknown }
  type Font = { createSubset(): Subset }
  export function create(buffer: Uint8Array): Font
}
