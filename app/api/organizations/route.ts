import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug parameter required" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching organization by slug:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: [data], // Wrap in array for compatibility
    });
  } catch (error) {
    console.error("Organization API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
