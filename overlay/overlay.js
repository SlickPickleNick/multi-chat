const query = new URLSearchParams(window.location.search);

const defaults = {
  platforms: 'twitch,youtube,kick',
  scheme: 'ws',
  host: '127.0.0.1',
  port: '8080',
  endpoint: '/',
  password: '',
  avatar: true,
  avatarSize: 34,
  platformIcon: true,
  time: true,
  badges: true,
  sharedBadge: true,
  fade: true,
  textShadow: true,
  style: 'compact',
  overlayWidth: 450,
  overlayHeight: 1080,
  overlayPaddingLeft: 20,
  maxMessages: 14,
  duration: 0,
  font: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 18,
  lineHeight: 1.28,
  gap: 6,
  nativeEmotes: true,
  bttv: true,
  ffz: true,
  seventv: true,
  gifs: true,
  gifModOnly: true,
  gifMaxWidth: 220,
  bttvUserId: '',
  ffzRoom: '',
  seventvTwitchId: '',
  customEmotes: '{\n  "PickleHype": "https://cdn.7tv.app/emote/60ae958e229664e8667aea38/2x.webp"\n}',
  hideDeleted: true,
  hideBans: true,
  ignoreCommands: false,
  ignoreInternal: true,
  ignoredUsers: 'nightbot, streamelements, streamlabs, moobot, fossabot, sery_bot',
  preview: false,
  previewRate: 1800,
  previewSeed: 'random-chatters',
  previewAuto: true,
  debug: false
};

function boolParam(name, fallback) {
  const value = query.get(name);
  if (value === null) return fallback;
  return value === '1' || value === 'true' || value === 'yes';
}

