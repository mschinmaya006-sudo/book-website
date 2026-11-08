import React, { useState } from "react";

function BookDetails() {
  const [wishlist, setWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  return (
    <div style={{
      background: "#f8f5f0",
      minHeight: "100vh",
      padding: "40px",
      color: "#3d2929",
      fontFamily: "Georgia, serif"
    }}>

      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #d8c6ad",
        paddingBottom: "20px"
      }}>
        <h2 style={{ color: "#713b43" }}>THE FOLIÉ</h2>
        <span>Home　 |　 Explore Books　 |　 My Bookshelf</span>
      </header>

      <div style={{
        display: "flex",
        gap: "60px",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "70px 20px"
      }}>

        <img
          src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600"
          alt="Book cover"
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
            EDITOR'S PICK
          </p>

          <h1 style={{
            fontSize: "42px",
            color: "#713b43"
          }}>
            The Alchemist
          </h1>

          <h3 style={{ color: "#8b7669" }}>
            By Paulo Coelho
          </h3>

          <p style={{ lineHeight: "1.8", fontSize: "17px" }}>
            A beautiful journey about following your dreams,
            discovering your purpose and listening to your heart.
            A story that inspires readers to find their own treasure.
          </p>

          <h2 style={{ color: "#713b43" }}>₹299</h2>

          <p>★★★★★　4.8 / 5</p>

          <button
            onClick={() => setAddedToCart(!addedToCart)}
            style={{
              background: "#713b43",
              color: "white",
              padding: "14px 25px",
              border: "none",
              cursor: "pointer",
              marginRight: "12px"
            }}
          >
            {addedToCart ? "Added to Cart ✓" : "Add to Cart"}
          </button>

          <button
            onClick={() => setWishlist(!wishlist)}
            style={{
              background: "transparent",
              color: "#713b43",
              padding: "13px 20px",
              border: "1px solid #713b43",
              cursor: "pointer"
            }}
          >
            {wishlist ? "♥ Wishlisted" : "♡ Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;