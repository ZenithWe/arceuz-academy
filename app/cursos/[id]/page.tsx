import {notFound} from "next/navigation";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {offer,isProducer} from "@/db/catalog";
import {StoreCoursePage} from "@/app/storefront-components";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const c=await offer((await params).id);return {title:c?`${c.title} — Arceuz Academy`:"Curso não encontrado — Arceuz",description:c?.description}}
export default async function CoursePage({params}:{params:Promise<{id:string}>}){const c=await offer((await params).id);if(!c)notFound();const user=await getChatGPTUser();return <StoreCoursePage course={c} producer={isProducer(user)} signedIn={!!user}/>}
