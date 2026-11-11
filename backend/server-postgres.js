
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool, types } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createFeatureRouter = require("./featureRoutes-postgres");

// Convert PostgreSQL BIGINT values to JavaScript numbers.
types.setTypeParser(20, value => Number(value));

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error("JWT_SECRET or DATABASE_URL is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10
});

pool.on("error", error => {
  console.error("Unexpected PostgreSQL error:", error.message);
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));

app.use(express.json({ limit: "2mb" }));

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Please log in first."
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session."
    });
  }
}

function formatUserData(row) {
  if (!row) {
    return {
      wishlist: [],
      cart: [],
      myBooks: [],
      orders: []
    };
  }

  return {
    wishlist: JSON.parse(row.wishlist),
    cart: JSON.parse(row.cart),
    myBooks: JSON.parse(row.my_books),
    orders: JSON.parse(row.orders)
  };
}

// Home
app.get("/", (req, res) => {
  res.json({ message: "Welcome to FOLIE API!" });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        message: "Name must contain 2 to 60 characters."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address."
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Password must contain 8 to 72 characters."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email`,
      [cleanName, cleanEmail, hashedPassword]
    );

    if (!result.rows.length) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const user = result.rows[0];

    res.status(201).json({
      message: "Your FOLIE account has been created!",
      token: createToken(user),
      user
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Could not create your account."
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [String(email).trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Incorrect email or password."
      });
    }

    const safeUser = {
      id: Number(user.id),
      name: user.name,
      email: user.email
    };

    res.json({
      message: "Login successful!",
      token: createToken(safeUser),
      user: safeUser
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Could not log in."
    });
  }
});

// Current user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const user = result.rows[0];
    user.id = Number(user.id);

    res.json({ user });
  } catch (error) {
    console.error("User lookup error:", error.message);
    res.status(500).json({
      message: "Could not load user."
    });
  }
});

// Get personal data
app.get("/api/user-data", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM user_data WHERE user_id = $1",
      [req.user.id]
    );

    res.json({
      data: formatUserData(result.rows[0])
    });
  } catch (error) {
    console.error("Get user data error:", error.message);
    res.status(500).json({
      message: "Could not load your personal data."
    });
  }
});

// Save personal data
app.put("/api/user-data", authenticateToken, async (req, res) => {
  try {
    const { wishlist, cart, myBooks, orders } = req.body;

    if (
      !Array.isArray(wishlist) ||
      !Array.isArray(cart) ||
      !Array.isArray(myBooks) ||
      !Array.isArray(orders)
    ) {
      return res.status(400).json({
        message: "All personal data fields must be arrays."
      });
    }

    await pool.query(
      `INSERT INTO user_data
       (user_id, wishlist, cart, my_books, orders)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         wishlist = EXCLUDED.wishlist,
         cart = EXCLUDED.cart,
         my_books = EXCLUDED.my_books,
         orders = EXCLUDED.orders,
         updated_at = CURRENT_TIMESTAMP::text`,
      [
        req.user.id,
        JSON.stringify(wishlist),
        JSON.stringify(cart),
        JSON.stringify(myBooks),
        JSON.stringify(orders)
      ]
    );

    res.json({
      message: "Your FOLIE data has been saved successfully."
    });
  } catch (error) {
    console.error("Save user data error:", error.message);
    res.status(500).json({
      message: "Could not save your personal data."
    });
  }
});

// Get reading progress
app.get("/api/reading-progress", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT book_id, page_number, updated_at
       FROM reading_progress
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ progress: result.rows });
  } catch (error) {
    console.error("Reading progress error:", error.message);
    res.status(500).json({
      message: "Could not load reading progress."
    });
  }
});

// Save reading progress
app.put("/api/reading-progress/:bookId", authenticateToken, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const pageNumber = Number(req.body.pageNumber);

    if (
      !Number.isSafeInteger(bookId) || bookId <= 0 ||
      !Number.isSafeInteger(pageNumber) || pageNumber < 1
    ) {
      return res.status(400).json({
        message: "Invalid book ID or page number."
      });
    }

    await pool.query(
      `INSERT INTO reading_progress (user_id, book_id, page_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, book_id) DO UPDATE SET
         page_number = EXCLUDED.page_number,
         updated_at = CURRENT_TIMESTAMP::text`,
      [req.user.id, bookId, pageNumber]
    );

    res.json({
      message: "Reading progress saved."
    });
  } catch (error) {
    console.error("Save reading progress error:", error.message);
    res.status(500).json({
      message: "Could not save reading progress."
    });
  }
});

// Project Gutenberg books
const publicDomainBooks = {
  1: 1342, 2: 11, 3: 84, 4: 1661, 5: 345,
  6: 35, 7: 17396, 8: 55, 9: 174, 10: 1952,
  11: 158, 12: 161, 13: 37106, 14: 2701, 15: 74,
  16: 98, 17: 1400, 18: 215, 20: 236, 21: 844,
  22: 1874, 24: 1232, 28: 408
};

