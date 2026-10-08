import {requireChatGPTUser} from "../chatgpt-auth";
import {isProducer} from "@/db/catalog";
import StudentPortal from "../student-portal";
export const dynamic="force-dynamic";
export const metadata={title:"Meus cursos — Arceuz Academy"};
export default async function StudentPage({searchParams}:{searchParams:Promise<{curso?:string}>}){const p=await searchParams;const user=await requireChatGPTUser("/aluno"+(p.curso?`?curso=${encodeURIComponent(p.curso)}`:""));return <StudentPortal courseId={p.curso} producer={isProducer(user)}/>}
