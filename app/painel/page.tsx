import {requireChatGPTUser} from "../chatgpt-auth";
import {isProducer,bindProducer} from "@/db/catalog";
import {redirect} from "next/navigation";
import ArceuzApp from "../arceuz-app";
export const dynamic="force-dynamic";
export const metadata={title:"Painel do produtor — Arceuz"};
export default async function ProducerPage(){const user=await requireChatGPTUser("/painel");if(!isProducer(user))redirect("/aluno");await bindProducer(user);return <ArceuzApp/>}
