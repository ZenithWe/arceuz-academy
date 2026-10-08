import { env } from "cloudflare:workers";
import { sampleCourses,type Course,type Snapshot,type Order,type Enrollment } from "@/lib/arceuz";
export const database=()=>{if(!env.DB)throw new Error("Banco de dados indisponível");return env.DB};
const json=(x:unknown)=>JSON.stringify(x);
export async function initialize(owner:string){
 const db=database();const existing=await db.prepare("SELECT owner FROM workspaces WHERE owner = ?").bind(owner).first();if(existing)return;
 const scoped=sampleCourses.map(c=>({...c,id:owner+"-"+c.id}));
 const statements=scoped.map(c=>db.prepare("INSERT OR IGNORE INTO courses (id,owner,data) VALUES (?,?,?)").bind(c.id,owner,json(c)));
 const names=["Mariana Silva","Lucas Oliveira","Camila Santos","Rafael Costa","Valentina García","Santiago López","Ana Pereira","Pedro Almeida","Isabella Torres","Gabriel Souza","Sofía Martínez","Mateus Lima"];
 const countries=["Brasil","Brasil","Brasil","México","Colômbia","Argentina","Chile","Brasil"];
 for(let i=0;i<184;i++){const c=scoped[i%3];const createdAt=new Date(Date.now()-((i<106?i%30:30+i%30)*86400000)-((i%19)*3600000)).toISOString();const id=owner+"-sample-"+i;const name=names[i%names.length];const email="aluno"+(i+1)+"@exemplo.invalid";const order:Order={id,courseId:c.id,name,email,country:countries[i%8],source:["Direto / orgânico","Afiliados","Tráfego pago","Direto / orgânico","Outros"][i%5],method:i%3===0?"Pix":"Cartão",amount:c.price,status:i%17===0?"Pendente":i%23===0?"Reembolsada":"Aprovada",createdAt,isDemo:1};
 statements.push(db.prepare("INSERT OR IGNORE INTO orders (id,owner,course_id,data) VALUES (?,?,?,?)").bind(id,owner,c.id,json(order)));
 if(order.status==="Aprovada"){const e:Enrollment={id,courseId:c.id,name,email,learnerId:null,createdAt};statements.push(db.prepare("INSERT OR IGNORE INTO enrollments (id,owner,course_id,email,learner_id,data) VALUES (?,?,?,?,?,?)").bind(id,owner,c.id,email,null,json(e)));for(const l of c.lessons.slice(0,i%(c.lessons.length+1)))statements.push(db.prepare("INSERT OR IGNORE INTO lesson_progress (enrollment_id,lesson_id) VALUES (?,?)").bind(id,l.id));}}
 // Schema is migration-owned. Sample records are inserted once per private workspace.
 statements.push(db.prepare("INSERT OR IGNORE INTO workspaces (owner,settings) VALUES (?,?)").bind(owner,json({name:"Meu negócio",description:"Conhecimento que transforma."})));
 await db.batch(statements);
}
export async function snapshot(user:{userId:string;displayName:string;email:string}):Promise<Snapshot>{await initialize(user.userId);const db=database();const [cs,os,es,ps,ws]=await Promise.all([db.prepare("SELECT data FROM courses WHERE owner = ?").bind(user.userId).all<{data:string}>(),db.prepare("SELECT data FROM orders WHERE owner = ?").bind(user.userId).all<{data:string}>(),db.prepare("SELECT data FROM enrollments WHERE owner = ?").bind(user.userId).all<{data:string}>(),db.prepare("SELECT p.enrollment_id AS enrollmentId,p.lesson_id AS lessonId FROM lesson_progress p JOIN enrollments e ON e.id=p.enrollment_id WHERE e.owner = ?").bind(user.userId).all<{enrollmentId:string;lessonId:string}>(),db.prepare("SELECT settings FROM workspaces WHERE owner = ?").bind(user.userId).first<{settings:string}>()]);return {courses:cs.results.map(r=>JSON.parse(r.data)),orders:os.results.map(r=>JSON.parse(r.data)),enrollments:es.results.map(r=>JSON.parse(r.data)),progress:ps.results,settings:JSON.parse(ws!.settings),user:{name:user.displayName,email:user.email,id:user.userId}};}
export async function ownedCourse(owner:string,id:string):Promise<Course|null>{const row=await database().prepare("SELECT data FROM courses WHERE owner = ? AND id = ?").bind(owner,id).first<{data:string}>();return row?JSON.parse(row.data):null;}
