import User from "../models/user.js";

const LEVELS = [
  { name: "Novice Reader", min: 0 },
  { name: "Book Worm", min: 51 },
  { name: "Library Sage", min: 201 },
  { name: "Grand Master", min: 501 }
];

export const awardPoints = async (userId, points) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.points === undefined || user.points === null) {
      user.points = 0;
    }
    user.points += points;

    // Determine level
    const newLevel = LEVELS.slice().reverse().find(l => user.points >= l.min);
    if (newLevel && newLevel.name !== user.level) {
      user.level = newLevel.name;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error("Error awarding points:", error);
  }
};
