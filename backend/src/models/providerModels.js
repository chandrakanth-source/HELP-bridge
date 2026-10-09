const pool = require("../config/database");

const getApprovedRequests = async (providerId) => {
  const query = `
        SELECT
            hr.id,
            hr.requester_id,
            hr.request_type,
            hr.emergency_type,
            hr.title,
            hr.description,
            hr.latitude,
            hr.longitude,
            hr.address,
            hr.status,
            hr.created_at,
            u.name AS requester_name,
            u.phone AS requester_phone
        FROM help_requests hr
        JOIN users u
            ON hr.requester_id = u.id
        WHERE hr.status = 'approved'
          AND hr.assigned_provider_id IS NULL
          AND hr.requester_id <> $1
        ORDER BY hr.created_at ASC;
    `;

  const result = await pool.query(query, [providerId]);

  return result.rows;
};

const getProviderRequests = async (providerId) => {
  const query = `
    SELECT
      hr.*,
      requester.name AS requester_name,
      requester.phone AS requester_phone,
      requester.email AS requester_email
    FROM help_requests hr
    JOIN users requester ON requester.id = hr.requester_id
    WHERE hr.assigned_provider_id = $1
    ORDER BY hr.updated_at DESC;
  `;

  const result = await pool.query(query, [providerId]);
  return result.rows;
};

const getApprovedRequestById = async (id) => {
  const query = `
        SELECT
            hr.id,
            hr.requester_id,
            hr.request_type,
            hr.emergency_type,
            hr.title,
            hr.description,
            hr.latitude,
            hr.longitude,
            hr.address,
            hr.status,
            hr.assigned_provider_id,
            hr.created_at,
            u.name AS requester_name,
            u.phone AS requester_phone
        FROM help_requests hr
        JOIN users u
            ON hr.requester_id = u.id
        WHERE hr.id = $1;
    `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

const acceptHelpRequest = async (requestId, providerId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestQuery = `
            UPDATE help_requests
            SET
                assigned_provider_id = $1,
                status = 'accepted',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND (
                (status = 'approved' AND assigned_provider_id IS NULL)
                OR (status = 'assigned' AND assigned_provider_id = $1)
              )
            RETURNING *;
        `;

    const requestResult = await client.query(requestQuery, [
      providerId,
      requestId,
    ]);

    if (requestResult.rows.length === 0) {
      throw new Error("Request is not available for acceptance");
    }

    const providerQuery = `
            UPDATE users
            SET
                availability_status = 'busy',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND role IN ('provider', 'seeker', 'user')
              AND availability_status IN ('available', 'busy')
            RETURNING id, availability_status;
        `;

    const providerResult = await client.query(providerQuery, [providerId]);

    if (providerResult.rows.length === 0) {
      throw new Error("Provider not found");
    }

    await client.query("COMMIT");

    return {
      request: requestResult.rows[0],
      provider: providerResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const startHelpRequest = async (requestId, providerId) => {
  const query = `
        UPDATE help_requests
        SET
            status = 'in_progress',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND assigned_provider_id = $2
          AND status = 'accepted'
        RETURNING *;
    `;

  const result = await pool.query(query, [requestId, providerId]);

  return result.rows[0];
};

const completeHelpRequest = async (requestId, providerId) => {
  const query = `
        UPDATE help_requests
        SET
            status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND assigned_provider_id = $2
          AND status = 'in_progress'
        RETURNING *;
    `;

  const result = await pool.query(query, [requestId, providerId]);

  return result.rows[0];
};

module.exports = {
  completeHelpRequest,
  getProviderRequests,
  startHelpRequest,
  getApprovedRequests,
  getApprovedRequestById,
  acceptHelpRequest,
};