function numberParam(name, fallback, min, max) {
  const value = Number(query.get(name));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeStyle(value) {
  const style = String(value || '').trim().toLowerCase();
  return ['compact', 'bubbles', 'cards'].includes(style) ? style : 'compact';
}

function normalizePreviewSeed(value) {
  const seed = String(value || '').trim().toLowerCase();
  if (['specified-users', 'specified', 'custom-users', 'set-users'].includes(seed)) return 'specified-users';
  return 'random-chatters';
}

const CONFIG = {
  platforms: (query.get('platforms') || defaults.platforms).split(',').map((p) => p.trim().toLowerCase()).filter(Boolean),
  scheme: query.get('scheme') || defaults.scheme,
  host: query.get('host') || defaults.host,
  port: query.get('port') || defaults.port,
  endpoint: query.get('endpoint') || defaults.endpoint,
  password: query.get('password') || defaults.password,
  avatar: boolParam('avatar', defaults.avatar),
  platformIcon: boolParam('platformIcon', defaults.platformIcon),
  time: boolParam('time', defaults.time),
  badges: boolParam('badges', defaults.badges),
  sharedBadge: boolParam('sharedBadge', defaults.sharedBadge),
  fade: boolParam('fade', defaults.fade),
  textShadow: boolParam('textShadow', defaults.textShadow),
  style: normalizeStyle(query.get('style') || defaults.style),
  overlayWidth: numberParam('overlayWidth', defaults.overlayWidth, 160, 1920),
  overlayHeight: numberParam('overlayHeight', defaults.overlayHeight, 120, 1080),
  overlayPaddingLeft: numberParam('overlayPaddingLeft', defaults.overlayPaddingLeft, 0, 400),
  avatarSize: numberParam('avatarSize', defaults.avatarSize, 16, 96),
  maxMessages: numberParam('maxMessages', defaults.maxMessages, 1, 80),
  duration: numberParam('duration', defaults.duration, 0, 600),
  font: query.get('font') || defaults.font,
  fontSize: numberParam('fontSize', defaults.fontSize, 10, 42),
  lineHeight: numberParam('lineHeight', defaults.lineHeight, 1, 2),
  gap: numberParam('gap', defaults.gap, 0, 20),
  nativeEmotes: boolParam('nativeEmotes', defaults.nativeEmotes),
  bttv: boolParam('bttv', defaults.bttv),
  ffz: boolParam('ffz', defaults.ffz),
  seventv: boolParam('seventv', defaults.seventv),
  gifs: boolParam('gifs', defaults.gifs),
  gifModOnly: boolParam('gifModOnly', defaults.gifModOnly),
  gifMaxWidth: numberParam('gifMaxWidth', defaults.gifMaxWidth, 80, 500),
  bttvUserId: query.get('bttvUserId') || defaults.bttvUserId,
  ffzRoom: query.get('ffzRoom') || defaults.ffzRoom,
  seventvTwitchId: query.get('seventvTwitchId') || defaults.seventvTwitchId,
  customEmotes: query.get('customEmotes') || defaults.customEmotes,
  hideDeleted: boolParam('hideDeleted', defaults.hideDeleted),
  hideBans: boolParam('hideBans', defaults.hideBans),
  ignoreCommands: boolParam('ignoreCommands', defaults.ignoreCommands),
  ignoreInternal: boolParam('ignoreInternal', defaults.ignoreInternal),
  ignoredUsers: query.get('ignoredUsers') || defaults.ignoredUsers,
  preview: boolParam('preview', defaults.preview),
  previewRate: numberParam('previewRate', defaults.previewRate, 400, 10000),
  previewSeed: normalizePreviewSeed(query.get('previewSeed') || defaults.previewSeed),
  previewAuto: boolParam('previewAuto', defaults.previewAuto),
  debug: boolParam('debug', defaults.debug)
};

document.documentElement.style.setProperty('--overlay-width', `${CONFIG.overlayWidth}px`);
document.documentElement.style.setProperty('--overlay-height', `${CONFIG.overlayHeight}px`);
document.documentElement.style.setProperty('--overlay-padding-left', `${CONFIG.overlayPaddingLeft}px`);
document.documentElement.style.setProperty('--avatar-size', `${CONFIG.avatarSize}px`);
document.documentElement.style.setProperty('--font-size', `${CONFIG.fontSize}px`);
document.documentElement.style.setProperty('--line-height', CONFIG.lineHeight);
document.documentElement.style.setProperty('--message-gap', `${CONFIG.gap}px`);
document.documentElement.style.setProperty('--gif-max-width', `${CONFIG.gifMaxWidth}px`);
document.body.style.fontFamily = CONFIG.font;
if (CONFIG.preview) document.body.classList.add('preview-mode');
document.body.classList.add(`style-${CONFIG.style}`);
if (!CONFIG.textShadow) document.body.classList.add('no-text-shadow');

const feed = document.getElementById('chatFeed');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('statusText');
const messageIndex = new Map();
const userMessageIndex = new Map();
const emoteMap = new Map();
const ignoredUsers = new Set(
  CONFIG.ignoredUsers.split(',').map((name) => normalizeName(name)).filter(Boolean)
);

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let availableEvents = null;
let previewTimer = null;

const EVENT_WISHLIST = {
  Twitch: [
    'ChatMessage',
    'Announcement',
    'ChatAnnouncement',
    'SharedChatAnnouncement',
    'ChatMessageDeleted',
    'SharedChatMessageDeleted',
    'ChatCleared',
    'UserTimedOut',
    'UserBanned',
    'SharedChatUserTimedout',
    'SharedChatUserBanned'
  ],
  YouTube: [
    'Message',
    'MessageDeleted',
    'UserBanned',
    'UserTimedOut'
  ],
  Kick: [
    'ChatMessage',
    'MessageDeleted',
    'UserBanned',
    'UserTimedOut'
  ]
};

const PREVIEW_RANDOM_USERS = [
  { platform: 'twitch', name: 'PixelPickle', color: '#b195ff', mod: true, avatar: 'https://unavatar.io/twitch/pixelpickle' },
  { platform: 'twitch', name: 'RaidCaptain', color: '#71c7ff', shared: true, avatar: 'https://unavatar.io/twitch/raidcaptain' },
  { platform: 'youtube', name: 'VODWatcher', color: '#CD201F' },
  { platform: 'youtube', name: 'ClipCollector', color: '#CD201F', mod: true },
  { platform: 'kick', name: 'KickCrew', color: '#00e701' },
  { platform: 'kick', name: 'GreenRoomer', color: '#00e701', mod: true }
];

const PREVIEW_SPECIFIED_USERS = [
  {
    platform: 'twitch',
    name: 'SlickPickleNick',
    color: '#9146FF',
    mod: true,
    shared: false,
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/9c4889dd-5c06-4695-90ff-4e3a42816f67-profile_image-70x70.png'
  },
  {
    platform: 'twitch',
    name: 'SlickZayyy',
    color: '#FF0000',
    mod: true,
    shared: true,
    avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/15f36780-922d-4eb4-9c30-6eb5b3d4561d-profile_image-70x70.png'
  }
];

function getPreviewUserPool() {
  return CONFIG.previewSeed === 'specified-users' ? PREVIEW_SPECIFIED_USERS : PREVIEW_RANDOM_USERS;
}

const PREVIEW_MESSAGES = [
  'This compact feed is clean PickleHype',
  'Shared chat test message from another Twitch channel',
  'Does this support 7TV and BTTV emotes yet?',
  'That play was wild',
  'GIF test https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
  '!command should hide when command filtering is on',
  'YouTube chat coming through clean',
  'Kick message in the same overlay',
  'Profile image fallback should show the user icon',
  'Streamer.bot WebSocket is doing the bridge work',
  'Announcement test: chat, this one should be highlighted'
];

const AVATAR_KEYS = [
  'profileImageUrl',
  'imageUrl',
  'userImageUrl',
  'userImageURL',
  'targetUserProfileImageUrl',
  'targetUserProfileImageURL',
  'profileImageURL',
  'profile_image_url',
  'profileImage',
  'avatarUrl',
  'avatarURL',
  'avatar_url',
  'avatar',
  'userProfileImageUrl',
  'userProfileImage',
  'photoUrl',
  'photoURL',
  'photo',
  'pictureUrl',
  'pictureURL',
  'picture',
  'thumbnailUrl',
  'thumbnail'
];


function normalizeName(value) {
  return String(value || '').trim().replace(/^@/, '').toLowerCase();
}

function log(...args) {
  if (CONFIG.debug) console.log('[SPN Multichat]', ...args);
}

function setStatus(kind, text, persistent = false) {
  statusEl.className = `system-status ${kind || ''} visible`;
  statusText.textContent = text;
  postStatus(kind || '', text || '');
  if (!persistent) {
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 2200);
  }
}

