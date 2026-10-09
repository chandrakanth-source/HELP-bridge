const pool = require("../config/database");
const {
  createBargainOffer,
  getBargainHistory,
  acceptBargainOffer,
  rejectBargainOffer,
} = require("../models/bargainModel");
const { createNotification } = require("../models/notificationModel");

const submitOffer = async (req, res) => {
  try {
    const { request_id, provider_id, offered_price, round_number } = req.body;
    const userId = req.user.id;

    if (!request_id || !offered_price || parseFloat(offered_price) <= 0) {
      return res.status(400).json({ message: "Invalid request or price." });
    }

    const reqResult = await pool.query(`SELECT * FROM help_requests WHERE id = $1`, [request_id]);
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ message: "Help request not found." });
    }

    const helpReq = reqResult.rows[0];
    const isSeeker = Number(userId) === Number(helpReq.requester_id);
    const sender_role = isSeeker ? "seeker" : "provider";
    const seeker_id = helpReq.requester_id;

    const effectiveProviderId = isSeeker
      ? Number(provider_id)
      : Number(userId);

    if (!Number.isInteger(effectiveProviderId) || effectiveProviderId <= 0) {
      return res.status(400).json({
        message: isSeeker
          ? "A valid provider is required for seeker counter-offers."
          : "Could not identify provider account.",
      });
    }

    if (helpReq.status === 'approved' || helpReq.status === 'pending_verification') {
      await pool.query(`UPDATE help_requests SET status = 'bargaining' WHERE id = $1`, [request_id]);
    }

    const offer = await createBargainOffer({
      request_id,
      provider_id: effectiveProviderId,
      seeker_id,
      sender_role,
      offered_price: parseFloat(offered_price),
      round_number: round_number ? parseInt(round_number) : 1,
    });

    const targetUserId = isSeeker ? effectiveProviderId : seeker_id;
    await createNotification(
      targetUserId,
      request_id,
      "bargain_offer",
      "New Price Offer Received",
      `${isSeeker ? "Requester" : "Provider"} proposed a price of $${parseFloat(offered_price).toFixed(2)}.`
    );

    res.status(201).json({ message: "Bargain offer submitted successfully", offer });
  } catch (error) {
    console.error("Submit offer error:", error);
    res.status(500).json({ message: "Failed to submit bargain offer" });
  }
};

const getHistory = async (req, res) => {
  try {
    const { requestId } = req.params;
    const history = await getBargainHistory(requestId);
    res.status(200).json({ history });
  } catch (error) {
    console.error("Get bargain history error:", error);
    res.status(500).json({ message: "Failed to fetch bargain history" });
  }
};

const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const result = await acceptBargainOffer(offerId);

    await createNotification(
      result.request.requester_id,
      result.request.id,
      "bargain_accepted",
      "Bargain Agreed!",
      `Agreed price: $${parseFloat(result.request.agreed_price).toFixed(2)}. Provider assigned.`
    );

    await createNotification(
      result.request.assigned_provider_id,
      result.request.id,
      "bargain_accepted",
      "Bargain Agreed!",
      `Agreed price: $${parseFloat(result.request.agreed_price).toFixed(2)}. Request assigned to you.`
    );

    res.status(200).json({
      message: "Bargain offer accepted and help request finalized!",
      request: result.request,
      offer: result.offer,
    });
  } catch (error) {
    console.error("Accept offer error:", error);
    res.status(500).json({ message: error.message || "Failed to accept offer" });
  }
};

const rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await rejectBargainOffer(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Bargain offer not found" });
    }

    const requestResult = await pool.query(
      `
      UPDATE help_requests
      SET
        assigned_provider_id = NULL,
        status = 'approved',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
      `,
      [offer.request_id]
    );

    const updatedRequest = requestResult.rows[0];

    await createNotification(
      offer.provider_id,
      offer.request_id,
      "bargain_rejected",
      "Bargain Rejected",
      "The offer was rejected. The request has been made available to other providers."
    );

    res.status(200).json({
      message: "Bargain offer rejected. Request returned to available queue for new providers.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Reject offer error:", error);
    res.status(500).json({ message: "Failed to reject bargain offer" });
  }
};

module.exports = {
  submitOffer,
  getHistory,
  acceptOffer,
  rejectOffer,
};

