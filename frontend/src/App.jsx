
import { useEffect, useState } from "react";
import "./App.css";
import AuthModal from "./AuthModal";
import AccountPage from "./AccountPage";
import { books as newBooks } from "./data/books";
import FolieFeatures from "./FolieFeatures";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const oldBooks = [
  {
    id: 101,
    title: "The Alchemist",
    author: "Paulo Coelho",
    price: 299,
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
    description: "A beautiful journey about following your dreams, discovering your purpose and listening to your heart."
  },
  {
    id: 102,
    title: "Atomic Habits",
    author: "James Clear",
    price: 399,
    category: "Self Growth",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
    description: "A practical guide to building good habits, breaking bad ones and making small changes that lead to remarkable results."
  },
  {
    id: 103,
    title: "Wings of Fire",
    author: "A. P. J. Abdul Kalam",
    price: 250,
    category: "Biography",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
    description: "The inspiring autobiography of Dr. A. P. J. Abdul Kalam and his journey from childhood to becoming a renowned scientist."
  },
  {
    id: 104,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 320,
    category: "Classic",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600",
    description: "A classic story of love, ambition, wealth and the American Dream."
  }
];

const books = [...oldBooks, ...newBooks].map((book) => ({
  ...book,
  title: book.title ?? "Untitled Book",
  author: book.author ?? "Unknown Author",
  category: book.category ?? "Uncategorized",
  description: book.description ?? "No description available.",
  image: book.image ?? "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
  price: Number(book.price ?? 0)
}));

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn("Could not save data in browser storage.");
    }
  }, [key, value]);

  return [value, setValue];
}

function getReadingTheme(category = "") {
  const genre = category.toLowerCase();

  if (genre.includes("fantasy") || genre.includes("fiction") || genre.includes("magic")) {
    return {
      name: "Fantasy",
      background: "#211a35",
      surface: "#302747",
      text: "#f3eafa",
      muted: "#c8b9df",
      accent: "#d3a8ff"
    };
  }

  if (genre.includes("romance") || genre.includes("love")) {
    return {
      name: "Romance",
      background: "#3a202d",
      surface: "#51303e",
      text: "#fff0f4",
      muted: "#e5bdcb",
      accent: "#ffabc8"
    };
  }

  if (genre.includes("mystery") || genre.includes("crime") || genre.includes("thriller")) {
    return {
      name: "Mystery",
      background: "#17212b",
      surface: "#263542",
      text: "#edf3f8",
      muted: "#b6c5d1",
      accent: "#8dc8e8"
    };
  }

  if (genre.includes("sci-fi") || genre.includes("science")) {
    return {
      name: "Science Fiction",
      background: "#102b30",
      surface: "#1c4147",
      text: "#e8fbfa",
      muted: "#b3d9d8",
      accent: "#73ddd0"
    };
  }

  return {
    name: "Classic",
    background: "#f1e8d8",
    surface: "#fffaf0",
    text: "#3d2929",
    muted: "#806b5c",
    accent: "#9a6845"
  };
}

