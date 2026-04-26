import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type BlogStory = {
  id: string;
  title: string;
  cover_image: string | null;
  author: string | null;
  created_at: string;
  content: string | null;
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [story, setStory] = useState<BlogStory | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      setFetching(true);
      const { data } = await supabase
        .from("blog_stories")
        .select("id,title,cover_image,author,created_at,content")
        .eq("published", true)
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setStory(data as BlogStory);
        document.title = `${data.title} — San Vicente Live`;
      } else {
        setNotFound(true);
      }
      setFetching(false);
    })();
  }, [user, slug]);

  if (loading || !user || fetching) {
    return (
      <main className="min-h-screen bg-background p-5 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-lg font-semibold">Story not found</p>
        <Link to="/community/blog" className="text-sm text-accent underline">
          Back to Blog
        </Link>
      </main>
    );
  }

  if (!story) return null;

  const safeContent = DOMPurify.sanitize(story.content ?? "");

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40 px-5 pt-4 pb-3">
        <Link
          to="/community/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Blog
        </Link>
      </header>

      {story.cover_image && (
        <img
          src={story.cover_image}
          alt={story.title}
          className="w-full h-56 object-cover"
          loading="lazy"
        />
      )}

      <article className="px-5 pt-5 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold leading-tight">{story.title}</h1>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {story.author && <span>{story.author}</span>}
          {story.author && <span>·</span>}
          <time dateTime={story.created_at}>
            {format(new Date(story.created_at), "MMMM d, yyyy")}
          </time>
        </div>

        {safeContent ? (
          <div
            className="prose prose-sm dark:prose-invert mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        ) : (
          <p className="text-sm text-muted-foreground mt-6">No content available.</p>
        )}
      </article>
    </main>
  );
};

export default BlogDetail;
