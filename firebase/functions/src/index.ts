import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ─── Send Push Notification ────────────────────────────────────────────────────

async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high', notification: { color: '#FF6B8A', sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (error) {
    console.error('Push notification failed:', error);
  }
}

// ─── Feed Reminder ─────────────────────────────────────────────────────────────

export const checkFeedReminders = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const twoHoursAgo = new admin.firestore.Timestamp(now.seconds - 7200, 0);
    const threeHoursAgo = new admin.firestore.Timestamp(now.seconds - 10800, 0);

    const feedsSnapshot = await db.collectionGroup('feeds')
      .where('startTime', '<=', twoHoursAgo)
      .where('startTime', '>=', threeHoursAgo)
      .get();

    const processedBabies = new Set<string>();

    for (const feedDoc of feedsSnapshot.docs) {
      const feed = feedDoc.data();
      if (processedBabies.has(feed.babyId)) continue;
      processedBabies.add(feed.babyId);

      const babyDoc = await db.collection('babies').doc(feed.babyId).get();
      if (!babyDoc.exists) continue;
      const baby = babyDoc.data()!;

      const userDoc = await db.collection('users').doc(feed.userId).get();
      if (!userDoc.exists) continue;
      const user = userDoc.data()!;

      if (user.fcmToken) {
        const timeSince = Math.round((now.seconds - feed.startTime.seconds) / 60);
        await sendPushNotification(
          user.fcmToken,
          `🍼 Feed Reminder - ${baby.name}`,
          `It's been ${timeSince} minutes since last feeding. ${baby.name} may be hungry!`,
          { type: 'feed_reminder', babyId: feed.babyId }
        );

        await db.collection('notifications').add({
          userId: feed.userId,
          babyId: feed.babyId,
          type: 'feed_reminder',
          title: `🍼 Feed Reminder - ${baby.name}`,
          body: `It's been ${timeSince} minutes since last feeding.`,
          read: false,
          createdAt: now,
        });
      }
    }
    return null;
  });

// ─── Vaccine Due Reminder ─────────────────────────────────────────────────────

export const checkVaccineDueReminders = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    const vaccinesSnapshot = await db.collectionGroup('vaccines')
      .where('status', '==', 'pending')
      .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('scheduledDate', '<=', admin.firestore.Timestamp.fromDate(weekLater))
      .get();

    for (const doc of vaccinesSnapshot.docs) {
      const vaccine = doc.data();
      const babyDoc = await db.collection('babies').doc(vaccine.babyId).get();
      const userDoc = await db.collection('users').doc(vaccine.userId).get();
      if (!babyDoc.exists || !userDoc.exists) continue;

      const baby = babyDoc.data()!;
      const user = userDoc.data()!;
      const daysUntil = Math.ceil((vaccine.scheduledDate.toDate() - today.getTime()) / (1000 * 3600 * 24));

      if (user.fcmToken) {
        await sendPushNotification(
          user.fcmToken,
          `💉 Vaccine Due - ${baby.name}`,
          daysUntil === 0
            ? `${vaccine.vaccineName} is due today!`
            : `${vaccine.vaccineName} is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}.`,
          { type: 'vaccine_due', babyId: vaccine.babyId }
        );
      }
    }
    return null;
  });

// ─── AI Insights Generator ─────────────────────────────────────────────────────

export const generateDailyInsights = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, 0);

    const babiesSnapshot = await db.collection('babies').get();

    for (const babyDoc of babiesSnapshot.docs) {
      const baby = babyDoc.data();
      const babyId = babyDoc.id;

      // Count feeds
      const feedsCount = (await db.collection('feeds')
        .where('babyId', '==', babyId)
        .where('startTime', '>=', yesterday)
        .get()).size;

      // Count sleep time
      const sleepDocs = await db.collection('sleep')
        .where('babyId', '==', babyId)
        .where('startTime', '>=', yesterday)
        .get();
      const totalSleepMinutes = sleepDocs.docs.reduce((acc, d) => acc + (d.data().duration ?? 0), 0);

      // Generate insight
      const insight = {
        babyId,
        type: 'general',
        title: 'Daily Summary',
        message: `Yesterday: ${feedsCount} feeds, ${Math.round(totalSleepMinutes / 60 * 10) / 10} hours sleep.`,
        confidence: 95,
        actionable: false,
        createdAt: now,
      };

      await db.collection('aiPredictions').add(insight);
    }
    return null;
  });

// ─── Generate Doctor Report ───────────────────────────────────────────────────

export const generateDoctorReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { babyId } = data;
  if (!babyId) {
    throw new functions.https.HttpsError('invalid-argument', 'babyId is required');
  }

  const babyDoc = await db.collection('babies').doc(babyId).get();
  if (!babyDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Baby not found');
  }

  const now = admin.firestore.Timestamp.now();
  const thirtyDaysAgo = new admin.firestore.Timestamp(now.seconds - 2592000, 0);

  const [feeds, sleep, growth, vaccines, cryEvents] = await Promise.all([
    db.collection('feeds').where('babyId', '==', babyId).where('startTime', '>=', thirtyDaysAgo).get(),
    db.collection('sleep').where('babyId', '==', babyId).where('startTime', '>=', thirtyDaysAgo).get(),
    db.collection('growth').where('babyId', '==', babyId).orderBy('date', 'asc').get(),
    db.collection('vaccines').where('babyId', '==', babyId).get(),
    db.collection('cryEvents').where('babyId', '==', babyId).where('detectedAt', '>=', thirtyDaysAgo).get(),
  ]);

  return {
    baby: babyDoc.data(),
    reportDate: new Date().toISOString(),
    summary: {
      feedCount: feeds.size,
      avgDailySleepHours: sleep.docs.reduce((acc, d) => acc + (d.data().duration ?? 0), 0) / 60 / 30,
      growthEntries: growth.size,
      vaccinationsAdministered: vaccines.docs.filter((d) => d.data().status === 'administered').length,
      totalVaccinations: vaccines.size,
      cryEvents: cryEvents.size,
    },
    growth: growth.docs.map((d) => d.data()),
    recentFeeds: feeds.docs.slice(0, 10).map((d) => d.data()),
    vaccines: vaccines.docs.map((d) => d.data()),
  };
});

// ─── Family Invite ─────────────────────────────────────────────────────────────

export const sendFamilyInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { email, babyId, role, permission } = data;

  // Create invite record
  await db.collection('familyMembers').add({
    babyId,
    invitedBy: context.auth.uid,
    email,
    role,
    permission,
    status: 'pending',
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Send email (integrate with SendGrid/Firebase Email Extension in production)
  return { success: true, message: 'Invitation sent' };
});
