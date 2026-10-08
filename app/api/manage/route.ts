import {getChatGPTUser} from "@/app/chatgpt-auth";
import {database,initialize,ownedCourse,snapshot} from "@/db/store";
import {z} from "zod";
import {isProducer,bindProducer} from "@/db/catalog";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(){try{const user=await getChatGPTUser();if(!user)return reply({error:"Entre na sua conta para acessar o workspace."},401);if(!isProducer(user))return reply({error:"Acesso restrito ao produtor."},403);await bindProducer(user);return reply(await snapshot(user));}catch(e){console.error("snapshot",e);return reply({error:"Não foi possível carregar seus dados. Tente novamente."},503);}}
const lesson=z.object({id:z.string().min(1).max(80),module:z.string().min(1).max(100),title:z.string().min(2).max(160),minutes:z.number().int().min(1).max(600),content:z.string().min(5).max(20000),videoUrl:z.string().max(2000).optional()});
const courseSchema=z.object({id:z.string().max(200).optional(),title:z.string().trim().min(3).max(150),description:z.string().trim().min(10).max(4000),category:z.string().min(1).max(80),price:z.number().int().min(0).max(10000000),status:z.enum(["Publicado","Rascunho","Arquivado"]),accent:z.enum(["orange","black","neutral"]),instructor:z.string().trim().min(2).max(100),lessons:z.array(lesson).min(1).max(200)}).refine(c=>new Set(c.lessons.map(l=>l.id)).size===c.lessons.length,"Cada aula precisa ter um identificador único.").refine(c=>c.lessons.every(l=>!l.videoUrl||/^https:\/\//i.test(l.videoUrl)),"Use uma URL HTTPS para o vídeo.");
export async function POST(req:Request){try{
 const user=await getChatGPTUser();if(!user)return reply({error:"Entre na sua conta para continuar."},401);
 if(!isProducer(user))return reply({error:"Acesso restrito ao produtor."},403);
 const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin)return reply({error:"Origem inválida."},403);
 const body=z.object({action:z.string()}).passthrough().parse(await req.json());await initialize(user.userId);const db=database();let result:unknown={ok:true};
 if(body.action==="save-course"){
 const parsed=courseSchema.parse(body.course);const old=parsed.id?await ownedCourse(user.userId,parsed.id):null;if(parsed.id&&!old)return reply({error:"Produto não encontrado."},404);
 // Keep completed lessons referentially stable when editing a course with students.
 if(old){const enrollment=await db.prepare("SELECT id FROM enrollments WHERE owner = ? AND course_id = ? LIMIT 1").bind(user.userId,old.id).first();if(enrollment&&old.lessons.some(l=>!parsed.lessons.some(n=>n.id===l.id)))return reply({error:"Um curso com alunos deve manter suas aulas existentes. Você pode editar ou adicionar aulas."},409);}
 const course={...parsed,id:old?.id??crypto.randomUUID(),createdAt:old?.createdAt??new Date().toISOString()};await db.prepare("INSERT INTO courses (id,owner,data) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE courses.owner=excluded.owner").bind(course.id,user.userId,JSON.stringify(course)).run();result={ok:true,id:course.id};
 }else if(body.action==="checkout-demo"){
 const input=z.object({courseId:z.string(),name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(200),country:z.enum(["Brasil","México","Colômbia","Argentina","Chile","Peru","Outro"]),method:z.enum(["Pix","Cartão"])}).parse(body);
 const c=await ownedCourse(user.userId,input.courseId);if(!c||c.status!=="Publicado")return reply({error:"Este curso não está disponível para matrícula."},404);
 const email=user.email.toLowerCase();if(input.email.toLowerCase()!==email)return reply({error:"Use o e-mail da sua conta para acessar as aulas após a matrícula."},400);
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(user.userId+"|"+c.id+"|"+email));const id="demo-"+Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,"0")).join("");const now=new Date().toISOString();
 const order={id,courseId:c.id,name:input.name,email,country:input.country,method:input.method,source:"Direto / orgânico",amount:c.price,status:"Aprovada",createdAt:now,isDemo:1};const enrollment={id,courseId:c.id,name:input.name,email,learnerId:user.userId,createdAt:now};
 await db.batch([db.prepare("INSERT OR IGNORE INTO orders (id,owner,course_id,data) VALUES (?,?,?,?)").bind(id,user.userId,c.id,JSON.stringify(order)),db.prepare("INSERT OR IGNORE INTO enrollments (id,owner,course_id,email,learner_id,data) VALUES (?,?,?,?,?,?)").bind(id,user.userId,c.id,email,user.userId,JSON.stringify(enrollment))]);result={ok:true,id,courseId:c.id,mode:"demo"};
 }else if(body.action==="complete-lesson"){
 const input=z.object({courseId:z.string(),lessonId:z.string()}).parse(body);const c=await ownedCourse(user.userId,input.courseId);if(!c||!c.lessons.some(l=>l.id===input.lessonId))return reply({error:"Aula não encontrada."},404);const e=await db.prepare("SELECT id FROM enrollments WHERE owner = ? AND course_id = ? AND learner_id = ?").bind(user.userId,c.id,user.userId).first<{id:string}>();if(!e)return reply({error:"Matricule-se para registrar seu progresso."},403);await db.prepare("INSERT OR IGNORE INTO lesson_progress (enrollment_id,lesson_id) VALUES (?,?)").bind(e.id,input.lessonId).run();
 }else if(body.action==="save-settings"){
 const settings=z.object({name:z.string().trim().min(2).max(80),description:z.string().trim().max(200)}).parse(body.settings);await db.prepare("UPDATE workspaces SET settings = ? WHERE owner = ?").bind(JSON.stringify(settings),user.userId).run();
 }else return reply({error:"Ação inválida."},400);
 return reply(result);
 }catch(e){if(e instanceof z.ZodError)return reply({error:e.errors[0]?.message??"Verifique os campos do formulário."},400);console.error("mutation",e);return reply({error:"Não foi possível salvar. Seus campos foram preservados para uma nova tentativa."},503);}}