function postStatus(kind, text) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SPN_MULTICHAT_STATUS', status: kind, text }, '*');
    }
  } catch (error) {
    log('Unable to post status to parent', error);
  }
}

function isPlatformEnabled(platform) {
  return CONFIG.platforms.includes(platform) && !CONFIG.platforms.includes('none');
}

function wsUrl() {
  let endpoint = CONFIG.endpoint || '/';
  if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;
  return `${CONFIG.scheme}://${CONFIG.host}:${CONFIG.port}${endpoint}`;
}

async function sha256Base64(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const binary = String.fromCharCode(...new Uint8Array(digest));
  return btoa(binary);
}

async function buildAuthentication(password, salt, challenge) {
  const secret = await sha256Base64(password + salt);
  return sha256Base64(secret + challenge);
}

function sendRequest(request) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(request));
}

function connect() {
  if (CONFIG.preview) return;
  setStatus('connecting', 'Connecting...', true);
  try {
    socket = new WebSocket(wsUrl());
  } catch (error) {
    setStatus('disconnected', 'WebSocket URL failed', true);
    scheduleReconnect();
    return;
  }

  socket.addEventListener('open', () => {
    reconnectAttempts = 0;
    setStatus('connected', 'Connected!');
    log('Connected to Streamer.bot WebSocket');
  });

  socket.addEventListener('message', async (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      log('Non-JSON message received', event.data);
      return;
    }
    await handleSocketPayload(payload);
  });

  socket.addEventListener('close', () => {
    setStatus('disconnected', 'Disconnected', true);
    scheduleReconnect();
  });

  socket.addEventListener('error', (error) => {
    log('Socket error', error);
    setStatus('disconnected', 'Connection error', true);
  });
}

function scheduleReconnect() {
  if (CONFIG.preview) return;
  window.clearTimeout(reconnectTimer);
  const delay = Math.min(15000, 1200 + reconnectAttempts * 1500);
  reconnectAttempts += 1;
  reconnectTimer = window.setTimeout(connect, delay);
}

async function handleSocketPayload(payload) {
  if (payload.request === 'Hello') {
    if (payload.authentication && CONFIG.password) {
      try {
        const authentication = await buildAuthentication(
          CONFIG.password,
          payload.authentication.salt,
          payload.authentication.challenge
        );
        sendRequest({ request: 'Authenticate', id: `spn-auth-${Date.now()}`, authentication });
      } catch (error) {
        setStatus('disconnected', 'Authentication failed', true);
        log('Authentication generation failed', error);
        return;
      }
    }
    sendRequest({ request: 'GetEvents', id: `spn-events-${Date.now()}` });
    return;
  }

  if (payload.id && String(payload.id).startsWith('spn-auth')) {
    sendRequest({ request: 'GetEvents', id: `spn-events-${Date.now()}` });
    return;
  }

  if (payload.id && String(payload.id).startsWith('spn-events')) {
    availableEvents = payload.events || null;
    subscribeToEvents();
    return;
  }

  if (payload.event || payload.source || payload.data) {
    handleStreamerEvent(payload);
  }
}

function subscribeToEvents() {
  const events = {};
  Object.entries(EVENT_WISHLIST).forEach(([source, wanted]) => {
    const enabled = source === 'Twitch' ? isPlatformEnabled('twitch') : source === 'YouTube' ? isPlatformEnabled('youtube') : isPlatformEnabled('kick');
    if (!enabled) return;
    const available = getAvailableForSource(source);
    let selected = available ? wanted.filter((eventName) => available.some((item) => String(item).toLowerCase() === eventName.toLowerCase())) : wanted;
    if (available && !selected.length) selected = wanted;
    if (source === 'Twitch') {
      ['Announcement', 'ChatAnnouncement', 'SharedChatAnnouncement'].forEach((eventName) => {
        if (!selected.includes(eventName)) selected.push(eventName);
      });
    }
    if (selected.length) events[source] = selected;
  });

  if (!Object.keys(events).length) {
    setStatus('disconnected', 'No chat events found', true);
    log('No matching events available', availableEvents);
    return;
  }

  sendRequest({ request: 'Subscribe', id: `spn-subscribe-${Date.now()}`, events });
  log('Subscribed to events', events);
}

function getAvailableForSource(source) {
  if (!availableEvents) return null;
  if (Array.isArray(availableEvents)) {
    const match = availableEvents.find((item) => {
      const itemSource = item?.source || item?.name || item?.id || '';
      return String(itemSource).toLowerCase() === source.toLowerCase();
    });
    return flattenEventNames(match || availableEvents);
  }
  const keys = Object.keys(availableEvents);
  const match = keys.find((key) => key.toLowerCase() === source.toLowerCase());
  if (!match) return null;
  return flattenEventNames(availableEvents[match]);
}

