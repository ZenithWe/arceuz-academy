import type {Course, Lesson} from "./arceuz";

export type PublicLesson = Pick<Lesson,"id"|"module"|"title"|"minutes">;
export type PublicCourse = Omit<Course,"lessons"> & {lessons:PublicLesson[]};
export function publicCourse(course:Course):PublicCourse {
  return {...course,lessons:course.lessons.map(({id,module,title,minutes})=>({id,module,title,minutes}))};
}
export const duration=(course:PublicCourse)=>course.lessons.reduce((total,lesson)=>total+lesson.minutes,0);
export const courseUrl=(id:string)=>`/cursos/${encodeURIComponent(id)}`;
export const checkoutUrl=(id:string)=>`/checkout/${encodeURIComponent(id)}`;
