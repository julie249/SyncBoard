import { User } from '../models/User.js';

export const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query.trim(), $options: 'i' } },
        { email: { $regex: query.trim(), $options: 'i' } }
      ]
    })
      .select('name email avatar')
      .limit(10);

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};
