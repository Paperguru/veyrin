import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const demo: Record<string,{expected_code:string;explanation:string;complexity:string}> = {
  "demo-1": { expected_code: `def first_unique(s):
    from collections import Counter
    counts = Counter(s)
    return next((ch for ch in s if counts[ch] == 1), None)`, explanation: "Count frequencies, then scan the original string so order is preserved.", complexity: "O(n) time, O(k) space" },
  "demo-2": { expected_code: `def group_anagrams(words):
    groups = {}
    for word in words:
        key = tuple(sorted(word))
        groups.setdefault(key, []).append(word)
    return list(groups.values())`, explanation: "Use a canonical sorted representation as the dictionary key.", complexity: "O(n * m log m) time" },
  "demo-3": { expected_code: `from collections import Counter
import heapq

def top_k(nums, k):
    return [x for x, _ in heapq.nlargest(k, Counter(nums).items(), key=lambda item: item[1])]`, explanation: "Count values and use a heap-based top-k selection.", complexity: "O(n + u log k) typical" },
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const submittedCode = String(body.code || "");
  if (!submittedCode.trim()) return NextResponse.json({ error: "Submit your code before revealing the solution." }, { status: 400 });
  if (demo[id]) return NextResponse.json(demo[id]);

  const db = createAdminClient();
  const { data: q, error } = await db.from("coding_questions").select("id,expected_code,explanation,complexity,course_id,published").eq("id", id).maybeSingle();
  if (error || !q || !q.published) return NextResponse.json({ error: "Coding question not found" }, { status: 404 });
  if (q.course_id) {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const { data: enrollment } = await db.from("enrollments").select("status").eq("user_id", user.id).eq("course_id", q.course_id).maybeSingle();
    if (enrollment?.status !== "active") return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }
  return NextResponse.json({ expected_code: q.expected_code, explanation: q.explanation || "", complexity: q.complexity || "" });
}
