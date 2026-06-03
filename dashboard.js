const STORAGE_KEY = 'spn-multichat-settings-v010';

const defaults = {
  baseUrl: new URL('overlay/overlay.html', window.location.href).href,
  scheme: 'ws',
  host: '127.0.0.1',
  port: '8080',
  endpoint: '/',
  password: '',
  platformTwitch: true,
  platformYoutube: true,
  platformKick: true,
  showAvatar: true,
  showPlatformIcon: true,
  showTime: true,
  showBadges: true,
  showSharedBadge: true,
  fadeAnimation: true,
  maxMessages: '14',
  duration: '0',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: '18',
  lineHeight: '1.28',
  gap: '6',
  emoteNative: true,
  emoteBTTV: true,
  emoteFFZ: true,
  emote7TV: true,
  gifLinks: true,
  gifModOnly: false,
  gifMaxWidth: '220',
  bttvUserId: '',
  ffzRoom: '',
  seventvTwitchId: '',
  customEmotes: '{\n  "PickleHype": "https://cdn.7tv.app/emote/60ae958e229664e8667aea38/2x.webp"\n}',
  hideDeleted: true,
  hideBans: true,
  ignoreCommands: false,
  ignoreInternal: true,
  ignoredUsers: 'nightbot, streamelements, streamlabs, moobot, fossabot, sery_bot',
  previewRate: '1800',
  previewSeed: 'random-fake-users',
  previewAuto: true
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaults, ...saved };
  } catch (error) {
    console.warn('Unable to load settings. Using defaults.', error);
    return { ...defaults };
  }
}

let settings = loadSettings();
let debounceTimer = null;

function applySettingsToForm() {
  $$('[data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    if (!(key in settings)) return;
    if (input.type === 'checkbox') input.checked = Boolean(settings[key]);
    else input.value = settings[key];
  });
}

