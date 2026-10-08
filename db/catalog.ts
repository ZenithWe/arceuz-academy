import {env} from "cloudflare:workers";
import {database,initialize} from "./store";
import {type ChatGPTUser} from "@/app/chatgpt-auth";
import {type Course,type Snapshot} from "@/lib/arceuz";
import {publicCourse,type PublicCourse} from "@/lib/storefront";

// The identity comes from Sites dispatch; clients cannot choose a producer role.
export function isProducer(user:ChatGPTUser|null):boolean {
  return !!user && !!env.ARCEUZ_OWNER_EMAIL && user.email.toLowerCase()===env.ARCEUZ_OWNER_EMAIL.trim().toLowerCase();
}
export async function bindProducer(user:ChatGPTUser) {
  if(!isProducer(user))throw new Error("Acesso restrito ao produtor.");
  const db=database();
  const current=await catalogOwner();
  // An anonymous first visit can explore the demo before the owner signs in.
  // Preserve enrollments and lesson IDs when that demo becomes the owner's catalog.
  if(current==="arceuz-academy-demo")await db.batch([
    db.prepare("UPDATE courses SET owner=? WHERE owner=?").bind(user.userId,current),
    db.prepare("UPDATE orders SET owner=? WHERE owner=?").bind(user.userId,current),
    db.prepare("UPDATE enrollments SET owner=? WHERE owner=?").bind(user.userId,current),
    db.prepare("INSERT OR IGNORE INTO workspaces (owner,settings) SELECT ?,settings FROM workspaces WHERE owner=?").bind(user.userId,current),
    db.prepare("UPDATE storefront SET owner=? WHERE id='primary'").bind(user.userId)
  ]);
  await initialize(user.userId);
  await database().prepare("INSERT INTO storefront (id,owner) VALUES ('primary',?) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner").bind(user.userId).run();
}
export async function catalogOwner():Promise<string|null> {
  const row=await database().prepare("SELECT owner FROM storefront WHERE id='primary'").first<{owner:string}>();
  return row?.owner??null;
}
export async function catalog(user:ChatGPTUser|null=null):Promise<PublicCourse[]> {
  if(isProducer(user))await bindProducer(user!);
  let owner=await catalogOwner();
  if(!owner){await initialize("arceuz-academy-demo");await database().prepare("INSERT OR IGNORE INTO storefront (id,owner) VALUES ('primary','arceuz-academy-demo')").run();owner=await catalogOwner()}
  const rows=await database().prepare("SELECT data FROM courses WHERE owner=?").bind(owner).all<{data:string}>();
  return rows.results.map(r=>JSON.parse(r.data) as Course).filter(c=>c.status==="Publicado").map(publicCourse);
}
export async function offer(id:string,user:ChatGPTUser|null=null):Promise<PublicCourse|null> {
  return (await catalog(user)).find(c=>c.id===id)??null;
}
export async function learnerSnapshot(user:ChatGPTUser):Promise<Snapshot> {
  const db=database();
  const [cs,es,ps]=await Promise.all([
    db.prepare("SELECT DISTINCT c.data FROM courses c JOIN enrollments e ON e.course_id=c.id WHERE e.learner_id=?").bind(user.userId).all<{data:string}>(),
    db.prepare("SELECT data FROM enrollments WHERE learner_id=?").bind(user.userId).all<{data:string}>(),
    db.prepare("SELECT p.enrollment_id AS enrollmentId,p.lesson_id AS lessonId FROM lesson_progress p JOIN enrollments e ON e.id=p.enrollment_id WHERE e.learner_id=?").bind(user.userId).all<{enrollmentId:string;lessonId:string}>()
  ]);
  return {courses:cs.results.map(r=>JSON.parse(r.data)),enrollments:es.results.map(r=>JSON.parse(r.data)),progress:ps.results,orders:[],settings:{name:"Arceuz Academy",description:"Conhecimento para o seu próximo passo."},user:{id:user.userId,name:user.displayName,email:user.email}};
}
