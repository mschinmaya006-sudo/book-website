
export default function AccountPage({ user, counts, onNavigate, onLogout }) {
  const name = user?.name || "FOLIÉ Reader";
  const email = user?.email || "Email not available";
  const initial = name.charAt(0).toUpperCase();

  const sections = [
    {
      title: "My Bookshelf",
      description: "Continue exploring the books you have collected.",
      count: counts.books,
      action: "mybooks",
      symbol: "📚",
    },
    {
      title: "My Orders",
      description: "View your previous orders and order details.",
      count: counts.orders,
      action: "orders",
      symbol: "📦",
    },
    {
      title: "My Wishlist",
      description: "Your favourite books saved for later.",
      count: counts.wishlist,
      action: "wishlist",
      symbol: "♡",
    },
    {
      title: "My Cart",
      description: "Books waiting for you.",
      count: counts.cart,
      action: "cart",
      symbol: "🛒",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f1e8",
      color: "#35151f",
      fontFamily: "Georgia, serif",
      padding: "35px 20px",
    }}>
      <div style={{ maxWidth: "850px", margin: "auto" }}>
        <button
          onClick={() => onNavigate("home")}
          style={{
            background: "transparent",
            border: "1px solid #8b6540",
            color: "#632b3c",
            padding: "10px 18px",
            cursor: "pointer",
            borderRadius: "8px",
          }}
        >
          ← Back to Home
        </button>

        <h1 style={{
          textAlign: "center",
          fontSize: "38px",
          marginTop: "35px",
          color: "#632b3c",
        }}>
          My Account
        </h1>

        <p style={{
          textAlign: "center",
          color: "#8b735f",
          marginBottom: "35px",
        }}>
          Your personal reading space at FOLIÉ
        </p>

        <div style={{
          background: "#fffaf3",
          border: "1px solid #d8bd91",
          borderRadius: "18px",
          padding: "30px",
          display: "flex",
          alignItems: "center",
          gap: "22px",
          flexWrap: "wrap",
          boxShadow: "0 8px 25px #35151f12",
        }}>
          <div style={{
            width: "75px",
            height: "75px",
            borderRadius: "50%",
            background: "#632b3c",
            color: "#f4d69a",
            display: "grid",
            placeItems: "center",
            fontSize: "32px",
          }}>
            {initial}
          </div>

          <div>
            <h2 style={{ margin: "0 0 8px" }}>{name}</h2>
            <p style={{ margin: 0, color: "#806b5b" }}>{email}</p>
            <p style={{
              margin: "8px 0 0",
              color: "#a27b43",
              fontSize: "13px",
            }}>
              ✦ FOLIÉ Reader
            </p>
          </div>
        </div>

        <h2 style={{ marginTop: "38px", color: "#632b3c" }}>
          Your Library
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "18px",
        }}>
          {sections.map((section) => (
            <button
              key={section.action}
              onClick={() => onNavigate(section.action)}
              style={{
                background: "#fffaf3",
                border: "1px solid #d8bd91",
                borderRadius: "15px",
                padding: "24px",
                textAlign: "left",
                cursor: "pointer",
                color: "#35151f",
              }}
            >
              <div style={{ fontSize: "30px" }}>{section.symbol}</div>
              <h3>{section.title}</h3>
              <p style={{ color: "#806b5b", fontSize: "14px" }}>
                {section.description}
              </p>
              <strong style={{ color: "#a27b43" }}>
                {section.count} items →
              </strong>
            </button>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={onLogout}
            style={{
              background: "#632b3c",
              color: "#fffaf3",
              border: "none",
              padding: "13px 35px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Log Out
          </button>
        </div>

        <p style={{
          textAlign: "center",
          color: "#a27b43",
          marginTop: "35px",
          fontSize: "13px",
        }}>
          FOLIÉ — Every Book Has a World.
        </p>
      </div>
    </div>
  );
}
