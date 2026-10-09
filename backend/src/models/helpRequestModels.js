const pool = require("../config/database");

const createHelpRequest = async (requestData) => {
  const {
    requester_id,
    request_type,
    emergency_type,
    title,
    description,
    latitude,
    longitude,
    address,
  } = requestData;

  const query = `
        INSERT INTO help_requests (
            requester_id,
            request_type,
            emergency_type,
            title,
            description,
            latitude,
            longitude,
            address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

  const values = [
    requester_id,
    request_type,
    emergency_type,
    title,
    description,
    latitude,
    longitude,
    address,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const getHelpRequestsByUser = async (requester_id) => {
  const query = `
        SELECT *
        FROM help_requests
        WHERE requester_id = $1
        ORDER BY created_at DESC;
    `;

  const result = await pool.query(query, [requester_id]);

  return result.rows;
};

const getHelpRequestById = async (id) => {
  const query = `
        SELECT
            hr.*,
            requester.name AS requester_name,
            requester.phone AS requester_phone,
            provider.name AS provider_name,
            provider.phone AS provider_phone
        FROM help_requests hr
        JOIN users requester
            ON hr.requester_id = requester.id
        LEFT JOIN users provider
            ON hr.assigned_provider_id = provider.id
        WHERE hr.id = $1;
    `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

module.exports = {
  createHelpRequest,
  getHelpRequestsByUser,
  getHelpRequestById,
};

