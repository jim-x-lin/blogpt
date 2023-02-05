import type Author from "./author";

type PostType = {
  id: string;
  promptId: string;
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  author: Author;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  createdAtMs: number;
  deletedAtMs?: number;
};

export default PostType;
