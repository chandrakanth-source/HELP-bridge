const pool = require("../config/database");

const getManagerApplications = async () => {
  const result = await pool.query(`
    SELECT
      id,
      name,
      email,
      phone,
      occupation,
      address,
      verification_status,
      created_at
    FROM users
    WHERE role = 'manager'
    ORDER BY created_at DESC
  `);

  return result.rows;
};

const updateManagerVerification = async (id, verificationStatus) => {
  const result = await pool.query(
    `
      UPDATE users
      SET verification_status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND role = 'manager'
      RETURNING id, name, email, phone, occupation, address, role, verification_status, created_at
    `,
    [verificationStatus, id],
  );

  return result.rows[0];
};

module.exports = {
  getManagerApplications,
  updateManagerVerification,
};

