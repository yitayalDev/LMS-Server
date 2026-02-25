import axios from 'axios';

/**
 * Outbound Webhook Service
 * Fires a POST request to the organization's configured webhookUrl on specified events.
 */
export const fireWebhook = async (webhookUrl: string, event: string, payload: object) => {
    if (!webhookUrl) return;
    try {
        await axios.post(webhookUrl, {
            event,
            timestamp: new Date().toISOString(),
            data: payload
        }, {
            timeout: 5000, // 5 second timeout
            headers: { 'Content-Type': 'application/json', 'X-LMS-Event': event }
        });
    } catch (error) {
        // Log but don't throw — webhook failures shouldn't break main flow
        console.error(`Webhook delivery failed for event ${event}:`, error);
    }
};
