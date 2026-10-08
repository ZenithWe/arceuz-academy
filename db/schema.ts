import {sqliteTable,text,integer,index,uniqueIndex,primaryKey} from "drizzle-orm/sqlite-core";
export const workspaces=sqliteTable("workspaces",{owner:text("owner").primaryKey(),settings:text("settings").notNull()});
export const storefront=sqliteTable("storefront",{id:text("id").primaryKey(),owner:text("owner").notNull()});
export const courses=sqliteTable("courses",{id:text("id").primaryKey(),owner:text("owner").notNull(),data:text("data").notNull()},t=>[index("idx_courses_owner").on(t.owner)]);
export const orders=sqliteTable("orders",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull().references(()=>courses.id),data:text("data").notNull()},t=>[index("idx_orders_owner").on(t.owner)]);
export const enrollments=sqliteTable("enrollments",{id:text("id").primaryKey(),owner:text("owner").notNull(),courseId:text("course_id").notNull().references(()=>courses.id),email:text("email").notNull(),learnerId:text("learner_id"),data:text("data").notNull()},t=>[uniqueIndex("idx_enrollment_course_email").on(t.owner,t.courseId,t.email),index("idx_enrollment_owner").on(t.owner)]);
export const progress=sqliteTable("lesson_progress",{enrollmentId:text("enrollment_id").notNull().references(()=>enrollments.id),lessonId:text("lesson_id").notNull()},t=>[primaryKey({columns:[t.enrollmentId,t.lessonId]})]);
