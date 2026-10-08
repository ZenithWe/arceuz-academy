import {getChatGPTUser} from "@/app/chatgpt-auth";
import {catalogOwner,learnerSnapshot,offer} from "@/db/catalog";
import {database,ownedCourse} from "@/db/store";
import {z} from "zod";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(req:Request) {
 try {
  const user=await getChatGPTUser();if(!user)return reply({error:"Entre na sua conta para acessar seus cursos."},401);
  const data=await learnerSnapshot(user);
  const id=new URL(req.url).searchParams.get("course");
  // Unenrolled users receive lesson titles, never lesson text or video URLs.
  const course=id?await offer(id,user):null;
  if(course&&!data.courses.some(c=>c.id===course.id))data.courses.push({...course,lessons:course.lessons.map(l=>({...l,content:""}))});
  return reply(data);
 }catch(e){console.error("learner",e);return reply({error:"Não foi possível carregar seus cursos. Tente novamente."},503)}
}
export async function POST(req:Request) {
 try {
  const user=await getChatGPTUser();if(!user)return reply({error:"Entre na sua conta para continuar."},401);
  const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin)return reply({error:"Origem inválida."},403);
  const body=z.object({action:z.string()}).passthrough().parse(await req.json());const db=database();
  if(body.action==="checkout-demo") {
   const input=z.object({courseId:z.string(),name:z.string().trim().min(2).max(100),country:z.enum(["Brasil","México","Colômbia","Argentina","Chile","Peru","Outro"]),method:z.enum(["Pix","Cartão"])}).parse(body);
   const course=await offer(input.courseId,user);const owner=await catalogOwner();
   if(!course||!owner)return reply({error:"Este curso não está disponível para matrícula no momento."},404);
   const email=user.email.toLowerCase();
   const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(user.userId+"|"+course.id+"|"+email));
   const id="demo-"+Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
   const createdAt=new Date().toISOString();
   const order={id,courseId:course.id,name:input.name,email,country:input.country,method:input.method,source:"Direto / orgânico",amount:course.price,status:"Aprovada",createdAt,isDemo:1};
   const enrollment={id,courseId:course.id,name:input.name,email,learnerId:user.userId,createdAt};
   await db.batch([
    db.prepare("INSERT OR IGNORE INTO orders (id,owner,course_id,data) VALUES (?,?,?,?)").bind(id,owner,course.id,JSON.stringify(order)),
    db.prepare("INSERT OR IGNORE INTO enrollments (id,owner,course_id,email,learner_id,data) VALUES (?,?,?,?,?,?)").bind(id,owner,course.id,email,user.userId,JSON.stringify(enrollment))
   ]);
   return reply({ok:true,id,courseId:course.id,mode:"demo"});
  }
  if(body.action==="complete-lesson") {
   const input=z.object({courseId:z.string(),lessonId:z.string()}).parse(body);
   const enrollment=await db.prepare("SELECT id,owner FROM enrollments WHERE course_id=? AND learner_id=?").bind(input.courseId,user.userId).first<{id:string;owner:string}>();
   if(!enrollment)return reply({error:"Matricule-se para acessar este curso."},403);
   const course=await ownedCourse(enrollment.owner,input.courseId);
   if(!course?.lessons.some(l=>l.id===input.lessonId))return reply({error:"Aula não encontrada."},404);
   await db.prepare("INSERT OR IGNORE INTO lesson_progress (enrollment_id,lesson_id) VALUES (?,?)").bind(enrollment.id,input.lessonId).run();
   return reply({ok:true});
  }
  return reply({error:"Ação inválida."},400);
 }catch(e){if(e instanceof z.ZodError)return reply({error:"Verifique os dados da matrícula."},400);console.error("learner action",e);return reply({error:"Não foi possível salvar. Tente novamente."},503)}
}
