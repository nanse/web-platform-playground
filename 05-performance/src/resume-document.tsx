// "인쇄 창으로 저장"에서 인쇄할 이력서예요. 서버도 이런 HTML을 크롬으로 PDF로 인쇄해요.
import type { ReactNode } from 'react'
import { careerMeta, educationMeta, projectMeta, totalCareer, type Resume } from './resume'

// 인쇄할 때만 Pretendard를 받아요. 앱 화면 글꼴에는 영향이 없게 다른 이름을 붙여요.
const FAMILY = 'Resume Pretendard'
const FONTS = [
  new FontFace(FAMILY, `url(${new URL('../node_modules/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2', import.meta.url).href}) format('woff2')`, {
    weight: '500',
  }),
  new FontFace(FAMILY, `url(${new URL('../node_modules/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2', import.meta.url).href}) format('woff2')`, {
    weight: '700',
  }),
]

/** 글꼴을 다 받은 뒤 인쇄 창을 열어요. document.title이 저장할 PDF의 기본 파일 이름이 돼요. */
export async function printResume(data: Resume) {
  FONTS.forEach((font) => document.fonts.add(font))
  await Promise.all(FONTS.map((font) => font.load()))
  const title = document.title
  document.title = `${data.resume.name}_이력서`
  addEventListener('afterprint', () => (document.title = title), { once: true })
  print()
}

function Meta({ parts, className = '' }: { parts: string[]; className?: string }) {
  return (
    <p className={`flex flex-wrap ${className}`}>
      {parts.map((part) => (
        <span key={part} className="border-l border-[#e1e2e4] px-2 first:border-0 first:pl-0">
          {part}
        </span>
      ))}
    </p>
  )
}

function Section({ title, note, className = '', children }: { title: string; note?: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <h2 className="flex items-baseline gap-2 border-b border-[#171719] pb-3 text-[16px] font-bold">
        {title}
        {note && <span className="text-[12px] font-medium text-[#888]">{note}</span>}
      </h2>
      {children}
    </section>
  )
}

function Logo({ initial }: { initial: string }) {
  return (
    <span className="grid size-[34px] shrink-0 place-items-center rounded-md border border-[#e1e2e4] bg-[#f7f7f8] text-[14px] font-bold text-[#888]">
      {initial}
    </span>
  )
}

// Pretendard는 '->'를 화살표(→)로 바꾸는 기능(calt)이 있어서, 쓴 글자 그대로 나오게 꺼요(font-variant-ligatures: none).
export function ResumeDocument({ data }: { data: Resume }) {
  return (
    <article className="text-[13px] leading-[1.7] font-medium text-[#171719]" style={{ fontFamily: `'${FAMILY}', sans-serif`, fontVariantLigatures: 'none' }}>
      <h1 className="text-[24px] font-bold">{data.resume.name}</h1>
      <Meta parts={[data.resume.mobile, data.resume.email]} className="mt-1 text-[12px] text-[#888]" />
      <p className="mt-6 text-[14px] whitespace-pre-line">{data.resume.about}</p>

      <Section title="경력" note={totalCareer(data)} className="mt-16">
        {data.careers.map((career) => (
          <div key={career.company.name + career.start_time} className="mt-6 flex gap-5">
            <Logo initial={career.company.name[0]} />
            <div className="min-w-0 flex-1">
              <div className="border-b border-[#e1e2e4] pb-3 break-after-avoid">
                <p className="text-[14px] font-bold">{career.company.name}</p>
                <Meta parts={careerMeta(career)} className="text-[14px]" />
              </div>
              {career.projects.map((project) => (
                <div key={project.title} className="mt-5">
                  {/* 제목과 기간이 쪽 끝에 홀로 남지 않게 해요. */}
                  <div className="break-inside-avoid break-after-avoid">
                    <p className="text-[14px] font-bold">{project.title}</p>
                    <Meta parts={projectMeta(project)} className="font-bold" />
                  </div>
                  <p className="mt-1 whitespace-pre-line">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* 서버 PDF처럼 학력은 새 쪽에서 시작해요. */}
      <Section title="학력" className="break-before-page">
        {data.educations.map((education) => (
          <div key={education.school_name} className="mt-6 flex gap-5">
            <Logo initial={education.school_name[0]} />
            <div>
              <p className="text-[14px] font-bold">{education.school_name}</p>
              <Meta parts={educationMeta(education)} />
            </div>
          </div>
        ))}
      </Section>
    </article>
  )
}
