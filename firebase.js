// ══════════════════════════════════════════
// 🔥 FIREBASE - Aggiornamento Appeal Status
// ══════════════════════════════════════════

const FIREBASE_URL = 'https://comune-di-piacenza-d1492-default-rtdb.europe-west1.firebasedatabase.app/';
// ↑ SOSTITUISCI CON IL TUO URL!

/**
 * Aggiorna lo stato di un appeal su Firebase
 */
async function updateAppealStatus(caseId, data) {
    try {
        const url = `${FIREBASE_URL}/appeals/${caseId}.json`;
        
        console.log(`🔥 [FIREBASE] Aggiornamento appeal #${caseId}:`, data);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log(`✅ [FIREBASE] Appeal #${caseId} aggiornato con successo!`);
        return true;

    } catch (error) {
        console.error(`❌ [FIREBASE] Errore aggiornamento appeal #${caseId}:`, error);
        return false;
    }
}

/**
 * Segna appeal come pending (quando viene creato)
 */
async function setAppealPending(caseId, userId, guildId) {
    return await updateAppealStatus(caseId, {
        status: 'pending',
        user_id: userId,
        guild_id: guildId,
        created_at: new Date().toISOString()
    });
}

/**
 * Segna appeal come accepted (quando staff accetta)
 */
async function setAppealAccepted(caseId, inviteUrl, resolvedBy) {
    return await updateAppealStatus(caseId, {
        status: 'accepted',
        invite: inviteUrl,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
    });
}

/**
 * Segna appeal come rejected (quando staff rifiuta)
 */
async function setAppealRejected(caseId, reason, resolvedBy) {
    return await updateAppealStatus(caseId, {
        status: 'rejected',
        reason: reason || 'Nessun motivo fornito',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
    });
}

module.exports = {
    updateAppealStatus,
    setAppealPending,
    setAppealAccepted,
    setAppealRejected
};