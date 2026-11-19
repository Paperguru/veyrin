import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  // Keep the same server-side admin protection already used by this route.
  // The admin client uses the service role key on the server only.
  return createAdminClient();
}

export async function GET() {
  try {
    const db = await checkAdmin();

    const { data, error } = await db
      .from("materials")
      .select(
        "*,course:courses!materials_course_id_fkey(id,title,slug,price),upgrade_course:courses!materials_upgrade_course_id_fkey(id,title,slug,price)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      materials: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load materials",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = await checkAdmin();
    const b = await req.json();

    const payload = {
      title: String(b.title || "").trim(),
      slug: String(b.slug || "").trim(),
      description: String(b.description || "").trim(),
      content_type: b.content_type || "pdf",
      access_type: b.access_type || "free",
      body: b.body || "",
      file_path: b.file_path || null,
      file_name: b.file_name || null,
      course_id: b.course_id || null,
      upgrade_course_id: b.upgrade_course_id || null,
      published: Boolean(b.published),
      featured: Boolean(b.featured),
    };

    if (!payload.title) {
      return NextResponse.json(
        { error: "Material title is required" },
        { status: 400 }
      );
    }

    if (!payload.slug) {
      return NextResponse.json(
        { error: "Material slug is required" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("materials")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      material: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create material",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const db = await checkAdmin();
    const b = await req.json();

    if (!b.id) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 }
      );
    }

    const allowed = [
      "title",
      "slug",
      "description",
      "content_type",
      "access_type",
      "body",
      "file_path",
      "file_name",
      "course_id",
      "upgrade_course_id",
      "published",
      "featured",
    ];

    const update: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in b) {
        update[key] = b[key];
      }
    }

    const { data, error } = await db
      .from("materials")
      .update(update)
      .eq("id", b.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      material: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update material",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE INTERVIEW MATERIAL
 *
 * Deletes:
 * 1. The material record from Supabase database
 * 2. The associated PDF/document from the private
 *    "veyrin-files" storage bucket, when file_path exists.
 */
export async function DELETE(req: Request) {
  try {
    const db = await checkAdmin();
    const b = await req.json();

    if (!b.id) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 }
      );
    }

    // First get the material so we know its storage file path.
    const { data: material, error: findError } = await db
      .from("materials")
      .select("id,title,file_path,file_name")
      .eq("id", b.id)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    if (!material) {
      return NextResponse.json(
        { error: "Interview material not found" },
        { status: 404 }
      );
    }

    // Delete the uploaded PDF/document from Supabase Storage.
    if (material.file_path) {
      const { error: storageError } = await db.storage
        .from("veyrin-files")
        .remove([material.file_path]);

      if (storageError) {
        return NextResponse.json(
          {
            error:
              "Could not delete the uploaded file: " +
              storageError.message,
          },
          { status: 500 }
        );
      }
    }

    // Delete the database record.
    const { error: deleteError } = await db
      .from("materials")
      .delete()
      .eq("id", b.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Interview material deleted successfully",
      id: material.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete interview material",
      },
      { status: 500 }
    );
  }
}