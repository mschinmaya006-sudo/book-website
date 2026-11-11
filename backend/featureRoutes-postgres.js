
const express = require("express");

function createFeatureRouter(pool, authenticateToken) {
  const router = express.Router();

  // Reading Bookmarks
  router.get("/bookmarks", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, book_id AS "bookId",
                page_number AS "pageNumber", note, created_at AS "createdAt"
         FROM bookmarks
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );

      res.json({ bookmarks: result.rows });
    } catch (error) {
      console.error("Load bookmarks error:", error.message);
      res.status(500).json({ message: "Could not load bookmarks." });
    }
  });

  router.post("/bookmarks", authenticateToken, async (req, res) => {
    try {
      const bookId = Number(req.body.bookId);
      const pageNumber = Number(req.body.pageNumber);
      const note = typeof req.body.note === "string"
        ? req.body.note.trim()
        : "";

      if (
        !Number.isSafeInteger(bookId) || bookId <= 0 ||
        !Number.isSafeInteger(pageNumber) || pageNumber < 1
      ) {
        return res.status(400).json({
          message: "Invalid book ID or page number."
        });
      }

      const result = await pool.query(
        `INSERT INTO bookmarks (user_id, book_id, page_number, note)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, book_id, page_number)
         DO UPDATE SET note = EXCLUDED.note
         RETURNING id, book_id AS "bookId",
                   page_number AS "pageNumber", note,
                   created_at AS "createdAt"`,
        [req.user.id, bookId, pageNumber, note]
      );

      res.status(201).json({
        message: "Bookmark saved.",
        bookmark: result.rows[0]
      });
    } catch (error) {
      console.error("Save bookmark error:", error.message);
      res.status(500).json({ message: "Could not save bookmark." });
    }
  });

  router.delete("/bookmarks/:id", authenticateToken, async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid bookmark ID." });
      }

      const result = await pool.query(
        "DELETE FROM bookmarks WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, req.user.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ message: "Bookmark not found." });
      }

      res.json({ message: "Bookmark deleted." });
    } catch (error) {
      console.error("Delete bookmark error:", error.message);
      res.status(500).json({ message: "Could not delete bookmark." });
    }
  });

  // Reader Community
  router.get("/community", async (req, res) => {
    try {
      const posts = await pool.query(
        `SELECT p.id, p.user_id AS "userId",
                u.name AS "userName", p.content,
                p.created_at AS "createdAt"
         FROM community_posts p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC, p.id DESC`
      );

      const replies = await pool.query(
        `SELECT r.id, r.post_id AS "postId",
                r.user_id AS "userId", u.name AS "userName",
                r.content, r.created_at AS "createdAt"
         FROM community_replies r
         JOIN users u ON u.id = r.user_id
         ORDER BY r.created_at ASC, r.id ASC`
      );

      res.json({
        posts: posts.rows,
        replies: replies.rows
      });
    } catch (error) {
      console.error("Load community error:", error.message);
      res.status(500).json({ message: "Could not load community." });
    }
  });

  router.post("/community", authenticateToken, async (req, res) => {
    try {
      const content = typeof req.body.content === "string"
        ? req.body.content.trim()
        : "";

      if (!content || content.length > 2000) {
        return res.status(400).json({
          message: "Post must contain 1 to 2000 characters."
        });
      }

      const result = await pool.query(
        `INSERT INTO community_posts (user_id, content)
         VALUES ($1, $2)
         RETURNING id, user_id AS "userId", content,
                   created_at AS "createdAt"`,
        [req.user.id, content]
      );

      const user = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [req.user.id]
      );

      res.status(201).json({
        message: "Community post created.",
        post: {
          ...result.rows[0],
          userName: user.rows[0].name
        }
      });
    } catch (error) {
      console.error("Create post error:", error.message);
      res.status(500).json({ message: "Could not create post." });
    }
  });

  router.post(
    "/community/:postId/replies",
    authenticateToken,
    async (req, res) => {
      try {
        const postId = Number(req.params.postId);
        const content = typeof req.body.content === "string"
          ? req.body.content.trim()
          : "";

        if (!Number.isSafeInteger(postId) || postId <= 0) {
          return res.status(400).json({ message: "Invalid post ID." });
        }

        if (!content || content.length > 1000) {
          return res.status(400).json({
            message: "Reply must contain 1 to 1000 characters."
          });
        }

        const post = await pool.query(
          "SELECT id FROM community_posts WHERE id = $1",
          [postId]
        );

        if (!post.rows.length) {
          return res.status(404).json({ message: "Post not found." });
        }

        const result = await pool.query(
          `INSERT INTO community_replies (post_id, user_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, post_id AS "postId",
                     user_id AS "userId", content,
                     created_at AS "createdAt"`,
          [postId, req.user.id, content]
        );

        const user = await pool.query(
          "SELECT name FROM users WHERE id = $1",
          [req.user.id]
        );

        res.status(201).json({
          message: "Reply added.",
          reply: {
            ...result.rows[0],
            userName: user.rows[0].name
          }
        });
      } catch (error) {
        console.error("Add reply error:", error.message);
        res.status(500).json({ message: "Could not add reply." });
      }
    }
  );

  // Reading Challenges
  const validChallenges = {
    "books-3": 3,
    "books-5": 5,
    "pages-100": 100
  };

  router.get("/challenges", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, challenge_type AS "challengeType",
                progress, created_at AS "createdAt"
         FROM reading_challenges
         WHERE user_id = $1
         ORDER BY id`,
        [req.user.id]
      );

      res.json({ challenges: result.rows });
    } catch (error) {
      console.error("Load challenges error:", error.message);
      res.status(500).json({ message: "Could not load challenges." });
    }
  });

  router.post("/challenges", authenticateToken, async (req, res) => {
    try {
      const type = req.body.challengeType;

      if (!Object.prototype.hasOwnProperty.call(validChallenges, type)) {
        return res.status(400).json({
          message: "Invalid reading challenge."
        });
      }

      const result = await pool.query(
        `INSERT INTO reading_challenges
         (user_id, challenge_type, progress)
         VALUES ($1, $2, 0)
         ON CONFLICT (user_id, challenge_type) DO NOTHING
         RETURNING id, challenge_type AS "challengeType",
                   progress, created_at AS "createdAt"`,
        [req.user.id, type]
      );

      if (result.rows.length) {
        return res.status(201).json({
          message: "Reading challenge added.",
          challenge: result.rows[0]
        });
      }

      const existing = await pool.query(
        `SELECT id, challenge_type AS "challengeType",
                progress, created_at AS "createdAt"
         FROM reading_challenges
         WHERE user_id = $1 AND challenge_type = $2`,
        [req.user.id, type]
      );

      res.json({
        message: "Challenge already exists.",
        challenge: existing.rows[0]
      });
    } catch (error) {
      console.error("Add challenge error:", error.message);
      res.status(500).json({
        message: "Could not add reading challenge."
      });
    }
  });

  router.put(
    "/challenges/:type/progress",
    authenticateToken,
    async (req, res) => {
      try {
        const type = req.params.type;
        const progress = Number(req.body.progress);

        if (!Object.prototype.hasOwnProperty.call(validChallenges, type)) {
          return res.status(400).json({
            message: "Invalid reading challenge."
          });
        }

        if (
          !Number.isSafeInteger(progress) ||
          progress < 0 ||
          progress > validChallenges[type]
        ) {
          return res.status(400).json({
            message: "Invalid challenge progress."
          });
        }

        const result = await pool.query(
          `UPDATE reading_challenges
           SET progress = $1
           WHERE user_id = $2 AND challenge_type = $3
           RETURNING id, challenge_type AS "challengeType",
                     progress, created_at AS "createdAt"`,
          [progress, req.user.id, type]
        );

        if (!result.rows.length) {
          return res.status(404).json({
            message: "Reading challenge not found."
          });
        }

        res.json({
          message: "Challenge progress updated.",
          challenge: result.rows[0]
        });
      } catch (error) {
        console.error("Update challenge error:", error.message);
        res.status(500).json({
          message: "Could not update challenge progress."
        });
      }
    }
  );

  return router;
}

module.exports = createFeatureRouter;
