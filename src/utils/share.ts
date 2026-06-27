import { Share, Linking, Platform } from 'react-native';

export async function shareViaWhatsApp(message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const url = `whatsapp://send?text=${encoded}`;

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // WhatsApp not installed — fall back to native share sheet
    await Share.share({ message });
  }
}

export function buildGrowthShareMessage(
  babyName: string,
  weight: number,
  height: number,
  date: string
): string {
  return (
    `🌱 *${babyName}* ka growth update! 🎉\n\n` +
    `⚖️ Weight: *${weight} kg*\n` +
    `📏 Height: *${height} cm*\n` +
    `📅 Date: ${date}\n\n` +
    `Tracked with *BabySaathi AI* 🧿\n` +
    `Hamara baby itna bada ho gaya! 💛`
  );
}

export function buildCulturalMilestoneShareMessage(
  babyName: string,
  ceremonyName: string,
  hindiName: string,
  emoji: string,
  date: string
): string {
  return (
    `${emoji} *${babyName}* ka *${ceremonyName}* (${hindiName}) manaya! 🎉\n\n` +
    `📅 ${date}\n\n` +
    `Yeh khushiyon ka pal hamesha yaad rahega! ✨\n` +
    `Tracked with *BabySaathi AI* 🧿\n` +
    `#BabySaathi #IndianBaby #${ceremonyName.replace(/\s+/g, '')}`
  );
}

export function buildMilestoneShareMessage(
  babyName: string,
  milestoneTitle: string,
  date: string
): string {
  return (
    `🏆 *${babyName}* ne milestone haasil kiya! 🎊\n\n` +
    `⭐ *${milestoneTitle}*\n` +
    `📅 ${date}\n\n` +
    `Tracked with *BabySaathi AI* 🧿\n` +
    `Hum bahut khush hain! 🥹💛`
  );
}