function flattenEventNames(value) {
  const names = [];
  const visit = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      names.push(item.trim());
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (typeof item === 'object') {
      const direct = item.type || item.name || item.event || item.eventName || item.id;
      if (typeof direct === 'string') names.push(direct.trim());
      Object.values(item).forEach((child) => {
        if (Array.isArray(child) || (child && typeof child === 'object')) visit(child);
      });
    }
  };
  visit(value);
  return Array.from(new Set(names.filter(Boolean)));
}

function handleStreamerEvent(payload) {
  const eventInfo = payload.event || payload.Event || {};
  const source = normalizeSource(eventInfo.source || payload.source || payload.Source || '');
  const type = String(eventInfo.type || payload.type || payload.Type || '').trim();
  const data = payload.data || payload.Data || payload;
  const platform = sourceToPlatform(source);

  if (!platform || !isPlatformEnabled(platform)) return;
  if (isModerationEvent(type)) {
    handleModerationEvent(platform, type, data);
    return;
  }

  if (!isChatEvent(platform, type)) return;
  const normalized = normalizeMessage(platform, type, data);
  if (!normalized) return;
  addMessage(normalized);
}

function normalizeSource(source) {
  const value = String(source || '').toLowerCase();
  if (value.includes('twitch')) return 'Twitch';
  if (value.includes('youtube')) return 'YouTube';
  if (value.includes('kick')) return 'Kick';
  return source;
}

function sourceToPlatform(source) {
  if (source === 'Twitch') return 'twitch';
  if (source === 'YouTube') return 'youtube';
  if (source === 'Kick') return 'kick';
  return '';
}

function isChatEvent(platform, type) {
  const eventType = String(type || '');
  if (platform === 'twitch') return eventType === 'ChatMessage' || /announcement/i.test(eventType);
  if (platform === 'youtube') return eventType === 'Message';
  if (platform === 'kick') return eventType === 'ChatMessage';
  return false;
}

function isModerationEvent(type) {
  return /deleted|cleared|banned|timeout|timedout/i.test(String(type || ''));
}

function handleModerationEvent(platform, type, data) {
  if (/deleted/i.test(type) && CONFIG.hideDeleted) {
    const id = data.messageId || data.msgId || data.targetMessageId || data.sourceMessageId;
    if (id) removeMessageById(id);
    return;
  }

  if (/cleared/i.test(type) && CONFIG.hideDeleted) {
    clearMessages();
    return;
  }

  if (/(banned|timeout|timedout)/i.test(type) && CONFIG.hideBans) {
    const user = data.targetUser || data.user || data.bannedUser || data.timedOutUser || data.target || data;
    const identifiers = [user?.id, user?.login, user?.name, user?.displayName, user?.username].filter(Boolean);
    identifiers.forEach((identifier) => removeMessagesByUser(identifier));
  }
}

function normalizeMessage(platform, type, data) {
  if (CONFIG.ignoreInternal && (data.isTest || data.isInternal || data.meta?.isTest || data.meta?.internal)) return null;

  const user = data.user || data.author || data.sender || data.chatter || {};
  const isAnnouncement = platform === 'twitch' && /announcement/i.test(String(type || ''));
  const username =
    user.displayName || user.name || user.username || user.login || data.displayName || data.userName || data.username || (isAnnouncement ? 'Announcement' : 'Unknown User');
  const normalizedName = normalizeName(username);
  if (!normalizedName || ignoredUsers.has(normalizedName)) return null;

  const rawText = getMessageText(data);
  if (!rawText && !Array.isArray(data.parts)) return null;
  if (CONFIG.ignoreCommands && String(rawText).trim().startsWith('!')) return null;

  const userId = user.id || user.userId || data.userId || user.login || normalizedName;
  const messageId = data.messageId || data.msgId || data.id || `${platform}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const badges = Array.isArray(user.badges) ? user.badges : Array.isArray(data.badges) ? data.badges : [];
  const isShared = Boolean(data.isInSharedChat || data.isFromSharedChatGuest || data.sharedChatSource || data.source);
  const sharedSource = data.sharedChatSource || data.source || null;
  const announcementColor = isAnnouncement ? normalizeAnnouncementColor(data.announcementColor || data.color || data.announcement?.color || data.announcement?.announcementColor) : null;
  const avatarUrl = getAvatarUrl(user, data, platform, normalizedName);

  return {
    platform,
    type,
    id: messageId,
    userId,
    username,
    userColor: platform === 'youtube' || platform === 'kick'
      ? platformDefaultColor(platform)
      : user.color || data.color || (isAnnouncement ? announcementColor : '') || platformDefaultColor(platform),
    avatarUrl,
    text: rawText,
    parts: Array.isArray(data.parts) ? data.parts : null,
    emotes: Array.isArray(data.emotes) ? data.emotes : [],
    badges,
    isMod: isModerator(user, badges, data),
    isShared,
    sharedSource,
    isAnnouncement,
    announcementColor,
    timestamp: new Date()
  };
}

function getMessageText(data) {
  if (typeof data.text === 'string' && data.text) return data.text;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (typeof data.systemMessage === 'string' && data.systemMessage) return data.systemMessage;
  if (typeof data.content === 'string' && data.content) return data.content;
  if (typeof data.body === 'string' && data.body) return data.body;
  if (Array.isArray(data.parts)) return data.parts.map((part) => part?.text || part?.name || part?.value || '').join('');
  return '';
}

function getAvatarUrl(user, data, platform = '', normalizedName = '') {
  const likelyContainers = [
    user,
    data.user,
    data.author,
    data.sender,
    data.chatter,
    data.message?.user,
    data.message?.author,
    data.event?.user,
    data
  ].filter(Boolean);

  for (const container of likelyContainers) {
    const direct = findDirectAvatarValue(container);
    if (direct) return direct;
  }

  for (const container of likelyContainers) {
    const nested = findNestedAvatarValue(container);
    if (nested) return nested;
  }

  if (platform === 'twitch' && normalizedName) {
    return `https://unavatar.io/twitch/${encodeURIComponent(normalizedName)}`;
  }

  return '';
}

