 
import { useState } from "react";
import "./App.css";

const books = [
  {
    id: 1,
    title: "The Alchemist",
    author: "Paulo Coelho",
    price: 299,
    category: "Fiction",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600",
    description: "A beautiful journey about following your dreams, discovering your purpose and listening to your heart."
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    price: 399,
    category: "Self Growth",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
    description: "A practical guide to building good habits, breaking bad ones and making small changes that lead to remarkable results."
  },
  {
    id: 3,
    title: "Wings of Fire",
    author: "A. P. J. Abdul Kalam",
    price: 250,
    category: "Biography",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600",
    description: "The inspiring autobiography of Dr. A. P. J. Abdul Kalam and his journey from childhood to becoming a renowned scientist."
  },
  {
    id: 4,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 320,
    category: "Classic",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600",
    description: "A classic story of love, ambition, wealth and the American Dream."
  }
];

function App() {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [page, setPage] = useState("home");
  const [previousPage, setPreviousPage] = useState("home");
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

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

  const openBook = (book) => {
    setPreviousPage(page);
    setSelectedBook(book);
  };

  const backFromBook = () => {
    setSelectedBook(null);
    setPage(previousPage);
  };

  const cartBooks = books.filter((book) => cart.includes(book.id));
  const wishlistBooks = books.filter((book) => wishlist.includes(book.id));

  const totalPrice = cartBooks.reduce(
    (total, book) => total + book.price,
    0
  );

  const openPage = (newPage) => {
    setSelectedBook(null);
    setPage(newPage);
  };

  const pageButtonStyle = {
    background: "transparent",
    border: "1px solid #713b43",
    color: "#713b43",
    padding: "9px 14px",
    cursor: "pointer",
    marginLeft: "8px"
  };

  const primaryButtonStyle = {
    background: "#713b43",
    color: "white",
    border: "none",
    padding: "12px 18px",
    cursor: "pointer",
    marginRight: "10px",
    marginBottom: "10px"
  };

  // BOOK DETAILS PAGE

  if (selectedBook) {
    const isWishlisted = wishlist.includes(selectedBook.id);
    const isInCart = cart.includes(selectedBook.id);

    return (
      <div style={{
        background: "#f8f5f0",
        minHeight: "100vh",
        padding: "30px 6%",
        color: "#3d2929",
        fontFamily: "Georgia, serif"
      }}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom: "1px solid #d8c6ad",
          paddingBottom: "20px"
        }}>
          <h2 style={{ color: "#713b43" }}>THE FOLIÉ</h2>

          <button
            onClick={backFromBook}
            style={pageButtonStyle}
          >
            ← Back
          </button>
        </header>

        <div style={{
          display: "flex",
          gap: "55px",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "65px 10px"
        }}>
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

            <h1 style={{ fontSize: "42px", color: "#713b43" }}>
              {selectedBook.title}
            </h1>

            <h3 style={{ color: "#8b7669" }}>
              By {selectedBook.author}
            </h3>

            <p style={{ lineHeight: "1.8", fontSize: "17px" }}>
              {selectedBook.description}
            </p>

            <h2 style={{ color: "#713b43" }}>
              ₹{selectedBook.price}
            </h2>

            <p style={{ color: "#b18a54" }}>
              ★★★★★ <span style={{ color: "#8b7669" }}>Reader favourite</span>
            </p>

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
                color: "#713b43",
                padding: "11px 18px",
                border: "1px solid #713b43",
                cursor: "pointer"
              }}
            >
              {isWishlisted ? "♥ Remove Wishlist" : "♡ Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CART AND WISHLIST PAGES

  if (page === "cart" || page === "wishlist") {
    const isCartPage = page === "cart";
    const displayedBooks = isCartPage ? cartBooks : wishlistBooks;

    return (
      <div style={{
        background: "#f8f5f0",
        minHeight: "100vh",
        padding: "30px 6%",
        color: "#3d2929",
        fontFamily: "Georgia, serif"
      }}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          borderBottom: "1px solid #d8c6ad",
          paddingBottom: "20px"
        }}>
          <h2 style={{ color: "#713b43" }}>THE FOLIÉ</h2>

          <div>
            <button onClick={() => openPage("home")} style={pageButtonStyle}>
              Home
            </button>
            <button onClick={() => openPage("cart")} style={pageButtonStyle}>
              Cart ({cart.length})
            </button>
            <button onClick={() => openPage("wishlist")} style={pageButtonStyle}>
              Wishlist ({wishlist.length})
            </button>
          </div>
        </header>

        <section style={{ padding: "45px 0" }}>
          <h1 style={{ color: "#713b43", fontSize: "36px" }}>
            {isCartPage ? "My Shopping Cart" : "My Wishlist"}
          </h1>

          <p style={{ color: "#8b7669" }}>
            {isCartPage
              ? "Your selected books are waiting for you."
              : "Your favourite stories, saved in one place."}
          </p>

          {displayedBooks.length === 0 ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <h2 style={{ color: "#713b43" }}>
                {isCartPage ? "Your cart is empty" : "Your wishlist is empty"}
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
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "25px",
                marginTop: "30px"
              }}>
                {displayedBooks.map((book) => (
                  <div key={book.id} style={{
                    background: "#fff",
                    padding: "18px",
                    borderRadius: "8px",
                    boxShadow: "0 5px 20px #0001"
                  }}>
                    <img
                      src={book.image}
                      alt={book.title}
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                      onClick={() => openBook(book)}
                    />

                    <p style={{ color: "#b18a54" }}>{book.category}</p>
                    <h3 style={{ color: "#713b43" }}>{book.title}</h3>
                    <p>By {book.author}</p>
                    <h3>₹{book.price}</h3>

                    <button
                      onClick={() => openBook(book)}
                      style={primaryButtonStyle}
                    >
                      View Book
                    </button>

                    <button
                      onClick={() =>
                        isCartPage
                          ? removeFromCart(book.id)
                          : toggleWishlist(book.id)
                      }
                      style={{
                        background: "transparent",
                        border: "1px solid #713b43",
                        color: "#713b43",
                        padding: "10px",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>

                    {isCartPage && (
                      <button
                        onClick={() => toggleWishlist(book.id)}
                        style={{
                          display: "block",
                          marginTop: "12px",
                          background: "transparent",
                          border: "none",
                          color: "#713b43",
                          cursor: "pointer"
                        }}
                      >
                        ♡ Save to Wishlist
                      </button>
                    )}

                    {!isCartPage && (
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
                          color: "#713b43",
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
                <div style={{
                  marginTop: "35px",
                  padding: "25px",
                  background: "#eee5da",
                  borderRadius: "8px",
                  maxWidth: "400px"
                }}>
                  <h2 style={{ color: "#713b43" }}>Order Summary</h2>
                  <p>Books: {cart.length}</p>
                  <h2>Total: ₹{totalPrice}</h2>
                  <p style={{ color: "#8b7669", fontSize: "13px" }}>
                    Checkout will be added later.
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
    <div className="website">

      <nav className="navbar">
        <div className="logo">THE <span>FOLIÉ.</span></div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#books">Explore Books</a>
          <a href="#about">About Us</a>
        </div>

        <div className="nav-buttons">
          <button className="login-btn">Login</button>
          <button className="signup-btn">Sign Up</button>

          <button onClick={() => openPage("cart")} style={pageButtonStyle}>
            Cart ({cart.length})
          </button>

          <button onClick={() => openPage("wishlist")} style={pageButtonStyle}>
            ♡ ({wishlist.length})
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO THE FOLIÉ</p>

          <h1>
            Every Book Holds
            <br />
            A New <span>Universe.</span>
          </h1>

          <p className="hero-description">
            Find the story that finds you.
            Discover wonderful books, explore new ideas,
            and let every page take you somewhere new.
          </p>

          <a href="#books" className="explore-btn">
            Explore Collection →
          </a>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900"
            alt="Beautiful library"
          />
        </div>
      </section>

      <section className="books-section" id="books">
        <div className="section-heading">
          <p className="eyebrow">CURATED FOR READERS</p>
          <h2>Discover Your Next Favourite</h2>
          <p>Stories worth remembering. Books worth keeping.</p>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="Search your favourite books..."
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
                <span>₹{book.price}</span>
                <button onClick={() => openBook(book)}>
                  View Book →
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
          Explore stories, discover authors, and find inspiration
          in every page. Your next favourite book is waiting here.
        </p>
      </section>

      <footer>
        <h2>THE FOLIÉ.</h2>
        <p>Find the story that finds you.</p>
        <p>© 2026 The Folié. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default App;
