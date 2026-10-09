
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

function findNearestNeighbors(targetLocation, candidateProviders, k = 1) {
  if (!targetLocation || candidateProviders.length === 0) {
    return [];
  }

  const targetLat = parseFloat(targetLocation.latitude);
  const targetLon = parseFloat(targetLocation.longitude);

  const rankedCandidates = candidateProviders
    .map((provider) => {
      const pLat = parseFloat(provider.latitude);
      const pLon = parseFloat(provider.longitude);

      if (isNaN(pLat) || isNaN(pLon)) {
        return null;
      }

      const dist = calculateHaversineDistance(targetLat, targetLon, pLat, pLon);
      return {
        ...provider,
        distance_km: dist,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_km - b.distance_km);

  return rankedCandidates.slice(0, k);
}

module.exports = {
  calculateHaversineDistance,
  findNearestNeighbors,
};