function findDirectAvatarValue(container) {
  if (!container || typeof container !== 'object') return '';
  for (const key of AVATAR_KEYS) {
    if (Object.prototype.hasOwnProperty.call(container, key)) {
      const value = normalizeAvatarValue(container[key]);
      if (value) return value;
    }
  }
  return '';
}

function findNestedAvatarValue(value, depth = 0, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || depth > 4 || seen.has(value)) return '';
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedAvatarValue(item, depth + 1, seen);
      if (found) return found;
    }
    return '';
  }

  for (const [key, candidate] of Object.entries(value)) {
    const keyText = key.toLowerCase();
    if (/(avatar|profile.*image|profileimage|user.*image|photo|picture|thumbnail)/i.test(keyText)) {
      const normalized = normalizeAvatarValue(candidate);
      if (normalized) return normalized;
    }
  }

  for (const candidate of Object.values(value)) {
    const found = findNestedAvatarValue(candidate, depth + 1, seen);
    if (found) return found;
  }

  return '';
}

function normalizeAvatarValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return isHttpImageishUrl(value) ? value : '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeAvatarValue(item);
      if (normalized) return normalized;
    }
    return '';
  }
  if (typeof value === 'object') {
    const keys = ['url', 'src', 'href', 'uri', 'link'];
    for (const key of keys) {
      const normalized = normalizeAvatarValue(value[key]);
      if (normalized) return normalized;
    }
  }
  return '';
}

function isHttpImageishUrl(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol);
  } catch {
    return false;
  }
}

function isModerator(user, badges, data) {
  const flags = [user.isModerator, user.isBroadcaster, user.moderator, data.isModerator, data.isBroadcaster];
  if (flags.some(Boolean)) return true;
  if (typeof user.role === 'number' && user.role >= 2) return true;
  return badges.some((badge) => /moderator|broadcaster|owner|staff/i.test(`${badge.name || ''} ${badge.info || ''}`));
}

function normalizeAnnouncementColor(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    blue: '#3ea6ff',
    green: '#00db84',
    orange: '#ff9f1c',
    purple: '#9146ff',
    primary: '#9146ff'
  };
  if (map[raw]) return map[raw];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw;
  if (/^rgba?\(/i.test(raw)) return raw;
  return '#9146ff';
}