function readSettingsFromForm() {
  $$('[data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    settings[key] = input.type === 'checkbox' ? input.checked : input.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function addParam(params, key, value, defaultValue = undefined) {
  if (value === undefined || value === null) return;
  if (defaultValue !== undefined && String(value) === String(defaultValue)) return;
  if (typeof value === 'boolean') params.set(key, value ? '1' : '0');
  else if (String(value).trim() !== '') params.set(key, String(value).trim());
}

function enabledPlatforms() {
  const platforms = [];
  if (settings.platformTwitch) platforms.push('twitch');
  if (settings.platformYoutube) platforms.push('youtube');
  if (settings.platformKick) platforms.push('kick');
  return platforms.join(',') || 'none';
}

function buildUrl({ preview = false } = {}) {
  let base = settings.baseUrl || defaults.baseUrl;
  let url;
  try {
    url = new URL(base, window.location.href);
  } catch (error) {
    url = new URL(defaults.baseUrl, window.location.href);
  }

  const params = new URLSearchParams();
  addParam(params, 'platforms', enabledPlatforms());
  addParam(params, 'scheme', settings.scheme, defaults.scheme);
  addParam(params, 'host', settings.host, defaults.host);
  addParam(params, 'port', settings.port, defaults.port);
  addParam(params, 'endpoint', settings.endpoint, defaults.endpoint);
  addParam(params, 'password', settings.password, defaults.password);
  addParam(params, 'avatar', settings.showAvatar, defaults.showAvatar);
  addParam(params, 'platformIcon', settings.showPlatformIcon, defaults.showPlatformIcon);
  addParam(params, 'time', settings.showTime, defaults.showTime);
  addParam(params, 'badges', settings.showBadges, defaults.showBadges);
  addParam(params, 'sharedBadge', settings.showSharedBadge, defaults.showSharedBadge);
  addParam(params, 'fade', settings.fadeAnimation, defaults.fadeAnimation);
  addParam(params, 'maxMessages', settings.maxMessages, defaults.maxMessages);
  addParam(params, 'duration', settings.duration, defaults.duration);
  addParam(params, 'font', settings.fontFamily, defaults.fontFamily);
  addParam(params, 'fontSize', settings.fontSize, defaults.fontSize);
  addParam(params, 'lineHeight', settings.lineHeight, defaults.lineHeight);
  addParam(params, 'gap', settings.gap, defaults.gap);
  addParam(params, 'nativeEmotes', settings.emoteNative, defaults.emoteNative);
  addParam(params, 'bttv', settings.emoteBTTV, defaults.emoteBTTV);
  addParam(params, 'ffz', settings.emoteFFZ, defaults.emoteFFZ);
  addParam(params, 'seventv', settings.emote7TV, defaults.emote7TV);
  addParam(params, 'gifs', settings.gifLinks, defaults.gifLinks);
  addParam(params, 'gifModOnly', settings.gifModOnly, defaults.gifModOnly);
  addParam(params, 'gifMaxWidth', settings.gifMaxWidth, defaults.gifMaxWidth);
  addParam(params, 'bttvUserId', settings.bttvUserId, defaults.bttvUserId);
  addParam(params, 'ffzRoom', settings.ffzRoom, defaults.ffzRoom);
  addParam(params, 'seventvTwitchId', settings.seventvTwitchId, defaults.seventvTwitchId);
  addParam(params, 'customEmotes', settings.customEmotes, defaults.customEmotes);
  addParam(params, 'hideDeleted', settings.hideDeleted, defaults.hideDeleted);
  addParam(params, 'hideBans', settings.hideBans, defaults.hideBans);
  addParam(params, 'ignoreCommands', settings.ignoreCommands, defaults.ignoreCommands);
  addParam(params, 'ignoreInternal', settings.ignoreInternal, defaults.ignoreInternal);
  addParam(params, 'ignoredUsers', settings.ignoredUsers, defaults.ignoredUsers);
  addParam(params, 'previewRate', settings.previewRate, defaults.previewRate);
  addParam(params, 'previewSeed', settings.previewSeed, defaults.previewSeed);
  addParam(params, 'previewAuto', settings.previewAuto, defaults.previewAuto);
  if (preview) params.set('preview', '1');

  url.search = params.toString();
  return url.href;
}

function updateUrls({ reloadPreview = false } = {}) {
  const obsUrl = buildUrl({ preview: false });
  const previewUrl = buildUrl({ preview: true });
  $('#obsUrl').value = obsUrl;

  const frame = $('#previewFrame');
  if (reloadPreview || frame.src !== previewUrl) frame.src = previewUrl;
}

function scheduleUpdate() {
  readSettingsFromForm();
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => updateUrls({ reloadPreview: true }), 220);
}

async function copyUrl() {
  const value = $('#obsUrl').value;
  try {
    await navigator.clipboard.writeText(value);
    $('#copyStatus').textContent = 'Copied OBS URL to clipboard.';
  } catch (error) {
    $('#obsUrl').select();
    document.execCommand('copy');
    $('#copyStatus').textContent = 'Selected/copied OBS URL. If clipboard failed, press Ctrl+C.';
  }
}

function openOverlay() {
  window.open($('#obsUrl').value, '_blank', 'noopener,noreferrer');
}

function refreshPreview() {
  updateUrls({ reloadPreview: true });
  $('#copyStatus').textContent = 'Preview refreshed.';
}

function injectRandom() {
  const frame = $('#previewFrame');
  frame.contentWindow?.postMessage({ type: 'SPN_MULTICHAT_PREVIEW_RANDOM' }, '*');
  $('#copyStatus').textContent = 'Random preview message injected.';
}

function resetSettings() {
  settings = { ...defaults };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  applySettingsToForm();
  updateUrls({ reloadPreview: true });
  $('#copyStatus').textContent = 'Controls reset to defaults.';
}

applySettingsToForm();
updateUrls({ reloadPreview: true });

$$('[data-setting]').forEach((input) => {
  input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', scheduleUpdate);
});

$('#copyBtn').addEventListener('click', copyUrl);
$('#openBtn').addEventListener('click', openOverlay);
$('#refreshBtn').addEventListener('click', refreshPreview);
$('#injectBtn').addEventListener('click', injectRandom);
$('#resetBtn').addEventListener('click', resetSettings);
