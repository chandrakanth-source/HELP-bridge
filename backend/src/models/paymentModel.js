const pool = require("../config/database");

const createPayment = async ({
  requestId,
  seekerId,
  providerId,
  amount,
  razorpayOrderId,
}) => {
  const result = await pool.query(
    `
      INSERT INTO payments (request_id, payer_id, provider_id, amount, payment_method, transaction_id)
      VALUES ($1, $2, $3, $4, 'razorpay', $5)
      RETURNING *;
    `,
    [requestId, seekerId, providerId, amount, razorpayOrderId],
  );
  return result.rows[0];
};

const updatePaymentStatus = async (
  razorpayOrderId,
  status,
  paymentId,
  payerId,
) => {
  const result = await pool.query(
    `
      UPDATE payments
      SET payment_status = $1,
          transaction_id = $2,
          paid_at = CASE WHEN $1 = 'successful' THEN CURRENT_TIMESTAMP ELSE paid_at END
      WHERE transaction_id = $3 AND payer_id = $4
      RETURNING *;
    `,
    [status, paymentId, razorpayOrderId, payerId],
  );
  return result.rows[0];
};

const getCompletedPaymentsForSeeker = async (seekerId) => {
  const result = await pool.query(
    `
      SELECT p.*, hr.title, hr.address, hr.updated_at, provider.name AS provider_name
      FROM payments p
      JOIN help_requests hr ON hr.id = p.request_id
      LEFT JOIN users provider ON provider.id = p.provider_id
      WHERE p.payer_id = $1
      ORDER BY p.created_at DESC;
    `,
    [seekerId],
  );
  return result.rows;
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  getCompletedPaymentsForSeeker,
};

