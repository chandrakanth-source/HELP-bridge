const pool = require("../config/database");

const findUserByEmail = async (email) => {
  const query = `
        SELECT *
        FROM users
        WHERE email = $1;
    `;

  const result = await pool.query(query, [email]);

  return result.rows[0];
};

const findUserById = async (id) => {
  const query = `
        SELECT
            id,
            name,
            email,
            phone,
            occupation,
            blood_group,
            latitude,
            longitude,
            address,
            role,
            availability_status,
            verification_status,
            created_at
        FROM users
        WHERE id = $1;
    `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

const updatePassword = async (id, passwordHash) => {
  const query = `
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, email, role;
    `;

  const result = await pool.query(query, [passwordHash, id]);

  return result.rows[0];
};

const createUser = async (userData) => {
  const {
    name,
    email,
    phone,
    password_hash,
    occupation,
    blood_group,
    latitude,
    longitude,
    address,
    role,
  } = userData;

  const query = `
        INSERT INTO users (
            name,
            email,
            phone,
            password_hash,
            occupation,
            blood_group,
            latitude,
            longitude,
            address,
            role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
            id,
            name,
            email,
            phone,
            occupation,
            blood_group,
            latitude,
            longitude,
            address,
            role,
            availability_status,
            verification_status,
            created_at;
    `;

  const values = [
    name,
    email,
    phone,
    password_hash,
    occupation,
    blood_group,
    latitude,
    longitude,
    address,
    role || "seeker",
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const updateUserProfile = async (id, profile) => {
  const result = await pool.query(
    `
      UPDATE users
      SET name = $1,
          phone = $2,
          occupation = $3,
          blood_group = $4,
          address = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, email, phone, occupation, blood_group, address, role,
                availability_status, verification_status, created_at;
    `,
    [
      profile.name,
      profile.phone,
      profile.occupation,
      profile.blood_group,
      profile.address,
      id,
    ],
  );

  return result.rows[0];
};

const updateUserLocation = async (id, latitude, longitude) => {
  const result = await pool.query(
    `
      UPDATE users
        SET latitude = $1,
          longitude = $2,
          last_located_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, latitude, longitude, updated_at;
    `,
    [latitude, longitude, id],
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updatePassword,
  updateUserProfile,
  updateUserLocation,
};

