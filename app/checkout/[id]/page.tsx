import {notFound} from "next/navigation";
import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {offer,isProducer} from "@/db/catalog";
import StudentPortal from "@/app/student-portal";
export const dynamic="force-dynamic";
export const metadata={title:"Matrícula de demonstração — Arceuz Academy"};
export default async function CheckoutPage({params}:{params:Promise<{id:string}>}){const id=(await params).id;const user=await requireChatGPTUser(`/checkout/${encodeURIComponent(id)}`);if(!await offer(id,user))notFound();return <StudentPortal courseId={id} checkout producer={isProducer(user)}/>}