function toRgba(color, alpha) {
  const raw = String(color || '').trim();
  if (/^rgba?\(/i.test(raw)) return raw;
  let hex = raw.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
  const intValue = Number.parseInt(hex, 16);
  if (!Number.isFinite(intValue)) return `rgba(145, 70, 255, ${alpha})`;
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function platformDefaultColor(platform) {
  if (platform === 'twitch') return '#b195ff';
  if (platform === 'youtube') return '#CD201F';
  if (platform === 'kick') return '#00e701';
  return '#ffffff';
}

function addMessage(message) {
  const node = renderMessage(message);
  feed.appendChild(node);
  messageIndex.set(String(message.id), node);
  addUserMessageReference(message.userId, node);
  addUserMessageReference(message.username, node);
  trimMessages();

  if (CONFIG.duration > 0) {
    window.setTimeout(() => removeNode(node), CONFIG.duration * 1000);
  }
}

function addUserMessageReference(identifier, node) {
  const key = normalizeName(identifier);
  if (!key) return;
  if (!userMessageIndex.has(key)) userMessageIndex.set(key, new Set());
  userMessageIndex.get(key).add(node);
}

function trimMessages() {
  while (feed.children.length > CONFIG.maxMessages) {
    removeNode(feed.firstElementChild, true);
  }
}

function removeMessageById(messageId) {
  const node = messageIndex.get(String(messageId));
  if (node) removeNode(node);
}

function removeMessagesByUser(identifier) {
  const key = normalizeName(identifier);
  const nodes = userMessageIndex.get(key);
  if (!nodes) return;
  Array.from(nodes).forEach((node) => removeNode(node));
}

function clearMessages() {
  Array.from(feed.children).forEach((node) => removeNode(node, true));
}

function removeNode(node, immediate = false) {
  if (!node || !node.parentElement) return;
  [...messageIndex.entries()].forEach(([id, indexedNode]) => {
    if (indexedNode === node) messageIndex.delete(id);
  });
  [...userMessageIndex.values()].forEach((set) => set.delete(node));

  if (immediate || !CONFIG.fade) {
    node.remove();
    return;
  }
  node.classList.add('fading');
  window.setTimeout(() => node.remove(), 380);
}

function renderMessage(message) {
  const article = document.createElement('article');
  const showAvatar = CONFIG.avatar;
  article.className = `message ${message.platform}${showAvatar ? '' : ' no-avatar'}${message.isAnnouncement ? ' announcement' : ''}`;
  article.dataset.messageId = message.id;
  article.dataset.userId = message.userId || '';
  article.dataset.announcement = message.isAnnouncement ? 'true' : 'false';
  article.style.setProperty('--user-color', message.userColor || platformDefaultColor(message.platform));

  if (message.isAnnouncement) {
    const announcementColor = message.announcementColor || '#9146ff';
    article.style.setProperty('--announcement-bg', toRgba(announcementColor, 0.66));
    article.style.setProperty('--announcement-bg-soft', toRgba(announcementColor, 0.28));
    article.style.setProperty('--announcement-border', toRgba(announcementColor, 0.98));
    if (CONFIG.style === 'cards') {
      article.classList.add('announcement-card');
      article.style.setProperty('border-color', 'var(--announcement-border)', 'important');
      article.style.setProperty('background', 'linear-gradient(90deg, var(--announcement-bg), var(--announcement-bg-soft)), rgba(10, 12, 20, 0.42)', 'important');
      article.style.setProperty('box-shadow', 'inset 0 0 0 1px rgba(255, 255, 255, 0.10), 0 12px 34px rgba(0, 0, 0, 0.32)', 'important');
    }
  }

  if (showAvatar) {
    article.appendChild(renderAvatar(message.avatarUrl, message.username));
  }

  const body = document.createElement('div');
  body.className = 'body';

  const messageText = document.createElement('span');
  messageText.className = 'message-text';
  messageText.appendChild(renderMeta(message));
  renderMessageParts(message, messageText);
  body.appendChild(messageText);

  article.appendChild(body);
  return article;
}

function renderAvatar(url, username) {
  const avatar = document.createElement('span');
  avatar.className = 'avatar';
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      img.remove();
      avatar.appendChild(fallbackUserIcon());
    };
    avatar.appendChild(img);
  } else {
    avatar.appendChild(fallbackUserIcon());
  }
  avatar.title = username;
  return avatar;
}

function fallbackUserIcon() {
  const wrapper = document.createElement('span');
  wrapper.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 12.2c2.35 0 4.25-1.9 4.25-4.25S14.35 3.7 12 3.7 7.75 5.6 7.75 7.95s1.9 4.25 4.25 4.25Zm0 2.05c-3.05 0-7.25 1.58-7.25 4.55 0 .82.66 1.5 1.48 1.5h11.54c.82 0 1.48-.68 1.48-1.5 0-2.97-4.2-4.55-7.25-4.55Z"/>
    </svg>`;
  return wrapper.firstElementChild;
}

function renderMeta(message) {
  const meta = document.createElement('span');
  meta.className = 'meta';
  if (CONFIG.platformIcon) meta.appendChild(platformIcon(message.platform));
  if (message.isAnnouncement) meta.appendChild(announcementIcon());

  const username = document.createElement('span');
  username.className = 'username';
  username.textContent = message.username;
  meta.appendChild(username);

  if (CONFIG.badges) renderBadges(message.badges, meta);

  if (CONFIG.sharedBadge && message.isShared) {
    const badge = document.createElement('span');
    badge.className = 'badge-text shared-badge';
    const source = message.sharedSource?.name || message.sharedSource?.login || '';
    badge.textContent = source ? `Shared: ${source}` : 'Shared';
    meta.appendChild(badge);
  }

  if (CONFIG.time) {
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = formatTime(message.timestamp);
    meta.appendChild(time);
  }

  return meta;
}

function announcementIcon() {
  const wrapper = document.createElement('span');
  wrapper.className = 'announcement-icon';
  wrapper.title = 'Twitch announcement';
  wrapper.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6.2-1.8-2.15V9.2a5.22 5.22 0 0 0-4.1-5.1V3.4a1.1 1.1 0 1 0-2.2 0v.7a5.22 5.22 0 0 0-4.1 5.1v4.45L5 15.8a1.1 1.1 0 0 0 .84 1.8h12.32A1.1 1.1 0 0 0 19 15.8Z"/>
    </svg>`;
  return wrapper;
}

function platformIcon(platform) {
  const icon = document.createElement('span');
  icon.className = `platform-icon ${platform}`;
  icon.title = platformLabel(platform);
  icon.appendChild(platformSvg(platform));
  return icon;
}

function platformLabel(platform) {
  if (platform === 'twitch') return 'Twitch';
  if (platform === 'youtube') return 'YouTube';
  if (platform === 'kick') return 'Kick';
  return 'Platform';
}

