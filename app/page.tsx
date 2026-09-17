"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, Bookmark, Compass, Heart, Home as HomeIcon, Image as ImageIcon, LogIn, Menu, MessageCircle, MoreHorizontal, Plus, Search, Send, Smile, User, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Post = { id: string; user: string; name: string; avatar: string; image: string; caption: string; likes: number; comments: number; time: string; liked?: boolean; saved?: boolean; verified?: boolean };
type Comment = { id: string; user: string; avatar: string; body: string; time: string };
type Message = { id: string; from: "me" | "them"; body: string; time: string };
type Story = { id: string; user: string; avatar: string; image?: string; caption?: string; seen?: boolean; own?: boolean };

const avatars = {
  bia: "https://i.pravatar.cc/150?img=47",
  rafa: "https://i.pravatar.cc/150?img=12",
  nando: "https://i.pravatar.cc/150?img=11",
  lari: "https://i.pravatar.cc/150?img=32",
  joao: "https://i.pravatar.cc/150?img=53",
  manu: "https://i.pravatar.cc/150?img=44",
};

const initialStories: Story[] = [
  { id: "own", user: "Seu story", avatar: avatars.bia, own: true },
  { id: "lari", user: "larisantos", avatar: avatars.lari, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85", caption: "um respiro no meio do dia 🌿" },
  { id: "nando", user: "nandocoisa", avatar: avatars.nando, image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=85", caption: "som alto, coração leve" },
  { id: "manu", user: "manu.m", avatar: avatars.manu, image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=85", caption: "pequenas coisas" , seen: true },
  { id: "joao", user: "joaovitor", avatar: avatars.joao, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85", caption: "domingo" , seen: true },
  { id: "rafa", user: "rafaelg", avatar: avatars.rafa, image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85", caption: "com os meus" },
];

const initialPosts: Post[] = [
  { id: "p1", user: "larisantos", name: "Lari Santos", avatar: avatars.lari, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=88", caption: "às vezes, tudo que a gente precisa é de um lugar bonito e cinco minutos sem pressa. 🌿", likes: 1842, comments: 43, time: "há 18 min", verified: true },
  { id: "p2", user: "nandocoisa", name: "Fernando Coisa", avatar: avatars.nando, image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1100&q=88", caption: "não sabia que cabia tanta música boa numa terça-feira.", likes: 927, comments: 21, time: "há 1 h" },
  { id: "p3", user: "manu.m", name: "Manu Martins", avatar: avatars.manu, image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1100&q=88", caption: "pequenas coisas, grandes dias.", likes: 3210, comments: 86, time: "há 3 h", verified: true },
];

const suggestions = [
  { user: "cafecomleo", name: "Leo Sampaio", avatar: "https://i.pravatar.cc/150?img=68", reason: "Seguido por larisantos" },
  { user: "casadalu", name: "Lu Almeida", avatar: "https://i.pravatar.cc/150?img=5", reason: "Novidade no Pobries" },
  { user: "gui.moraes", name: "Gui Moraes", avatar: "https://i.pravatar.cc/150?img=60", reason: "Seguido por rafaelg" },
];

const conversations = [
  { id: "lari", user: "larisantos", name: "Lari Santos", avatar: avatars.lari, preview: "Você viu esse lugar?", online: true },
  { id: "nando", user: "nandocoisa", name: "Fernando Coisa", avatar: avatars.nando, preview: "A playlist ficou pronta", online: false },
  { id: "manu", user: "manu.m", name: "Manu Martins", avatar: avatars.manu, preview: "hahaha sim!", online: true },
];

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return value ? JSON.parse(value) as T : fallback;
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<Post[]>(() => readLocal("pobries-posts", initialPosts));
  const [stories, setStories] = useState<Story[]>(() => [{ id: "own", user: "Seu story", avatar: avatars.bia, own: true }, ...readLocal<Story[]>("pobries-stories", initialStories.slice(1))]);
  const [activeTab, setActiveTab] = useState("Início");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState<Story | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [toast, setToast] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => readLocal("pobries-comments", {}));
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [storyImageUrl, setStoryImageUrl] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [followed, setFollowed] = useState<string[]>(() => readLocal("pobries-follows", []));
  const [profileName, setProfileName] = useState(() => readLocal("pobries-profile-name", "Bia Souza"));
  const [profileBio, setProfileBio] = useState(() => readLocal("pobries-profile-bio", "vivendo devagar e registrando tudo que faz bem."));
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraftName, setProfileDraftName] = useState(profileName);
  const [profileDraftBio, setProfileDraftBio] = useState(profileBio);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => readLocal("pobries-messages", {
    lari: [{ id: "m1", from: "them", body: "Você viu esse lugar?", time: "10:42" }],
    nando: [{ id: "m2", from: "them", body: "A playlist ficou pronta", time: "ontem" }],
    manu: [{ id: "m3", from: "me", body: "hahaha sim!", time: "seg" }],
  }));
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    if (hasSupabase) {
      supabase.from("posts").select("id, image_url, caption, created_at, profiles(username, display_name, avatar_url)").order("created_at", { ascending: false }).then(({ data }) => {
        if (!data?.length) return;
        setPosts(data.map((post) => {
          const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          return { id: post.id, user: profile?.username ?? "pobries", name: profile?.display_name ?? "Pobries", avatar: profile?.avatar_url ?? avatars.bia, image: post.image_url, caption: post.caption, likes: 0, comments: 0, time: "agora" };
        }));
      });
      supabase.from("likes").select("post_id").then(({ data }) => {
        if (!data) return;
        setPosts((current) => current.map((post) => ({ ...post, likes: post.likes + data.filter((like) => like.post_id === post.id).length })));
      });
      supabase.from("comments").select("id, post_id, body, created_at, profiles(username, avatar_url)").order("created_at", { ascending: true }).then(({ data }) => {
        if (!data) return;
        const grouped = data.reduce<Record<string, Comment[]>>((result, comment) => {
          const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
          const item = { id: comment.id, user: profile?.username ?? "pobries", avatar: profile?.avatar_url ?? avatars.bia, body: comment.body, time: "agora" };
          result[comment.post_id] = [...(result[comment.post_id] ?? []), item];
          return result;
        }, {});
        setComments(grouped);
        setPosts((current) => current.map((post) => ({ ...post, comments: grouped[post.id]?.length ?? post.comments })));
      });
      supabase.from("stories").select("id, image_url, caption, expires_at, profiles(username, avatar_url)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).then(({ data }) => {
        if (!data?.length) return;
        setStories([{ id: "own", user: "Seu story", avatar: avatars.bia, own: true }, ...data.map((story) => { const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles; return { id: story.id, user: profile?.username ?? "pobries", avatar: profile?.avatar_url ?? avatars.bia, image: story.image_url, caption: story.caption }; })]);
      });
    }
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user?.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, [hasSupabase, supabase]);
  useEffect(() => { window.localStorage.setItem("pobries-posts", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { window.localStorage.setItem("pobries-comments", JSON.stringify(comments)); }, [comments]);
  useEffect(() => { window.localStorage.setItem("pobries-follows", JSON.stringify(followed)); }, [followed]);
  useEffect(() => { window.localStorage.setItem("pobries-profile-name", profileName); }, [profileName]);
  useEffect(() => { window.localStorage.setItem("pobries-profile-bio", profileBio); }, [profileBio]);
  useEffect(() => { window.localStorage.setItem("pobries-messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { window.localStorage.setItem("pobries-stories", JSON.stringify(stories.filter((story) => !story.own))); }, [stories]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const toggleLike = async (id: string) => {
    const post = posts.find((item) => item.id === id);
    if (!post) return;
    if (hasSupabase && !userEmail) { setAuthOpen(true); return; }
    setPosts((current) => current.map((item) => item.id === id ? { ...item, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) } : item));
    if (hasSupabase && userEmail) {
      const { data: user } = await supabase.auth.getUser();
      if (post.liked) await supabase.from("likes").delete().eq("post_id", id).eq("user_id", user.user?.id);
      else await supabase.from("likes").insert({ post_id: id, user_id: user.user?.id });
    }
  };
  const toggleSave = (id: string) => setPosts((current) => current.map((post) => post.id === id ? { ...post, saved: !post.saved } : post));
  const openComments = (post: Post) => setCommentsPost(post);
  const handleCreatePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!caption.trim() || !imageUrl.trim()) { setToast("Adicione uma imagem e uma legenda"); return; }
    if (hasSupabase && !userEmail) { setAuthOpen(true); return; }
    let postId = `local-${Date.now()}`;
    if (hasSupabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data, error } = await supabase.from("posts").insert({ author_id: user.user.id, image_url: imageUrl, caption }).select("id").single();
        if (error) { setToast("Não foi possível publicar agora"); return; }
        postId = data.id;
      }
    }
    setPosts((current) => [{ id: postId, user: "você", name: userEmail?.split("@")[0] ?? "Você", avatar: avatars.bia, image: imageUrl, caption, likes: 0, comments: 0, time: "agora" }, ...current]);
    setCaption(""); setImageUrl(""); setComposerOpen(false); setToast("Post publicado no Pobries");
  };
  const handleCreateStory = async (event: FormEvent) => {
    event.preventDefault();
    if (!storyImageUrl.trim()) { setToast("Adicione uma imagem ao story"); return; }
    if (hasSupabase && !userEmail) { setAuthOpen(true); return; }
    let storyId = `local-story-${Date.now()}`;
    if (hasSupabase) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data, error } = await supabase.from("stories").insert({ author_id: user.user.id, image_url: storyImageUrl, caption: storyCaption }).select("id").single();
        if (error) { setToast("Não foi possível publicar o story"); return; }
        storyId = data.id;
      }
    }
    setStories((current) => [{ id: storyId, user: "você", avatar: avatars.bia, image: storyImageUrl, caption: storyCaption }, ...current.filter((story) => !story.own), { id: "own", user: "Seu story", avatar: avatars.bia, own: true }]);
    setStoryImageUrl(""); setStoryCaption(""); setStoryComposerOpen(false); setToast("Story publicado por 24 horas");
  };
  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!commentsPost || !commentText.trim()) return;
    if (hasSupabase && !userEmail) { setAuthOpen(true); return; }
    const nextComment = { id: `comment-${Date.now()}`, user: userEmail?.split("@")[0] ?? "você", avatar: avatars.bia, body: commentText.trim(), time: "agora" };
    setComments((current) => ({ ...current, [commentsPost.id]: [...(current[commentsPost.id] ?? []), nextComment] }));
    setPosts((current) => current.map((post) => post.id === commentsPost.id ? { ...post, comments: post.comments + 1 } : post));
    if (hasSupabase) { const { data: user } = await supabase.auth.getUser(); if (user.user) await supabase.from("comments").insert({ post_id: commentsPost.id, author_id: user.user.id, body: commentText.trim() }); }
    setCommentText("");
  };
  const toggleFollow = (username: string) => { setFollowed((current) => current.includes(username) ? current.filter((item) => item !== username) : [...current, username]); setToast(followed.includes(username) ? `Você deixou de seguir @${username}` : `Você está seguindo @${username}`); };
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileName(profileDraftName.trim() || "Bia Souza");
    setProfileBio(profileDraftBio.trim());
    if (hasSupabase) { const { data: user } = await supabase.auth.getUser(); if (user.user) await supabase.from("profiles").update({ display_name: profileDraftName.trim(), bio: profileDraftBio.trim() }).eq("id", user.user.id); }
    setEditingProfile(false);
    setToast("Perfil atualizado");
  };
  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!messageText.trim()) return;
    const nextMessage = { id: `message-${Date.now()}`, from: "me" as const, body: messageText.trim(), time: "agora" };
    setMessages((current) => ({ ...current, [activeConversation.id]: [...(current[activeConversation.id] ?? []), nextMessage] }));
    setMessageText("");
    if (hasSupabase) setToast("Mensagem salva localmente até o chat online ser configurado");
  };
  const sharePost = async (post: Post) => {
    const shareUrl = `${window.location.origin}/?post=${post.id}`;
    try { await navigator.clipboard.writeText(shareUrl); setToast("Link do post copiado"); } catch { setToast("Link pronto para compartilhar"); }
  };
  const handleAuth = async (event: FormEvent) => { event.preventDefault(); const result = authMode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); setAuthMessage(result.error ? "Confira os dados e tente novamente." : authMode === "login" ? "Login realizado." : "Cadastro feito. Confirme seu e-mail."); if (!result.error && authMode === "login") setTimeout(() => setAuthOpen(false), 700); };

  return (
    <main className="pobries-app">
      <aside className="left-sidebar">
        <a className="pobries-logo" href="#top">pobries<span>°</span></a>
        <nav className="side-nav">
          <NavButton icon={<HomeIcon />} label="Início" active={activeTab === "Início"} onClick={() => setActiveTab("Início")} />
          <NavButton icon={<Search />} label="Pesquisar" active={searchOpen} onClick={() => setSearchOpen(!searchOpen)} />
          <NavButton icon={<Compass />} label="Explorar" active={activeTab === "Explorar"} onClick={() => { setActiveTab("Explorar"); setToast("Explorar está chegando"); }} />
          <NavButton icon={<MessageCircle />} label="Mensagens" onClick={() => setMessagesOpen(true)} />
          <NavButton icon={<Bell />} label="Notificações" active={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} />
          <NavButton icon={<Plus />} label="Criar" onClick={() => setComposerOpen(true)} />
          <NavButton icon={<User />} label="Perfil" active={profileOpen} onClick={() => setProfileOpen(true)} />
        </nav>
        <button className="more-button" onClick={() => setToast("Mais opções em breve")}><Menu /> <span>Mais</span></button>
      </aside>

      <header className="mobile-header"><a className="pobries-logo" href="#top">pobries<span>°</span></a><div><button onClick={() => setSearchOpen(!searchOpen)} aria-label="Pesquisar"><Search /></button><button onClick={() => setComposerOpen(true)} aria-label="Criar post"><Plus /></button></div></header>
      <section className="mobile-bottom-nav"><NavButton icon={<HomeIcon />} label="" active={activeTab === "Início"} onClick={() => setActiveTab("Início")} /><NavButton icon={<Compass />} label="" onClick={() => setToast("Explorar está chegando")} /><NavButton icon={<Plus />} label="" onClick={() => setComposerOpen(true)} /><NavButton icon={<Heart />} label="" onClick={() => setNotificationsOpen(true)} /><NavButton icon={<User />} label="" onClick={() => setProfileOpen(true)} /></section>

      <div className="main-column" id="top">
        <div className="feed-header"><div className="feed-tabs"><button className={activeTab === "Início" ? "active" : ""} onClick={() => setActiveTab("Início")}>Para você</button><button className={activeTab === "Seguindo" ? "active" : ""} onClick={() => setActiveTab("Seguindo")}>Seguindo</button></div><button className="desktop-search" onClick={() => setSearchOpen(true)}><Search size={18} /></button></div>
        {searchOpen && <div className="search-bar"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar pessoas, posts e lugares" /><button onClick={() => { setQuery(""); setSearchOpen(false); }}><X size={16} /></button></div>}
        {activeTab === "Explorar" ? <section className="explore-view"><div className="explore-heading"><div><small>descubra novas histórias</small><h1>Explorar</h1></div><p>Ideias, pessoas e momentos<br />que podem virar favoritos.</p></div><div className="explore-chips"><button className={!query ? "active" : ""} onClick={() => setQuery("")}>Tudo</button><button onClick={() => setQuery("🌿")}>Natureza</button><button onClick={() => setQuery("música")}>Música</button><button onClick={() => setQuery("dias")}>Rotina</button></div><div className="explore-grid">{posts.filter((post) => !query || `${post.user} ${post.name} ${post.caption}`.toLowerCase().includes(query.toLowerCase())).map((post) => <button className="explore-tile" key={post.id} onClick={() => setCommentsPost(post)}><img src={post.image} alt={post.caption} /><span><Heart size={15} fill="currentColor" /> {post.likes.toLocaleString("pt-BR")}</span></button>)}</div>{!posts.length && <p className="empty-explore">Ainda não há publicações para explorar.</p>}</section> : <><div className="stories-card"><div className="stories-scroll">{stories.map((story) => <button className="story" key={story.id} onClick={() => { if (story.own) setStoryComposerOpen(true); else { setStoryOpen(story); setStories((current) => current.map((item) => item.id === story.id ? { ...item, seen: true } : item)); } }}><span className={`${story.seen ? "seen" : ""} ${story.own ? "own" : ""}`}><img src={story.avatar} alt="" />{story.own && <i><Plus size={13} /></i>}</span><small>{story.user}</small></button>)}</div></div><div className="feed-list">{posts.filter((post) => (activeTab !== "Seguindo" || followed.includes(post.user)) && (!query || `${post.user} ${post.name} ${post.caption}`.toLowerCase().includes(query.toLowerCase()))).map((post) => <PostCard key={post.id} post={post} onLike={() => toggleLike(post.id)} onSave={() => toggleSave(post.id)} onComment={() => openComments(post)} onShare={() => sharePost(post)} />)}</div></>}
      </div>

      <aside className="right-sidebar">
        <div className="profile-mini"><img src={avatars.bia} alt="" /><div><strong>{userEmail ? userEmail.split("@")[0] : "bia.souza"}</strong><span>{userEmail ? userEmail : "Bia Souza"}</span></div><button onClick={() => userEmail ? setToast("Perfil aberto") : setAuthOpen(true)}>{userEmail ? "Ver perfil" : "Entrar"}</button></div>
        <div className="suggestion-heading"><span>Sugestões para você</span><button onClick={() => setToast("Todas as sugestões carregadas")}>Ver tudo</button></div>
        <div className="suggestions">{suggestions.map((suggestion) => <div className="suggestion" key={suggestion.user}><img src={suggestion.avatar} alt="" /><div><strong>{suggestion.user}</strong><span>{suggestion.reason}</span></div><button onClick={() => toggleFollow(suggestion.user)}>{followed.includes(suggestion.user) ? "Seguindo" : "Seguir"}</button></div>)}</div>
        <div className="footer-links">Sobre · Ajuda · Imprensa · Privacidade · Termos<br />© 2024 POBRIES</div>
      </aside>

      {storyOpen && <div className="modal-backdrop" onClick={() => setStoryOpen(null)}><div className="story-viewer" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setStoryOpen(null)}><X /></button><div className="story-progress" /><img src={storyOpen.avatar} alt="" /><strong>@{storyOpen.user}</strong><div className="story-art" style={{ backgroundImage: `url(${storyOpen.image})` }}><span>{storyOpen.caption || "um pouquinho do meu dia ✨"}</span></div></div></div>}
      {storyComposerOpen && <div className="modal-backdrop" onClick={() => setStoryComposerOpen(false)}><div className="composer-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><h2>Novo story</h2><button onClick={() => setStoryComposerOpen(false)}><X /></button></div><div className="composer-preview"><ImageIcon size={38} /><strong>Compartilhe por 24 horas</strong><span>Escolha uma imagem ou cole uma URL pública.</span><input className="file-input" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setStoryImageUrl(String(reader.result)); reader.readAsDataURL(file); }} /><input className="image-input" required value={storyImageUrl} onChange={(event) => setStoryImageUrl(event.target.value)} placeholder="https://imagem.com/foto.jpg" /></div><form onSubmit={handleCreateStory}><label>Texto<textarea value={storyCaption} onChange={(event) => setStoryCaption(event.target.value)} placeholder="Adicione uma frase..." rows={3} /></label><div className="composer-tools"><span /> <button className="publish-button" type="submit">Publicar story</button></div></form></div></div>}
      {composerOpen && <div className="modal-backdrop" onClick={() => setComposerOpen(false)}><div className="composer-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><h2>Criar novo post</h2><button onClick={() => setComposerOpen(false)}><X /></button></div><div className="composer-preview"><ImageIcon size={38} /><strong>Compartilhe um momento</strong><span>Escolha um arquivo ou cole o link de uma imagem pública.</span><input className="file-input" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImageUrl(String(reader.result)); reader.readAsDataURL(file); }} /><input className="image-input" required value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://imagem.com/foto.jpg" /></div><form onSubmit={handleCreatePost}><label>Legenda<textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Escreva uma legenda..." rows={3} /></label><div className="composer-tools"><button type="button" onClick={() => setToast("Emoji adicionado") }><Smile size={19} /></button><button type="button" onClick={() => setToast("Localização adicionada")}>Adicionar localização</button><button className="publish-button" type="submit">Publicar</button></div></form></div></div>}
      {commentsPost && <div className="modal-backdrop" onClick={() => setCommentsPost(null)}><div className="comments-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><h2>Comentários</h2><button onClick={() => setCommentsPost(null)}><X /></button></div><div className="comments-list">{(comments[commentsPost.id] ?? []).length === 0 && <p className="no-comments">Seja a primeira pessoa a comentar.</p>}{(comments[commentsPost.id] ?? []).map((comment) => <div className="comment-row" key={comment.id}><img src={comment.avatar} alt="" /><p><b>{comment.user}</b>{comment.body}<small>{comment.time}</small></p></div>)}</div><form className="comment-form" onSubmit={addComment}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Adicione um comentário..." /><button type="submit"><Send size={18} /></button></form></div></div>}
      {messagesOpen && <div className="modal-backdrop" onClick={() => setMessagesOpen(false)}><div className="messages-modal" onClick={(event) => event.stopPropagation()}><div className="messages-list"><div className="messages-title"><h2>Mensagens</h2><button onClick={() => setMessagesOpen(false)}><X /></button></div>{conversations.map((conversation) => <button className={`conversation ${activeConversation.id === conversation.id ? "active" : ""}`} key={conversation.id} onClick={() => setActiveConversation(conversation)}><img src={conversation.avatar} alt="" /><span><b>{conversation.user}</b><small>{conversation.preview}</small></span>{conversation.online && <i />}</button>)}</div><div className="chat-panel"><div className="chat-heading"><img src={activeConversation.avatar} alt="" /><span><b>{activeConversation.name}</b><small>@{activeConversation.user}</small></span></div><div className="chat-messages">{(messages[activeConversation.id] ?? []).map((message) => <p className={message.from === "me" ? "mine" : ""} key={message.id}>{message.body}<small>{message.time}</small></p>)}</div><form className="chat-form" onSubmit={sendMessage}><input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Escreva uma mensagem..." /><button type="submit"><Send size={17} /></button></form></div></div></div>}
      {profileOpen && <div className="modal-backdrop" onClick={() => setProfileOpen(false)}><div className="profile-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setProfileOpen(false)}><X /></button>{editingProfile ? <form className="profile-edit-form" onSubmit={saveProfile}><img src={avatars.bia} alt="" /><label>Nome<input value={profileDraftName} onChange={(event) => setProfileDraftName(event.target.value)} /></label><label>Bio<textarea value={profileDraftBio} onChange={(event) => setProfileDraftBio(event.target.value)} rows={3} /></label><button className="edit-profile" type="submit">Salvar alterações</button></form> : <><img src={avatars.bia} alt="" /><h2>{userEmail ? userEmail.split("@")[0] : "bia.souza"}</h2><p>{profileBio}</p><div className="profile-stats"><strong>{posts.filter((post) => post.user === "você").length}<span>posts</span></strong><strong>2.4k<span>seguidores</span></strong><strong>{followed.length}<span>seguindo</span></strong></div><button className="edit-profile" onClick={() => { setProfileDraftName(profileName); setProfileDraftBio(profileBio); setEditingProfile(true); }}>Editar perfil</button></>}</div></div>}
      {notificationsOpen && <div className="notification-popover"><div><strong>Notificações</strong><button onClick={() => setNotificationsOpen(false)}><X size={17} /></button></div><p><Heart size={16} fill="currentColor" /> <b>manu.m</b> curtiu seu post</p><p><Users size={16} /> <b>cafecomleo</b> começou a seguir você</p><p><MessageCircle size={16} /> <b>lari.santos</b> comentou no seu post</p></div>}
      {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthOpen(false)}><X /></button><a className="pobries-logo centered-logo" href="#top">pobries<span>°</span></a><p>Entre para continuar vendo o que importa.</p><form onSubmit={handleAuth}><input required type="email" placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} /><input required minLength={6} type="password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="auth-button">{authMode === "login" ? "Entrar" : "Criar conta"} <LogIn size={16} /></button></form>{authMessage && <small>{authMessage}</small>}<button className="auth-switch" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>{authMode === "login" ? "Criar uma conta nova" : "Já tenho uma conta"}</button></div></div>}
      {toast && <div className="toast-message">{toast}</div>}
    </main>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) { return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>; }

function PostCard({ post, onLike, onSave, onComment, onShare }: { post: Post; onLike: () => void; onSave: () => void; onComment: () => void; onShare: () => void }) {
  return <article className="post-card"><div className="post-author"><img src={post.avatar} alt="" /><div><strong>{post.user}{post.verified && <span className="verified">✓</span>}</strong><small>{post.name} · {post.time}</small></div><button aria-label="Mais opções"><MoreHorizontal /></button></div><div className="post-photo" style={{ backgroundImage: `url(${post.image})` }} /><div className="post-actions"><div><button className={post.liked ? "liked" : ""} onClick={onLike} aria-label="Curtir"><Heart fill={post.liked ? "currentColor" : "none"} /></button><button onClick={onComment} aria-label="Comentar"><MessageCircle /></button><button onClick={onShare} aria-label="Compartilhar"><Send /></button></div><button className={post.saved ? "saved" : ""} onClick={onSave} aria-label="Salvar"><Bookmark fill={post.saved ? "currentColor" : "none"} /></button></div><div className="post-body"><strong>{post.likes.toLocaleString("pt-BR")} curtidas</strong><p><b>{post.user}</b> {post.caption}</p><button className="comments-link" onClick={onComment}>Ver todos os {post.comments} comentários</button></div></article>;
}