app.get("/api/books/:bookId/content", async (req, res) => {
  const bookId = Number(req.params.bookId);
  const gutenbergId = publicDomainBooks[bookId];

  if (!Number.isSafeInteger(bookId) || !gutenbergId) {
    return res.status(404).json({
      message: "Full reading content is not available for this book."
    });
  }

  const urls = [
    `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}-0.txt`,
    `https://www.gutenberg.org/files/${gutenbergId}/${gutenbergId}.txt`
  ];

  try {
    let content = "";

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
          content = await response.text();
          if (content.trim()) break;
        }
      } catch {}
    }

    if (!content) {
      return res.status(502).json({
        message: "Could not retrieve the book content. Please try again."
      });
    }

    content = content.replace(/^\uFEFF/, "");
    content = content.replace(
      /^[\s\S]*?\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n/i,
      ""
    );
    content = content.replace(
      /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*$/i,
      ""
    );

    res.json({
      content: content.trim(),
      source: "Project Gutenberg"
    });
  } catch (error) {
    console.error("Book content error:", error.message);
    res.status(500).json({
      message: "Unable to load book content."
    });
  }
});

// Get book comments
app.get("/api/books/:bookId/comments", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Invalid book ID."
      });
    }

    const commentsResult = await pool.query(
      `SELECT c.id, c.book_id, c.user_id,
              u.name AS user_name, c.rating, c.comment,
              c.created_at, c.updated_at
       FROM book_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.book_id = $1
       ORDER BY c.created_at DESC, c.id DESC`,
      [bookId]
    );

    const summaryResult = await pool.query(
      `SELECT COUNT(*)::int AS "ratingCount",
              COALESCE(ROUND(AVG(rating), 1), 0) AS "averageRating"
       FROM book_comments
       WHERE book_id = $1`,
      [bookId]
    );

    res.json({
      comments: commentsResult.rows,
      ...summaryResult.rows[0]
    });
  } catch (error) {
    console.error("Load comments error:", error.message);
    res.status(500).json({
      message: "Could not load book comments."
    });
  }
});

// Add comment
app.post("/api/books/:bookId/comments", authenticateToken, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string"
      ? req.body.comment.trim()
      : "";

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Invalid book ID."
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5."
      });
    }

    if (!comment || comment.length > 1000) {
      return res.status(400).json({
        message: "Comment must contain 1 to 1000 characters."
      });
    }

    const result = await pool.query(
      `INSERT INTO book_comments (book_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookId, req.user.id, rating, comment]
    );

    const inserted = result.rows[0];

    const userResult = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [req.user.id]
    );

    const newComment = {
      ...inserted,
      user_name: userResult.rows[0].name
    };

    res.status(201).json({
      message: "Your review has been added.",
      comment: newComment
    });
  } catch (error) {
    console.error("Add comment error:", error.message);
    res.status(500).json({
      message: "Could not add your review."
    });
  }
});

// Edit own comment
app.put("/api/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string"
      ? req.body.comment.trim()
      : "";

    if (!Number.isSafeInteger(commentId) || commentId <= 0) {
      return res.status(400).json({
        message: "Invalid comment ID."
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5."
      });
    }

    if (!comment || comment.length > 1000) {
      return res.status(400).json({
        message: "Comment must contain 1 to 1000 characters."
      });
    }

    const result = await pool.query(
      `UPDATE book_comments
       SET rating = $1, comment = $2,
           updated_at = CURRENT_TIMESTAMP::text
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [rating, comment, commentId, req.user.id]
    );

    if (!result.rows.length) {
      const exists = await pool.query(
        "SELECT id FROM book_comments WHERE id = $1",
        [commentId]
      );

      return res.status(exists.rows.length ? 403 : 404).json({
        message: exists.rows.length
          ? "You can only edit your own comment."
          : "Comment not found."
      });
    }

    const userResult = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json({
      message: "Your review has been updated.",
      comment: {
        ...result.rows[0],
        user_name: userResult.rows[0].name
      }
    });
  } catch (error) {
    console.error("Edit comment error:", error.message);
    res.status(500).json({
      message: "Could not update your review."
    });
  }
});

// Delete own comment
app.delete("/api/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);

    if (!Number.isSafeInteger(commentId) || commentId <= 0) {
      return res.status(400).json({
        message: "Invalid comment ID."
      });
    }

    const result = await pool.query(
      `DELETE FROM book_comments
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [commentId, req.user.id]
    );

    if (!result.rows.length) {
      const exists = await pool.query(
        "SELECT id FROM book_comments WHERE id = $1",
        [commentId]
      );

      return res.status(exists.rows.length ? 403 : 404).json({
        message: exists.rows.length
          ? "You can only delete your own comment."
          : "Comment not found."
      });
    }

    res.json({
      message: "Your review has been deleted."
    });
  } catch (error) {
    console.error("Delete comment error:", error.message);
    res.status(500).json({
      message: "Could not delete your review."
    });
  }
});

// FOLIE bookmarks, community and reading challenges
app.use(
  "/api/features",
  createFeatureRouter(pool, authenticateToken)
);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "supabase-postgresql"
    });
  } catch (error) {
    console.error("Health check error:", error.message);
    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`FOLIE PostgreSQL backend running on port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down FOLIE PostgreSQL backend...");

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
