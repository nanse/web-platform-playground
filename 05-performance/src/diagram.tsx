const SRC = '/diagrams/postmessage-transferable-sharedarraybuffer.svg'

/** 워커에 데이터를 넘기는 세 방법(복사, 옮기기, 같이 쓰기)을 한 장으로 비교한 그림이에요. 글자가 작아서 화면 끝까지 넓혀 보여줘요. */
export function PassingDiagram() {
  return (
    <figure className="-mx-6">
      <a href={SRC} target="_blank" rel="noreferrer">
        <img
          src={SRC}
          alt="메인 스레드에서 워커로 데이터를 넘기는 세 가지 방법. postMessage는 복사본을 만들고, Transferable은 소유권을 옮기고, SharedArrayBuffer는 같은 메모리를 함께 써요."
          className="w-full"
        />
      </a>
      <figcaption className="px-6 text-[13px] text-grey-500">그림을 누르면 크게 볼 수 있어요.</figcaption>
    </figure>
  )
}
