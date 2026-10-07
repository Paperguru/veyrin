import { createAdminClient } from "@/lib/supabase/admin";
import InterviewPractice from "@/components/interview-practice";
import { questions as demoQuestions } from "@/lib/demo-data";

export default async function Interview(){
 let data:any[]=demoQuestions;
 try{
  const r=await createAdminClient().from("questions").select("id,category,role,difficulty,question,course_id,published").eq("published",true).is("course_id",null).order("created_at",{ascending:true}).limit(500);
  if(r.data?.length)data=r.data;
 }catch{}
 return <InterviewPractice questions={data} title="Practise explaining, not memorising." subtitle="Choose an interview category, answer each question yourself, submit it, compare with the expected answer, then continue. No score is recorded."/>;
}