function platformSvg(platform) {
  const wrapper = document.createElement('span');
  if (platform === 'youtube') {
    wrapper.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#FF0033" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.9 12l-6.3 3.6Z"/></svg>';
  } else if (platform === 'twitch') {
    wrapper.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#9146FF" d="M11.6 4.7h1.7v5.1h-1.7Zm4.7 0H18v5.1h-1.7ZM6 0 1.7 4.3v15.4h5.1V24l4.3-4.3h3.4L22.3 12V0Zm14.6 11.1-3.4 3.4h-3.4l-3 3v-3H6.9V1.7h13.7Z"/></svg>';
  } else {
    wrapper.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#53FC18" d="M4 3h6.6v5.2h2.1L16.8 3H24l-6.3 7.8L24 21h-7.5l-3.9-6.4h-2V21H4Z"/></svg>';
  }
  return wrapper.firstElementChild;
}

function renderBadges(badges, container) {
  if (!Array.isArray(badges)) return;
  badges.slice(0, 5).forEach((badge) => {
    if (badge?.imageUrl) {
      const img = document.createElement('img');
      img.className = 'badge-img';
      img.src = badge.imageUrl;
      img.alt = badge.name || 'badge';
      img.title = badge.name || '';
      img.referrerPolicy = 'no-referrer';
      container.appendChild(img);
    } else if (badge?.name) {
      const span = document.createElement('span');
      span.className = 'badge-text';
      span.textContent = badge.name;
      container.appendChild(span);
    }
  });
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function renderMessageParts(message, container) {
  const segments = buildNativeEmoteSegments(message.text, CONFIG.nativeEmotes ? message.emotes : []);
  segments.forEach((segment) => {
    if (segment.type === 'emote') {
      container.appendChild(renderEmote(segment.url, segment.name));
    } else {
      renderTextWithAssets(segment.text, container, message);
    }
  });
}

function buildNativeEmoteSegments(text, emotes) {
  const source = String(text || '');
  const valid = (emotes || [])
    .filter((emote) => Number.isInteger(emote.startIndex) && Number.isInteger(emote.endIndex) && emote.imageUrl)
    .sort((a, b) => a.startIndex - b.startIndex);
  if (!valid.length) return [{ type: 'text', text: source }];

  const segments = [];
  let cursor = 0;
  valid.forEach((emote) => {
    const start = Math.max(0, emote.startIndex);
    const end = Math.min(source.length - 1, emote.endIndex);
    if (start > cursor) segments.push({ type: 'text', text: source.slice(cursor, start) });
    segments.push({ type: 'emote', url: emote.imageUrl, name: emote.name || source.slice(start, end + 1) });
    cursor = end + 1;
  });
  if (cursor < source.length) segments.push({ type: 'text', text: source.slice(cursor) });
  return segments;
}

function renderTextWithAssets(text, container, message) {
  const chunks = String(text || '').split(/(\s+)/);
  chunks.forEach((chunk) => {
    if (!chunk) return;
    if (/^\s+$/.test(chunk)) {
      container.appendChild(document.createTextNode(chunk));
      return;
    }

    const cleanToken = chunk.replace(/[.,!?;:)]*$/g, '');
    const trailing = chunk.slice(cleanToken.length);
    const emoteUrl = emoteMap.get(cleanToken);
    if (emoteUrl) {
      container.appendChild(renderEmote(emoteUrl, cleanToken));
      if (trailing) container.appendChild(document.createTextNode(trailing));
      return;
    }

    if (isGifUrl(cleanToken)) {
      renderGifOrFallback(cleanToken, container, message);
      if (trailing) container.appendChild(document.createTextNode(trailing));
      return;
    }

    container.appendChild(document.createTextNode(chunk));
  });
}

function renderEmote(url, name) {
  const img = document.createElement('img');
  img.className = 'emote';
  img.src = url;
  img.alt = name || 'emote';
  img.title = name || '';
  img.referrerPolicy = 'no-referrer';
  return img;
}

