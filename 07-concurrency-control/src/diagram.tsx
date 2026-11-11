/** public/diagrams/의 그림이에요. README도 같은 파일을 써요. 글자가 작아서 화면 끝까지 넓히고, 누르면 크게 열려요. */
export function Diagram({ name, alt }: { name: string; alt: string }) {
  const src = `/diagrams/${name}.svg`
  return (
    <figure className="-mx-6">
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={alt} className="h-auto w-full" />
      </a>
      <figcaption className="px-6 text-[13px] text-grey-500">그림을 누르면 크게 볼 수 있어요.</figcaption>
    </figure>
  )
}
