import { createAdminClient } from "@/lib/supabase/admin";
import PythonPractice from "@/components/python-practice";

const demo=[
 {id:"demo-1",title:"First non-repeating character",category:"Python Basics",difficulty:"Medium",prompt:"Given a string s, return the first character that occurs exactly once. Return None if every character repeats.",starter_code:"def first_unique(s):\n    # write your solution\n    pass"},
 {id:"demo-2",title:"Group anagrams",category:"Data Structures",difficulty:"Medium",prompt:"Group a list of strings so that anagrams are together. Preserve any valid grouping order.",starter_code:"def group_anagrams(words):\n    # write your solution\n    pass"},
 {id:"demo-3",title:"Top K frequent values",category:"Algorithms",difficulty:"Hard",prompt:"Return the k most frequent integers from a list. Discuss time and space complexity.",starter_code:"def top_k(nums, k):\n    # write your solution\n    pass"},
];
export default async function Coding(){let questions:any[]=demo;try{const{data,error}=await createAdminClient().from("coding_questions").select("id,title,category,difficulty,prompt,starter_code,course_id").eq("published",true).order("created_at",{ascending:true}).limit(500);if(!error&&data?.length)questions=data}catch{}return <PythonPractice questions={questions}/>}