function App() {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [page, setPage] = useState("home");
  const [previousPage, setPreviousPage] = useState("home");

  const [wishlist, setWishlist] = useStoredState("folie-wishlist", []);
  const [cart, setCart] = useStoredState("folie-cart", []);
  const [myBooks, setMyBooks] = useStoredState("folie-my-books", []);
  const [orders, setOrders] = useStoredState("folie-orders", []);
  const [recentlyViewed, setRecentlyViewed] = useStoredState("folie-recent", []);
  const [darkMode, setDarkMode] = useStoredState("folie-dark-mode", false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);

  // BOOK REVIEWS AND RATINGS
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  // LOGIN SESSION
  useEffect(() => {
    const token = sessionStorage.getItem("folie-token");
    if (!token) return;

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => setCurrentUser(data.user))
      .catch(() => {
        sessionStorage.removeItem("folie-token");
        setCurrentUser(null);
      });
  }, []);

  // ADD, EDIT AND DELETE BOOK REVIEWS
  const submitReview = async () => {
    const token = sessionStorage.getItem("folie-token");

    if (!currentUser || !token) {
      setReviewMessage("Please log in to write a review.");
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    if (!reviewText.trim()) {
      setReviewMessage("Please write your review.");
      return;
    }

    try {
      setReviewMessage("Submitting review...");

      const isEditing = editingCommentId !== null;
      const url = isEditing
        ? `${API}/comments/${editingCommentId}`
        : `${API}/books/${selectedBook.id}/comments`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit review.");
      }

      setReviewText("");
      setReviewRating(5);
      setEditingCommentId(null);
      setReviewMessage("Review saved successfully!");

      const updated = await fetch(
        `${API}/books/${selectedBook.id}/comments`
      );

      if (!updated.ok) {
        throw new Error("Review saved, but the review list could not be refreshed.");
      }

      const updatedData = await updated.json();

      setComments(updatedData.comments || []);
      setAverageRating(Number(updatedData.averageRating) || 0);
      setRatingCount(Number(updatedData.ratingCount) || 0);

    } catch (error) {
      setReviewMessage(error.message);
    }
  };

  const editReview = (comment) => {
    setEditingCommentId(comment.id);
    setReviewRating(comment.rating);
    setReviewText(comment.comment);
    setReviewMessage("You are editing your review.");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deleteReview = async (commentId) => {
    const token = sessionStorage.getItem("folie-token");

    if (!token) return;

    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete review.");
      }

      setReviewMessage("Review deleted successfully!");

      const updated = await fetch(
        `${API}/books/${selectedBook.id}/comments`
      );

      const updatedData = await updated.json();

      setComments(updatedData.comments || []);
      setAverageRating(Number(updatedData.averageRating) || 0);
      setRatingCount(Number(updatedData.ratingCount) || 0);

    } catch (error) {
      setReviewMessage(error.message);
    }
  };

  // LOAD BOOK REVIEWS
  useEffect(() => {
    if (!selectedBook?.id) {
      setComments([]);
      setAverageRating(0);
      setRatingCount(0);
      return;
    }

    let cancelled = false;

    setCommentsLoading(true);
    setReviewMessage("");

    fetch(`${API}/books/${selectedBook.id}/comments`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load reviews");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        setComments(data.comments || []);
        setAverageRating(Number(data.averageRating) || 0);
        setRatingCount(Number(data.ratingCount) || 0);
      })
      .catch(() => {
        if (!cancelled) {
          setReviewMessage("Reviews could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCommentsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBook?.id]);

  // LOAD THE LOGGED-IN USER'S PERSONAL DATA
  useEffect(() => {
    if (!currentUser?.id) {
      setLoadedUserId(null);
      return;
    }

    let cancelled = false;
    const userId = String(currentUser.id);
    const token = sessionStorage.getItem("folie-token");

    fetch(`${API}/user-data`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error("Could not load your account data.");
          error.status = response.status;
          throw error;
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        const userData = data.data || data;

        setWishlist(Array.isArray(userData.wishlist) ? userData.wishlist : []);
        setCart(Array.isArray(userData.cart) ? userData.cart : []);
        setMyBooks(Array.isArray(userData.myBooks) ? userData.myBooks : []);
        setOrders(Array.isArray(userData.orders) ? userData.orders : []);
        setLoadedUserId(userId);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("FOLIE account data loading failed:", error);

        if (error.status === 401) {
          sessionStorage.removeItem("folie-token");
          setCurrentUser(null);
          setWishlist([]);
          setCart([]);
          setMyBooks([]);
          setOrders([]);
        } else {
          alert("Your account data could not be loaded. Please check the backend and try logging in again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // SAVE CHANGES TO THE LOGGED-IN USER'S ACCOUNT
  useEffect(() => {
    if (!currentUser?.id || loadedUserId !== String(currentUser.id)) return;

    const token = sessionStorage.getItem("folie-token");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API}/user-data`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ wishlist, cart, myBooks, orders })
        });

        if (!response.ok) {
          throw new Error("Could not save your account data.");
        }
      } catch (error) {
        console.error("FOLIE account data saving failed:", error);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [wishlist, cart, myBooks, orders, currentUser, loadedUserId]);

  const handleLogout = () => {
    sessionStorage.removeItem("folie-token");
    setLoadedUserId(null);
    setWishlist([]);
    setCart([]);
    setMyBooks([]);
    setOrders([]);
    setCurrentUser(null);
    alert("You have logged out of FOLIE.");
  };

  const [readerMode, setReaderMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const filteredBooks = books.filter((book) => {
    const searchText = search.toLowerCase();

    return (
      book.title.toLowerCase().includes(searchText) ||
      book.author.toLowerCase().includes(searchText) ||
      book.category.toLowerCase().includes(searchText)
    );
  });

  const addToCart = (id) => {
    setCart((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  };

  const removeFromCart = (id) => {
    setCart((previous) => previous.filter((item) => item !== id));
  };

  const toggleWishlist = (id) => {
    setWishlist((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const addToMyBooks = (id) => {
    setMyBooks((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  };

  const openBook = (book) => {
    setPreviousPage(page);
    setSelectedBook(book);
    setReaderMode(false);

    setRecentlyViewed((previous) => [
      book.id,
      ...previous.filter((id) => id !== book.id)
    ].slice(0, 8));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backFromBook = () => {
    setSelectedBook(null);
    setReaderMode(false);
    setPage(previousPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPage = (newPage) => {
    setSelectedBook(null);
    setReaderMode(false);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cartBooks = books.filter((book) => cart.includes(book.id));
  const wishlistBooks = books.filter((book) => wishlist.includes(book.id));
  const shelfBooks = books.filter((book) => myBooks.includes(book.id));

  const recentBooks = recentlyViewed
    .map((id) => books.find((book) => book.id === id))
    .filter(Boolean);

  const totalPrice = cartBooks.reduce(
    (total, book) => total + book.price,
    0
  );

  const todayIndex = Math.floor(Date.now() / 86400000) % books.length;
  const bookOfTheDay = books[todayIndex];

  const pageButtonStyle = {
    background: "transparent",
    border: "1px solid #713b43",
    color: darkMode ? "#f5eaf0" : "#713b43",
    padding: "9px 14px",
    cursor: "pointer",
    marginLeft: "8px",
    borderRadius: "4px"
  };

  const primaryButtonStyle = {
    background: "#713b43",
    color: "white",
    border: "none",
    padding: "12px 18px",
    cursor: "pointer",
    marginRight: "10px",
    marginBottom: "10px",
    borderRadius: "4px"
  };

  const placeOrder = () => {
    if (cartBooks.length === 0) return;

    const newOrder = {
      id: `FOL-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleString(),
      items: cartBooks.map((book) => ({
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.image
      })),
      total: totalPrice,
      status: "Demo order placed"
    };

    setOrders((previous) => [newOrder, ...previous]);

    setMyBooks((previous) => [
      ...new Set([...previous, ...cartBooks.map((book) => book.id)])
    ]);

    setCart([]);
    openPage("orders");
  };

  const placeSingleBookOrder = () => {
    if (!selectedBook) return;

    const newOrder = {
      id: `FOL-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleString(),
      items: [{
        id: selectedBook.id,
        title: selectedBook.title,
        price: selectedBook.price,
        image: selectedBook.image
      }],
      total: selectedBook.price,
      status: "Demo order placed"
    };

    setOrders((previous) => [newOrder, ...previous]);

    setMyBooks((previous) =>
      previous.includes(selectedBook.id)
        ? previous
        : [...previous, selectedBook.id]
    );

    openPage("orders");
  };

  // READING MODE
  if (selectedBook && readerMode) {
    const theme = getReadingTheme(selectedBook.category);

    const readingText =
      selectedBook.readingContent ||
      selectedBook.content ||
      selectedBook.sampleText ||
      selectedBook.description;

    return (
      <div
        className="reader-page"
        style={{ background: theme.background, color: theme.text }}
      >
        <header className="reader-header">
          <button
            className="reader-back-button"
            onClick={() => setReaderMode(false)}
            style={{ color: theme.text, borderColor: theme.accent }}
          >
            Back
          </button>

          <div className="reader-brand" style={{ color: theme.accent }}>
            THE FOLIE
          </div>

          <button
            className="reader-exit-button"
            onClick={backFromBook}
            style={{ color: theme.text, borderColor: theme.accent }}
          >
            Exit Reader
          </button>
        </header>

        <main className="reader-content">
          <p className="reader-category" style={{ color: theme.accent }}>
            {selectedBook.category} · {theme.name} THEME
          </p>

          <h1 style={{ color: theme.text }}>{selectedBook.title}</h1>

          <p className="reader-author" style={{ color: theme.muted }}>
            By {selectedBook.author}
          </p>

          <div
            className="reader-controls"
            style={{ background: theme.surface, borderColor: theme.accent }}
          >
            <span style={{ color: theme.muted }}>Reading settings</span>

            <div className="font-controls">
              <button
                onClick={() => setFontSize((size) => Math.max(14, size - 2))}
                disabled={fontSize <= 14}
              >
                A−
              </button>

              <span style={{ color: theme.text }}>{fontSize}px</span>

              <button
                onClick={() => setFontSize((size) => Math.min(30, size + 2))}
                disabled={fontSize >= 30}
              >
                A+
              </button>
            </div>
          </div>

          <article
            className="reader-paper"
            style={{
              background: theme.surface,
              color: theme.text,
              fontSize: `${fontSize}px`
            }}
          >
            <h2 style={{ color: theme.accent }}>About this book</h2>
            <p>{readingText}</p>

            {!(selectedBook.readingContent || selectedBook.content || selectedBook.sampleText) && (
              <div
                className="reader-notice"
                style={{ borderColor: theme.accent, color: theme.muted }}
              >
                This is a book description preview, not the complete book.
                Full reading content has not been added yet.
              </div>
            )}
          </article>

          <p className="reader-footer" style={{ color: theme.muted }}>
            Enjoy your reading experience with FOLIE.
          </p>
        </main>
      </div>
    );
  }

  // BOOK DETAILS AND REVIEWS
  if (selectedBook) {
    const isWishlisted = wishlist.includes(selectedBook.id);
    const isInCart = cart.includes(selectedBook.id);
    const isOnShelf = myBooks.includes(selectedBook.id);

    return (
      <div
        style={{
          background: darkMode ? "#211d22" : "#f8f5f0",
          minHeight: "100vh",
          padding: "30px 6%",
          color: darkMode ? "#f5eaf0" : "#3d2929",
          fontFamily: "Georgia, serif"
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            borderBottom: "1px solid #d8c6ad",
            paddingBottom: "20px"
          }}
        >
          <h2 style={{ color: "#b18a54" }}>THE FOLIE</h2>

          <div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={pageButtonStyle}
            >
              {darkMode ? "☀ Light" : "☾ Dark"}
            </button>

            <button onClick={backFromBook} style={pageButtonStyle}>
              ← Back
            </button>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            gap: "55px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            padding: "65px 10px"
          }}
        >
          <img
            src={selectedBook.image}
            alt={selectedBook.title}
            style={{
              width: "300px",
              height: "430px",
              objectFit: "cover",
              borderRadius: "8px",
              boxShadow: "0 15px 35px #0003"
            }}
          />

          <div style={{ maxWidth: "480px" }}>
            <p style={{ color: "#b18a54", letterSpacing: "3px" }}>
              {selectedBook.category.toUpperCase()}
            </p>

            <h1 style={{ fontSize: "42px", color: "#b18a54" }}>
              {selectedBook.title}
            </h1>

            <h3 style={{ color: darkMode ? "#d4c2c8" : "#8b7669" }}>
              By {selectedBook.author}
            </h3>

            <p
              style={{
                lineHeight: "1.8",
                fontSize: "17px",
                margin: "20px 0"
              }}
            >
              {selectedBook.description}
            </p>

            <h2 style={{ color: "#b18a54" }}>
              {selectedBook.price === 0 ? "Free" : `₹${selectedBook.price}`}
            </h2>

            <div style={{ margin: "15px 0" }}>
              <span style={{ color: "#d49b32", fontSize: "22px" }}>
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </span>

              <span style={{ marginLeft: "8px" }}>
                {ratingCount > 0
                  ? `${averageRating.toFixed(1)} / 5 (${ratingCount} reviews)`
                  : "No ratings yet"}
              </span>
            </div>

            <button
              onClick={() => setReaderMode(true)}
              style={{ ...primaryButtonStyle, background: "#9b7045" }}
            >
              Start Reading ✦
            </button>

            <button
              onClick={() =>
                isOnShelf
                  ? openPage("mybooks")
                  : addToMyBooks(selectedBook.id)
              }
              style={{
                ...primaryButtonStyle,
                background: isOnShelf ? "#526b58" : "#713b43"
              }}
            >
              {isOnShelf ? "✓ Added to My Books" : "Add to My Books"}
            </button>

            <br />

            <button
              onClick={() =>
                isInCart
                  ? removeFromCart(selectedBook.id)
                  : addToCart(selectedBook.id)
              }
              style={primaryButtonStyle}
            >
              {isInCart ? "Remove from Cart" : "Add to Cart"}
            </button>

            <button
              onClick={() => toggleWishlist(selectedBook.id)}
              style={{
                background: "transparent",
                color: darkMode ? "#f5eaf0" : "#713b43",
                padding: "11px 18px",
                border: "1px solid #713b43",
                cursor: "pointer"
              }}
            >
              {isWishlisted ? "♥ Remove Wishlist" : "♡ Add to Wishlist"}
            </button>

            <button
              onClick={placeSingleBookOrder}
              style={{ ...primaryButtonStyle, background: "#9b7045" }}
            >
              Order Now ✦
            </button>

            <p
              style={{
                color: darkMode ? "#d4c2c8" : "#8b7669",
                fontSize: "12px"
              }}
            >
              Demo order only. No real payment will be collected.
            </p>

            {selectedBook.sourceUrl && (
              <p style={{ marginTop: "20px" }}>
                <a
                  href={selectedBook.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#b18a54" }}
                >
                  View book source
                </a>
              </p>
            )}
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <section
          style={{
            maxWidth: "900px",
            margin: "20px auto 50px",
            padding: "30px",
            borderRadius: "12px",
            background: darkMode ? "#302832" : "#fffaf5",
            border: "1px solid #b18a5444"
          }}
        >
          <h2 style={{ color: "#b18a54", fontSize: "28px" }}>
            Reader Reviews & Ratings
          </h2>

          <p style={{ marginTop: "8px" }}>
            Share your thoughts about this book.
          </p>

          {currentUser ? (
            <div style={{ marginTop: "25px" }}>
              <h3>
                {editingCommentId ? "Edit Your Review" : "Write a Review"}
              </h3>

              <p style={{ marginTop: "15px" }}>Your Rating:</p>

              <div style={{ marginTop: "8px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "30px",
                      color: star <= reviewRating ? "#d49b32" : "#aaa",
                      padding: "2px"
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                maxLength={1000}
                rows={5}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "9px",
                  border: "1px solid #b18a54",
                  background: darkMode ? "#211d22" : "#ffffff",
                  color: darkMode ? "#ffffff" : "#3d2929",
                  fontFamily: "Georgia, serif",
                  fontSize: "15px",
                  resize: "vertical"
                }}
              />

              <p style={{ textAlign: "right", fontSize: "12px" }}>
                {reviewText.length}/1000 characters
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "12px"
                }}
              >
                <button
                  style={primaryButtonStyle}
                  onClick={submitReview}
                >
                  {editingCommentId ? "Update Review" : "Post Review"}
                </button>

                {editingCommentId && (
                  <button
                    style={pageButtonStyle}
                    onClick={() => {
                      setEditingCommentId(null);
                      setReviewRating(5);
                      setReviewText("");
                      setReviewMessage("");
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "20px" }}>
              <p>Login to share your rating and review.</p>

              <button
                style={primaryButtonStyle}
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Login to Review
              </button>
            </div>
          )}

          {reviewMessage && (
            <p style={{ color: "#c07850", marginTop: "15px" }}>
              {reviewMessage}
            </p>
          )}

          <div style={{ marginTop: "35px" }}>
            <h3>What Readers Say</h3>

            {commentsLoading ? (
              <p>Loading reviews...</p>
            ) : comments.length === 0 ? (
              <p style={{ marginTop: "15px" }}>
                No reviews yet. Be the first to review this book!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    marginTop: "18px",
                    padding: "20px",
                    borderRadius: "10px",
                    background: darkMode ? "#211d22" : "#ffffff",
                    border: "1px solid #b18a5433"
                  }}
                >
                  <h4 style={{ margin: "0 0 8px" }}>
                    {comment.user_name}
                  </h4>

                  <div style={{ color: "#d49b32", fontSize: "20px" }}>
                    {"★".repeat(comment.rating)}
                    {"☆".repeat(5 - comment.rating)}
                  </div>

                  <p style={{ lineHeight: "1.7", marginTop: "10px" }}>
                    {comment.comment}
                  </p>

                  <p style={{ fontSize: "12px", opacity: 0.7 }}>
                    {comment.created_at}
                  </p>

                  {currentUser &&
                    String(currentUser.id) === String(comment.user_id) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "12px"
                        }}
                      >
                        <button
                          style={pageButtonStyle}
                          onClick={() => editReview(comment)}
                        >
                          Edit
                        </button>

                        <button
                          style={pageButtonStyle}
                          onClick={() => deleteReview(comment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </section>

        {authOpen && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthOpen(false)}
            onSuccess={(user) => {
              setCurrentUser(user);
              setAuthOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // READER HUB - NEW FEATURES
  if (page === "features") {
    return (
      <FolieFeatures
        books={books}
        currentUser={currentUser}
        onOpenBook={openBook}
        onHome={() => openPage("home")}
        darkMode={darkMode}
      />
    );
  }

  // MY ACCOUNT PAGE
  if (page === "account") {
    return (
      <AccountPage
        user={currentUser}
        counts={{
          books: myBooks.length,
          orders: orders.length,
          wishlist: wishlist.length,
          cart: cart.length
        }}
        onNavigate={openPage}
        onLogout={() => {
          handleLogout();
          openPage("home");
        }}
      />
    );
  }

  // CART, WISHLIST, MY BOOKS, ORDERS
  if (["cart", "wishlist", "mybooks", "orders"].includes(page)) {
    const titles = {
      cart: "My Shopping Cart",
      wishlist: "My Wishlist",
      mybooks: "My Bookshelf",
      orders: "My Orders"
    };

    const displayedBooks =
      page === "cart" ? cartBooks :
      page === "wishlist" ? wishlistBooks :
      page === "mybooks" ? shelfBooks : [];

    const isCartPage = page === "cart";

    return (
      <div
        style={{
          background: darkMode ? "#211d22" : "#f8f5f0",
          minHeight: "100vh",
          padding: "30px 6%",
          color: darkMode ? "#f5eaf0" : "#3d2929",
          fontFamily: "Georgia, serif"
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            borderBottom: "1px solid #d8c6ad",
            paddingBottom: "20px"
          }}
        >
          <h2 style={{ color: "#b18a54" }}>THE FOLIE</h2>

          <div>
            <button onClick={() => openPage("home")} style={pageButtonStyle}>
              Home
            </button>

            <button onClick={() => openPage("account")} style={pageButtonStyle}>
              My Account
            </button>

            <button onClick={() => openPage("cart")} style={pageButtonStyle}>
              Cart ({cart.length})
            </button>

            <button onClick={() => openPage("wishlist")} style={pageButtonStyle}>
              Wishlist ({wishlist.length})
            </button>

            <button onClick={() => openPage("mybooks")} style={pageButtonStyle}>
              My Books
            </button>

            <button onClick={() => openPage("orders")} style={pageButtonStyle}>
              Orders
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              style={pageButtonStyle}
            >
              {darkMode ? "☀" : "☾"}
            </button>
          </div>
        </header>

        <section style={{ padding: "45px 0" }}>
          <h1 style={{ color: "#b18a54", fontSize: "36px" }}>
            {titles[page]}
          </h1>

          {page === "orders" ? (
            orders.length === 0 ? (
              <div style={{ padding: "50px 0", textAlign: "center" }}>
                <h2>No orders yet</h2>
                <p>Your placed demo orders will appear here.</p>
                <button
                  onClick={() => openPage("home")}
                  style={primaryButtonStyle}
                >
                  Explore Books
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px", marginTop: "30px" }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: darkMode ? "#302832" : "#fff",
                      padding: "22px",
                      borderRadius: "8px",
                      boxShadow: "0 5px 20px #0001"
                    }}
                  >
                    <h3 style={{ color: "#b18a54" }}>
                      Order {order.id}
                    </h3>

                    <p>{order.date}</p>
                    <p>{order.items.map((item) => item.title).join(", ")}</p>
                    <h3>Total: ₹{order.total}</h3>
                    <p style={{ color: "#688b68" }}>{order.status}</p>
                  </div>
                ))}
              </div>
            )
          ) : displayedBooks.length === 0 ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <h2>
                {page === "cart" ? "Your cart is empty" :
                  page === "wishlist" ? "Your wishlist is empty" :
                  "Your bookshelf is empty"}
              </h2>

              <p>Discover a book and add it here.</p>

              <button
                onClick={() => openPage("home")}
                style={primaryButtonStyle}
              >
                Explore Books
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "25px",
                  marginTop: "30px"
                }}
              >
                {displayedBooks.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      background: darkMode ? "#302832" : "#fff",
                      color: darkMode ? "#f5eaf0" : "#3d2929",
                      padding: "18px",
                      borderRadius: "8px",
                      boxShadow: "0 5px 20px #0001"
                    }}
                  >
                    <img
                      src={book.image}
                      alt={book.title}
                      onClick={() => openBook(book)}
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                    />

                    <p style={{ color: "#b18a54" }}>{book.category}</p>
                    <h3 style={{ color: "#b18a54" }}>{book.title}</h3>
                    <p>By {book.author}</p>
                    <h3>{book.price === 0 ? "Free" : `₹${book.price}`}</h3>

                    <button
                      onClick={() => openBook(book)}
                      style={primaryButtonStyle}
                    >
                      View Book
                    </button>

                    <button
                      onClick={() =>
                        page === "cart"
                          ? removeFromCart(book.id)
                          : page === "wishlist"
                            ? toggleWishlist(book.id)
                            : setMyBooks((previous) =>
                                previous.filter((id) => id !== book.id)
                              )
                      }
                      style={{
                        background: "transparent",
                        border: "1px solid #713b43",
                        color: darkMode ? "#f5eaf0" : "#713b43",
                        padding: "10px",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>

                    {page === "cart" && (
                      <button
                        onClick={() => toggleWishlist(book.id)}
                        style={{
                          display: "block",
                          marginTop: "12px",
                          background: "transparent",
                          border: "none",
                          color: "#b18a54",
                          cursor: "pointer"
                        }}
                      >
                        ♡ Save to Wishlist
                      </button>
                    )}

                    {page === "wishlist" && (
                      <button
                        onClick={() => {
                          addToCart(book.id);
                          openPage("cart");
                        }}
                        style={{
                          display: "block",
                          marginTop: "12px",
                          background: "transparent",
                          border: "none",
                          color: "#b18a54",
                          cursor: "pointer"
                        }}
                      >
                        + Add to Cart
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isCartPage && (
                <div
                  style={{
                    marginTop: "35px",
                    padding: "25px",
                    background: darkMode ? "#302832" : "#eee5da",
                    borderRadius: "8px",
                    maxWidth: "420px"
                  }}
                >
                  <h2 style={{ color: "#b18a54" }}>Order Summary</h2>
                  <p>Books: {cart.length}</p>
                  <h2>Total: ₹{totalPrice}</h2>

                  <button
                    onClick={placeOrder}
                    style={{ ...primaryButtonStyle, marginTop: "15px" }}
                  >
                    Place Demo Order ✦
                  </button>

                  <p
                    style={{
                      color: darkMode ? "#d4c2c8" : "#8b7669",
                      fontSize: "12px"
                    }}
                  >
                    Demo checkout only. No real payment will be collected.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    );
  }

  // HOME PAGE
  return (
    <div className={`website ${darkMode ? "dark-mode" : ""}`}>
      <nav className="navbar">
        <div className="logo">
          <svg
            width="38"
            height="38"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 38C18 32 10 31 5 33V10C12 8 19 11 24 16"
              stroke="#B18A54"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M24 38C30 32 38 31 43 33V10C36 8 29 11 24 16"
              stroke="#B18A54"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M24 16V38" stroke="#B18A54" strokeWidth="1.5" />
            <path
              d="M29 8H38M29 8V25M29 15H36"
              stroke="#B18A54"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 5V9M15 7H19M39 3V7M37 5H41"
              stroke="#B18A54"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>

          <span>THE FOLIE.</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#books">Explore Books</a>
          <a href="#about">About Us</a>
        </div>

        {/* SINGLE NAVIGATION BUTTON GROUP - DUPLICATE REMOVED */}
        <div className="nav-buttons">
          {currentUser ? (
            <>
              <span style={{ color: "#b18a54", marginRight: "10px" }}>
                Hi, {currentUser.name}
              </span>

              <button className="login-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                Login
              </button>

              <button
                className="signup-btn"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
              >
                Sign Up
              </button>
            </>
          )}

          <button onClick={() => openPage("features")} style={pageButtonStyle}>
            Reader Hub
          </button>

          <button onClick={() => openPage("account")} style={pageButtonStyle}>
            My Account
          </button>

          <button onClick={() => openPage("cart")} style={pageButtonStyle}>
            Cart ({cart.length})
          </button>

          <button onClick={() => openPage("wishlist")} style={pageButtonStyle}>
            ♡ ({wishlist.length})
          </button>

          <button onClick={() => openPage("mybooks")} style={pageButtonStyle}>
            My Books
          </button>

          <button onClick={() => openPage("orders")} style={pageButtonStyle}>
            Orders
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={pageButtonStyle}
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO THE FOLIE</p>

          <h1>
            Every Book Holds
            <br />
            A New <span>Universe.</span>
          </h1>

          <p className="hero-description">
            Find the story that finds you. Discover wonderful books, explore new ideas,
            and let every page take you somewhere new.
          </p>

          <a href="#books" className="explore-btn">
            Explore Collection ✦
          </a>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900"
            alt="Beautiful library"
          />
        </div>
      </section>

      <section className="featured-book-section">
        <div className="featured-book-image">
          <img src={bookOfTheDay.image} alt={bookOfTheDay.title} />
        </div>

        <div>
          <p className="eyebrow">YOUR DAILY DISCOVERY</p>
          <h2>Book of the Day</h2>
          <h3>{bookOfTheDay.title}</h3>
          <p>By {bookOfTheDay.author}</p>
          <p>{bookOfTheDay.description}</p>

          <button
            className="explore-btn"
            onClick={() => openBook(bookOfTheDay)}
          >
            Discover This Book ✦
          </button>
        </div>
      </section>

      {recentBooks.length > 0 && (
        <section className="recent-section">
          <div className="section-heading">
            <p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>
            <h2>Recently Viewed</h2>
          </div>

          <div className="recent-book-list">
            {recentBooks.map((book) => (
              <button
                key={book.id}
                className="recent-book"
                onClick={() => openBook(book)}
              >
                <img src={book.image} alt={book.title} />
                <span>{book.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="books-section" id="books">
        <div className="section-heading">
          <p className="eyebrow">CURATED FOR READERS</p>
          <h2>Discover Your Next Favourite</h2>
          <p>Stories worth remembering. Books worth keeping.</p>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="Search by title, author or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="book-grid">
          {filteredBooks.map((book) => (
            <div className="book-card" key={book.id}>
              <div className="book-image">
                <img src={book.image} alt={book.title} />
              </div>

              <p className="book-category">{book.category}</p>
              <h3>{book.title}</h3>
              <p className="book-author">By {book.author}</p>

              <div className="book-bottom">
                <span>
                  {book.price === 0 ? "Free" : `₹${book.price}`}
                </span>

                <button onClick={() => openBook(book)}>
                  View Book ✦
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <p className="no-books">
            No books found. Try another title.
          </p>
        )}
      </section>

      <section className="about-section" id="about">
        <p className="eyebrow">OUR STORY</p>
        <h2>More Than Just Books.</h2>

        <p>
          The Folié is a place for curious minds and passionate readers.
          Explore stories, discover authors, and find inspiration in every page.
          Your next favourite book is waiting here.
        </p>
      </section>

      <footer>
        <h2>THE FOLIE.</h2>
        <p>Find the story that finds you.</p>
        <p>© 2026 The Folié. All rights reserved.</p>
      </footer>

      {authOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
