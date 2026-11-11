import { useCallback, useEffect, useMemo, useState } from "react";
import "./FolieFeatures.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const token = () => sessionStorage.getItem("folie-token");
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

export default function FolieFeatures({ books, currentUser, onOpenBook, onHome, darkMode }) {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");
  const [mood, setMood] = useState("All");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pageNumber, setPageNumber] = useState("1");
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [postText, setPostText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = useMemo(
    () => ["All", ...new Set(books.map(book => book.category).filter(Boolean).sort())],
    [books]
  );
  const languages = useMemo(
    () => ["All", ...new Set(books.map(book => book.language).filter(Boolean).sort())],
    [books]
  );
  const moods = useMemo(
    () => ["All", ...new Set(books.flatMap(book => Array.isArray(book.mood) ? book.mood : []).filter(Boolean).sort())],
    [books]
  );

  const filtered = useMemo(() => books.filter(book => {
    const text = query.trim().toLowerCase();
    const matchesText = !text || [book.title, book.author, book.category].some(value =>
      String(value || "").toLowerCase().includes(text)
    );
    const matchesCategory = category === "All" || book.category === category;
    const matchesLanguage = language === "All" || book.language === language;
    const bookMoods = Array.isArray(book.mood) ? book.mood : [];
    const matchesMood = mood === "All" || bookMoods.includes(mood);
    const year = Number(book.year);
    const matchesMin = !minYear || (Number.isFinite(year) && year >= Number(minYear));
    const matchesMax = !maxYear || (Number.isFinite(year) && year <= Number(maxYear));
    return matchesText && matchesCategory && matchesLanguage && matchesMood && matchesMin && matchesMax;
  }), [books, query, category, language, mood, minYear, maxYear]);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }, []);

  const loadAll = useCallback(async () => {
    if (!currentUser || !token()) return;
    setLoading(true);
    try {
      const [userData, progressData, bookmarkData, communityData, challengeData] = await Promise.all([
        request("/user-data"),
        request("/reading-progress"),
        request("/features/bookmarks"),
        request("/features/community"),
        request("/features/challenges")
      ]);
      const personal = userData.data || userData;
      setWishlist(personal.wishlist || []);
      setMyBooks(personal.myBooks || []);
      setProgress(progressData.progress || []);
      setBookmarks(bookmarkData.bookmarks || []);
      setPosts(communityData.posts || []);
      setChallenges(challengeData.challenges || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, request]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const bookById = id => books.find(book => Number(book.id) === Number(id));
  const addBookmark = async () => {
    try {
      const data = await request("/features/bookmarks", {
        method: "POST",
        body: JSON.stringify({
          bookId: Number(selectedBookId),
          pageNumber: Number(pageNumber),
          note: bookmarkNote
        })
      });
      setBookmarks(previous => [
        data.bookmark,
        ...previous.filter(item => !(item.bookId === data.bookmark.bookId && item.pageNumber === data.bookmark.pageNumber))
      ]);
      setBookmarkNote("");
      setMessage("Bookmark saved to your account.");
    } catch (error) { setMessage(error.message); }
  };

  const saveProgress = async (bookId, nextPage) => {
    try {
      await request(`/reading-progress/${bookId}`, {
        method: "PUT",
        body: JSON.stringify({ pageNumber: Number(nextPage) })
      });
      setProgress(previous => [
        { book_id: Number(bookId), page_number: Number(nextPage), updated_at: new Date().toISOString() },
        ...previous.filter(item => Number(item.book_id) !== Number(bookId))
      ]);
      setMessage("Reading progress updated.");
    } catch (error) { setMessage(error.message); }
  };

  const createPost = async () => {
    if (!postText.trim()) return setMessage("Write something before posting.");
    try {
      const data = await request("/features/community", {
        method: "POST",
        body: JSON.stringify({ content: postText.trim() })
      });
      setPosts(previous => [data.post, ...previous]);
      setPostText("");
      setMessage("Your discussion has been published.");
    } catch (error) { setMessage(error.message); }
  };

  const addReply = async postId => {
    const content = (replyDrafts[postId] || "").trim();
    if (!content) return;
    try {
      const data = await request(`/features/community/${postId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
      setPosts(previous => previous.map(post =>
        post.id === postId ? { ...post, replies: [...(post.replies || []), data.reply] } : post
      ));
      setReplyDrafts(previous => ({ ...previous, [postId]: "" }));
    } catch (error) { setMessage(error.message); }
  };

  const joinChallenge = async type => {
    try {
      const data = await request(`/features/challenges/${type}`, { method: "POST", body: JSON.stringify({}) });
      setChallenges(previous => previous.some(item => item.challengeType === type)
        ? previous : [...previous, data.challenge]);
      setMessage("You joined the challenge!");
    } catch (error) { setMessage(error.message); }
  };

  const updateChallenge = async (type, value) => {
    try {
      const data = await request(`/features/challenges/${type}/progress`, {
        method: "PUT",
        body: JSON.stringify({ progress: Number(value) })
      });
      setChallenges(previous => previous.map(item =>
        item.challengeType === type ? data.challenge : item
      ));
    } catch (error) { setMessage(error.message); }
  };

  const recommendationPool = books.filter(book =>
    wishlist.includes(book.id) || myBooks.includes(book.id)
  );
  const preferredCategories = recommendationPool.map(book => book.category);
  const recommendations = [...books]
    .filter(book => !recommendationPool.some(item => item.id === book.id))
    .sort((a, b) =>
      preferredCategories.filter(value => value === b.category).length -
      preferredCategories.filter(value => value === a.category).length
    )
    .slice(0, 6);

  const challengeInfo = [
    { type: "books-3", title: "Little Library", description: "Add 3 books to My Books.", target: 3, unit: "books" },
    { type: "books-5", title: "Dedicated Reader", description: "Add 5 books to My Books.", target: 5, unit: "books" },
    { type: "pages-100", title: "Page Explorer", description: "Read 100 pages.", target: 100, unit: "pages" }
  ];

  if (!currentUser) {
    return <main className={`folie-features ${darkMode ? "ff-dark" : ""}`}>
      <button className="ff-back" onClick={onHome}>← Back to FOLIÉ</button>
      <section className="ff-panel">
        <p className="ff-kicker">THE FOLIÉ READER EXPERIENCE</p>
        <h1>Make every page count.</h1>
        <p>Please log in to use Reading Progress, Bookmarks, Community and Challenges.</p>
      </section>
    </main>;
  }

  return (
    <main className={`folie-features ${darkMode ? "ff-dark" : ""}`}>
      <header className="ff-header">
        <div>
      <button className="ff-back" onClick={onHome}>← Back to FOLIÉ</button>
          <p className="ff-kicker">THE FOLIÉ READER EXPERIENCE</p>
          <h1>Reader's Corner</h1>
          <p>Discover, keep track, share thoughts and celebrate your reading journey.</p>
        </div>
        <span className="ff-user">Welcome, {currentUser.name}</span>
      </header>

      <nav className="ff-tabs">
        {[
          ["discover", "Advanced Discover"],
          ["progress", "Progress & Bookmarks"],
          ["community", "Reader Community"],
          ["challenges", "Challenges & Badges"]
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {message && <p className="ff-message" role="status">{message}</p>}
      {loading && <p className="ff-muted">Loading your reader dataâ€¦</p>}

      {tab === "discover" && <>
        <section className="ff-panel">
          <p className="ff-kicker">ADVANCED SEARCH</p>
          <h2>Find a story that feels right.</h2>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, author or categoryâ€¦" />
          <div className="ff-filters">
            <label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Language<select value={language} onChange={e => setLanguage(e.target.value)}>{languages.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Mood<select value={mood} onChange={e => setMood(e.target.value)}>{moods.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Year from<input type="number" value={minYear} onChange={e => setMinYear(e.target.value)} placeholder="e.g. 1900" /></label>
            <label>Year to<input type="number" value={maxYear} onChange={e => setMaxYear(e.target.value)} placeholder="e.g. 2026" /></label>
          </div>
          <p className="ff-muted">{filtered.length} books match your filters.</p>
          <div className="ff-book-grid">
            {filtered.map(book => <article className="ff-book" key={book.id}>
              <img src={book.image} alt={book.title} />
              <div><small>{book.category}</small><h3>{book.title}</h3><p>By {book.author}</p>
                <button onClick={() => onOpenBook(book)}>View book â†’</button></div>
            </article>)}
          </div>
          {!filtered.length && <p>No books match these filters. Try changing them.</p>}
        </section>
        <section className="ff-panel">
          <p className="ff-kicker">PERSONALIZED PICKS</p>
          <h2>Recommended for your shelf</h2>
          <p className="ff-muted">Suggestions are based on the categories in your wishlist and My Books.</p>
          <div className="ff-book-grid">
            {recommendations.map(book => <article className="ff-book" key={book.id}>
              <img src={book.image} alt={book.title} />
              <div><small>{book.category}</small><h3>{book.title}</h3><p>By {book.author}</p>
                <button onClick={() => onOpenBook(book)}>Explore â†’</button></div>
            </article>)}
          </div>
        </section>
      </>}

      {tab === "progress" && <section className="ff-panel">
        <p className="ff-kicker">YOUR READING JOURNEY</p>
        <h2>Reading progress</h2>
        <div className="ff-progress-form">
          <label>Choose a book<select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
            <option value="">Select a book</option>
            {books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
          </select></label>
          <label>Current page<input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} /></label>
          <button disabled={!selectedBookId || Number(pageNumber) < 1} onClick={() => saveProgress(selectedBookId, pageNumber)}>Save progress</button>
        </div>
        <div className="ff-list">
          {progress.map(item => <div className="ff-list-row" key={item.book_id}>
            <div><strong>{bookById(item.book_id)?.title || `Book ${item.book_id}`}</strong><p className="ff-muted">Last saved page: {item.page_number}</p></div>
            <button onClick={() => { setSelectedBookId(String(item.book_id)); setPageNumber(String(item.page_number)); onOpenBook(bookById(item.book_id)); }}>Open book</button>
          </div>)}
          {!progress.length && <p className="ff-muted">No reading progress saved yet.</p>}
        </div>
        <hr />
        <h2>Bookmarks</h2>
        <div className="ff-progress-form">
          <label>Book<select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
            <option value="">Select a book</option>
            {books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
          </select></label>
          <label>Page number<input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} /></label>
          <label>Note (optional)<input value={bookmarkNote} onChange={e => setBookmarkNote(e.target.value)} maxLength={300} placeholder="Why save this page?" /></label>
          <button disabled={!selectedBookId || Number(pageNumber) < 1} onClick={addBookmark}>Save bookmark</button>
        </div>
        <div className="ff-list">
          {bookmarks.map(item => <div className="ff-list-row" key={item.id}>
            <div><strong>{bookById(item.bookId)?.title || `Book ${item.bookId}`} Â· Page {item.pageNumber}</strong><p className="ff-muted">{item.note || "No note added"}</p></div>
            <button className="ff-danger" onClick={async () => {
              try { await request(`/features/bookmarks/${item.id}`, { method: "DELETE" }); setBookmarks(previous => previous.filter(bookmark => bookmark.id !== item.id)); }
              catch (error) { setMessage(error.message); }
            }}>Remove</button>
          </div>)}
          {!bookmarks.length && <p className="ff-muted">Your saved bookmarks will appear here.</p>}
        </div>
      </section>}

      {tab === "community" && <section className="ff-panel">
        <p className="ff-kicker">READERS TOGETHER</p>
        <h2>Reader Community</h2>
        <p className="ff-muted">Share a thought, ask a question or discuss a book with other readers.</p>
        <textarea value={postText} onChange={e => setPostText(e.target.value)} maxLength={1500} placeholder="What are you reading or thinking about?" />
        <button onClick={createPost} disabled={!postText.trim()}>Publish discussion</button>
        <div className="ff-list">
          {posts.map(post => <article className="ff-post" key={post.id}>
            <div className="ff-post-heading"><strong>{post.userName}</strong><small>{post.createdAt}</small></div>
            {post.bookId && <p className="ff-muted">About: {bookById(post.bookId)?.title || `Book ${post.bookId}`}</p>}
            <p>{post.content}</p>
            <div className="ff-replies">
              {(post.replies || []).map(reply => <div key={reply.id}><strong>{reply.userName}</strong><p>{reply.content}</p></div>)}
            </div>
            <div className="ff-reply-form">
              <input value={replyDrafts[post.id] || ""} onChange={e => setReplyDrafts(previous => ({ ...previous, [post.id]: e.target.value }))} placeholder="Write a replyâ€¦" maxLength={800} />
              <button onClick={() => addReply(post.id)} disabled={!(replyDrafts[post.id] || "").trim()}>Reply</button>
            </div>
          </article>)}
          {!posts.length && <p className="ff-muted">No discussions yet. Start the first one!</p>}
        </div>
      </section>}

      {tab === "challenges" && <section className="ff-panel">
        <p className="ff-kicker">SMALL GOALS, BIG WORLDS</p>
        <h2>Reading Challenges & Badges</h2>
        <p className="ff-muted">Join a challenge and update your progress as you read.</p>
        <div className="ff-challenge-grid">
          {challengeInfo.map(info => {
            const joined = challenges.find(item => item.challengeType === info.type);
            const progressValue = joined?.progress || 0;
            const percent = Math.min(100, Math.round(progressValue / info.target * 100));
            return <article className="ff-challenge" key={info.type}>
              <div className="ff-badge">âœ¦</div><h3>{info.title}</h3><p>{info.description}</p>
              {joined ? <>
                <div className="ff-meter"><span style={{ width: `${percent}%` }} /></div>
                <p>{progressValue} / {info.target} {info.unit}</p>
                {percent >= 100 ? <strong>ðŸ… Challenge completed!</strong> :
                  <div className="ff-progress-form"><input type="number" min="0" max={info.target} defaultValue={progressValue} id={`challenge-${info.type}`} /><button onClick={() => updateChallenge(info.type, document.getElementById(`challenge-${info.type}`).value)}>Update</button></div>}
              </> : <button onClick={() => joinChallenge(info.type)}>Join challenge</button>}
            </article>;
          })}
        </div>
      </section>}
      <footer className="ff-footer">THE FOLIÉ Â· Every Book Has a World.</footer>
    </main>
  );
}
