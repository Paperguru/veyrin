import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Code2,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { courses as demoCourses } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import PurchaseButton from "@/components/purchase-button";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const baseCourse = demoCourses.find((x) => x.slug === slug);

  if (!baseCourse) {
    return (
      <main className="page">
        <div className="container">
          <div className="error">Course not found.</div>
        </div>
      </main>
    );
  }

  // baseCourse has been narrowed to a definite course here.
  let course = baseCourse;

  let enrolled = false;

  try {
    const sb = await createClient();

    const { data } = await sb
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (data) {
      course = {
        ...course,
        ...data,
      };
    }

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (user) {
      const { data: enrollment } = await sb
        .from("enrollments")
        .select("status")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle();

      enrolled = enrollment?.status === "active";
    }
  } catch {
    // Supabase failure should not prevent the demo course page
    // from rendering.
  }

  const questionBank =
    course.slug === "genai-engineer-interview-bank-india";

  return (
    <main className="page">
      <div className="container">
        <Link
          href="/courses"
          style={{
            color: "var(--muted)",
            display: "inline-flex",
            gap: 7,
            alignItems: "center",
          }}
        >
          <ArrowLeft size={15} />
          All courses
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr .6fr",
            gap: 22,
            marginTop: 24,
          }}
        >
          <div>
            <span className="eyebrow">{course.role}</span>

            <h1 className="page-title" style={{ marginTop: 15 }}>
              {course.title}
            </h1>

            <p className="sub" style={{ fontSize: 18 }}>
              {course.description}
            </p>

            <div className="proof">
              <div>
                <strong>{course.lessons || 0}</strong> lessons
              </div>

              <div>
                <strong>{course.duration}</strong> pace
              </div>

              <div>
                <strong>{course.level}</strong> level
              </div>
            </div>

            <section
              className="section"
              style={{ padding: "45px 0 0" }}
            >
              <h2 style={{ fontSize: 30 }}>
                What you'll practise
              </h2>

              <div className="grid" style={{ marginTop: 20 }}>
                <Mini
                  icon={<MessageSquareText />}
                  t="Interview questions"
                  d="Role-specific technical and scenario questions."
                />

                <Mini
                  icon={<Code2 />}
                  t="Coding drills"
                  d="Python problems with interview constraints."
                />

                <Mini
                  icon={<PlayCircle />}
                  t="Video lessons"
                  d="Course videos can be added later or embedded from YouTube."
                />
              </div>
            </section>
          </div>

          <aside
            className="card"
            style={{
              height: "max-content",
              position: "sticky",
              top: 100,
            }}
          >
            <div style={{ fontSize: 50 }}>
              {course.cover_emoji}
            </div>

            <h2>
              {questionBank
                ? "India GenAI interview bank"
                : "Get the full path"}
            </h2>

            <div className="price">
              ₹{Number(course.price).toLocaleString("en-IN")}
            </div>

            {enrolled ? (
              <>
                <div
                  className="success"
                  style={{ marginBottom: 10 }}
                >
                  ✓ You already own this course.
                </div>

                {questionBank ? (
                  <Link
                    className="btn primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                    href="/interview/genai-india"
                  >
                    Open question bank
                  </Link>
                ) : (
                  <Link
                    className="btn primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                    href="/dashboard"
                  >
                    Open course
                  </Link>
                )}
              </>
            ) : (
              <PurchaseButton
                slug={course.slug}
                price={Number(course.price)}
                title={course.title}
              />
            )}

            {!enrolled && questionBank && (
              <Link
                className="btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
                href="/interview/genai-india"
              >
                Preview access
              </Link>
            )}

            <div
              style={{
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <p>
                <CheckCircle2 size={15} /> Structured curriculum
              </p>

              <p>
                <Clock3 size={15} /> Learn at your pace
              </p>

              <p>
                <ShieldCheck size={15} /> Your progress stays with you
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Mini({
  icon,
  t,
  d,
}: {
  icon: ReactNode;
  t: string;
  d: string;
}) {
  return (
    <article className="card">
      <div className="iconbox">{icon}</div>
      <h3>{t}</h3>
      <p>{d}</p>
    </article>
  );
}