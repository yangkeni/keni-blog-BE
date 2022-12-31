import { db } from '../db.js';

export const getTags = (req, res) => {
  const tagsQuery = 'select * from tags';
  db.query(tagsQuery, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(
      data?.map((val) => {
        return {
          id: val.tag_id,
          label: val.content,
          color: val.color,
          value: val.color,
        };
      })
    );
  });
};
