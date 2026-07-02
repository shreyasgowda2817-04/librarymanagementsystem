import Book from "../models/book.js";
import Member from "../models/member.js";

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ books: [], members: [] });

    const regex = new RegExp(q, "i");

    const [books, members] = await Promise.all([
      Book.find({
        $or: [
          { title: regex },
          { author: regex },
          { isbn: regex },
          { category: regex }
        ]
      }).limit(5),
      Member.find({
        $or: [
          { name: regex },
          { email: regex }
        ]
      }).limit(5)
    ]);

    res.json({ books, members });
  } catch (err) {
    next(err);
  }
};
