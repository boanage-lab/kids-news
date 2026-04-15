"use client";
import { useEffect } from "react";

export default function ReadTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/news/${articleId}/read`, { method: "POST" }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [articleId]);
  return null;
}