function isGifUrl(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && /\.gif(?:$|[?#])/i.test(url.href);
  } catch {
    return false;
  }
}

function renderGifOrFallback(url, container, message) {
  const shouldShowGif = CONFIG.gifs && (!CONFIG.gifModOnly || message.isMod);
  if (shouldShowGif) {
    const img = document.createElement('img');
    img.className = 'gif-preview';
    img.src = url;
    img.alt = 'GIF posted in chat';
    img.referrerPolicy = 'no-referrer';
    container.appendChild(img);
  } else {
    const link = document.createElement('a');
    link.className = 'link-fallback';
    link.href = url;
    link.textContent = CONFIG.gifModOnly ? '[GIF hidden: mods only]' : '[GIF hidden]';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    container.appendChild(link);
  }
}

async function loadEmotes() {
  parseCustomEmotes();
  const tasks = [];
  if (CONFIG.bttv) tasks.push(loadBTTV());
  if (CONFIG.ffz) tasks.push(loadFFZ());
  if (CONFIG.seventv) tasks.push(load7TV());
  await Promise.allSettled(tasks);
  log('Loaded emotes:', emoteMap.size);
}

function parseCustomEmotes() {
  if (!CONFIG.customEmotes) return;
  try {
    const parsed = JSON.parse(CONFIG.customEmotes);
    Object.entries(parsed).forEach(([name, url]) => {
      if (name && url) emoteMap.set(name, url);
    });
  } catch (error) {
    log('Custom emote map was not valid JSON', error);
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadBTTV() {
  try {
    const global = await fetchJson('https://api.betterttv.net/3/cached/emotes/global');
    global.forEach((emote) => emoteMap.set(emote.code, `https://cdn.betterttv.net/emote/${emote.id}/2x`));
  } catch (error) {
    log('BTTV global load failed', error);
  }

  if (!CONFIG.bttvUserId) return;
  try {
    const channel = await fetchJson(`https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(CONFIG.bttvUserId)}`);
    [...(channel.channelEmotes || []), ...(channel.sharedEmotes || [])].forEach((emote) => {
      emoteMap.set(emote.code, `https://cdn.betterttv.net/emote/${emote.id}/2x`);
    });
  } catch (error) {
    log('BTTV channel load failed', error);
  }
}

async function loadFFZ() {
  try {
    const global = await fetchJson('https://api.frankerfacez.com/v1/set/global');
    Object.values(global.sets || {}).forEach((set) => {
      (set.emoticons || []).forEach((emote) => {
        const url = emote.urls?.['2'] || emote.urls?.['1'] || emote.urls?.['4'];
        if (url) emoteMap.set(emote.name, normalizeProtocolUrl(url));
      });
    });
  } catch (error) {
    log('FFZ global load failed', error);
  }

  if (!CONFIG.ffzRoom) return;
  try {
    const room = await fetchJson(`https://api.frankerfacez.com/v1/room/${encodeURIComponent(CONFIG.ffzRoom)}`);
    Object.values(room.sets || {}).forEach((set) => {
      (set.emoticons || []).forEach((emote) => {
        const url = emote.urls?.['2'] || emote.urls?.['1'] || emote.urls?.['4'];
        if (url) emoteMap.set(emote.name, normalizeProtocolUrl(url));
      });
    });
  } catch (error) {
    log('FFZ room load failed', error);
  }
}

async function load7TV() {
  try {
    const global = await fetchJson('https://7tv.io/v3/emote-sets/global');
    (global.emotes || []).forEach((emote) => {
      const url = best7TVUrl(emote.data || emote);
      if (url) emoteMap.set(emote.name, url);
    });
  } catch (error) {
    log('7TV global load failed', error);
  }

  if (!CONFIG.seventvTwitchId) return;
  try {
    const user = await fetchJson(`https://7tv.io/v3/users/twitch/${encodeURIComponent(CONFIG.seventvTwitchId)}`);
    (user.emote_set?.emotes || []).forEach((emote) => {
      const url = best7TVUrl(emote.data || emote);
      if (url) emoteMap.set(emote.name, url);
    });
  } catch (error) {
    log('7TV channel load failed', error);
  }
}

function normalizeProtocolUrl(url) {
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
}

function best7TVUrl(data) {
  const host = data.host;
  if (!host) return '';
  const file = [...(host.files || [])]
    .filter((candidate) => /webp|gif|png/i.test(candidate.format || candidate.name || ''))
    .sort((a, b) => (b.width || 0) - (a.width || 0))[0] || host.files?.[0];
  if (!file) return '';
  const base = host.url?.startsWith('//') ? `https:${host.url}` : host.url;
  return `${base}/${file.name}`;
}

function startPreview() {
  document.body.classList.add('preview-mode');
  setStatus('preview', 'Preview mode', true);
  const initialCount = Math.min(6, CONFIG.maxMessages);
  for (let i = 0; i < initialCount; i += 1) {
    window.setTimeout(() => addMessage(randomPreviewMessage()), i * 120);
  }
  if (CONFIG.previewAuto) {
    previewTimer = window.setInterval(() => addMessage(randomPreviewMessage()), CONFIG.previewRate);
  }
}

function randomPreviewMessage() {
  const pool = getPreviewUserPool();
  const availableUsers = pool.filter((user) => isPlatformEnabled(user.platform));
  const fallbackPool = pool.length ? pool : PREVIEW_RANDOM_USERS;
  const user = availableUsers[Math.floor(Math.random() * availableUsers.length)] || fallbackPool[0] || PREVIEW_RANDOM_USERS[0];
  const text = PREVIEW_MESSAGES[Math.floor(Math.random() * PREVIEW_MESSAGES.length)];
  const isAnnouncement = user.platform === 'twitch' && /announcement test/i.test(text);
  const announcementColor = isAnnouncement ? ['#9146ff', '#3ea6ff', '#00db84', '#ff9f1c'][Math.floor(Math.random() * 4)] : null;
  return {
    platform: user.platform,
    type: isAnnouncement ? 'Announcement' : user.platform === 'youtube' ? 'Message' : 'ChatMessage',
    id: `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: user.name,
    username: user.name,
    userColor: isAnnouncement ? announcementColor : user.color,
    avatarUrl: user.avatar || '',
    text,
    parts: null,
    emotes: [],
    badges: user.mod ? [{ name: 'Mod' }] : [],
    isMod: Boolean(user.mod),
    isShared: Boolean(user.shared),
    sharedSource: user.shared ? { name: 'Shared Channel' } : null,
    isAnnouncement,
    announcementColor,
    timestamp: new Date()
  };
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'SPN_MULTICHAT_PREVIEW_RANDOM') {
    addMessage(randomPreviewMessage());
  }
});

loadEmotes().finally(() => {
  if (CONFIG.preview) startPreview();
  else connect();
});
