const pool = require("../config/database");

const createBargainOffer = async (offerData) => {
  const {
    request_id,
    provider_id,
    seeker_id,
    sender_role,
    offered_price,
    round_number = 1,
  } = offerData;

  const query = `
    INSERT INTO bargain_offers (
      request_id,
      provider_id,
      seeker_id,
      sender_role,
      offered_price,
      round_number,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *;
  `;

  const values = [
    request_id,
    provider_id,
    seeker_id,
    sender_role,
    offered_price,
    round_number,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const getBargainHistory = async (requestId) => {
  const query = `
    SELECT
      bo.*,
      p.name AS provider_name,
      s.name AS seeker_name
    FROM bargain_offers bo
    JOIN users p ON bo.provider_id = p.id
    JOIN users s ON bo.seeker_id = s.id
    WHERE bo.request_id = $1
    ORDER BY bo.created_at ASC;
  `;

  const result = await pool.query(query, [requestId]);
  return result.rows;
};

const acceptBargainOffer = async (offerId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const offerQuery = `
      UPDATE bargain_offers
      SET status = 'accepted'
      WHERE id = $1
      RETURNING *;
    `;
    const offerResult = await client.query(offerQuery, [offerId]);
    if (offerResult.rows.length === 0) {
      throw new Error("Bargain offer not found");
    }

    const offer = offerResult.rows[0];

    await client.query(
      `UPDATE bargain_offers SET status = 'rejected' WHERE request_id = $1 AND id <> $2 AND status = 'pending'`,
      [offer.request_id, offerId]
    );

    const requestQuery = `
      UPDATE help_requests
      SET
        assigned_provider_id = $1,
        agreed_price = $2,
        status = 'accepted',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const requestResult = await client.query(requestQuery, [
      offer.provider_id,
      offer.offered_price,
      offer.request_id,
    ]);

    await client.query(
      `UPDATE users SET availability_status = 'busy', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [offer.provider_id]
    );

    await client.query("COMMIT");

    return {
      offer,
      request: requestResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const rejectBargainOffer = async (offerId) => {
  const query = `
    UPDATE bargain_offers
    SET status = 'rejected'
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [offerId]);
  return result.rows[0];
};

module.exports = {
  createBargainOffer,
  getBargainHistory,
  acceptBargainOffer,
  rejectBargainOffer,
};

